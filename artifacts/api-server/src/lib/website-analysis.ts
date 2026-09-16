import dns from "node:dns/promises";
import net from "node:net";

const MAX_HTML_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export type ScanAnalysisResult = {
  overallScore: number;
  categoryScores: Array<{
    key: string;
    label: string;
    score: number;
    checked: boolean;
    note: string;
  }>;
  detectedFacts: {
    pageTitle: string | null;
    metaDescription: string | null;
    h1Count: number;
    headingCount: number;
    headings: string[];
    visibleTextLength: number;
    linkCount: number;
    imageCount: number;
    imagesWithAlt: number;
    ctaCount: number;
    callsToAction: string[];
    contactSignals: string[];
    technicalSignals: string[];
    responseTimeMs: number;
    pageSizeKb: number;
    https: boolean;
  };
  notChecked: string[];
  issues: Array<{
    id: string;
    title: string;
    severity: "high" | "medium" | "low";
    fact: string;
    recommendation: string;
  }>;
};

type WebsiteSnapshot = {
  url: URL;
  html: string;
  responseTimeMs: number;
};

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  const version = net.isIP(normalized);

  if (version === 4) {
    const octets = normalized.split(".").map(Number);
    const [first, second] = octets;
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  if (version === 6) {
    if (normalized.startsWith("::ffff:")) {
      return isPrivateAddress(normalized.slice(7));
    }

    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb") ||
      normalized.startsWith("ff")
    );
  }

  return true;
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.hostname === "localhost" ||
    url.hostname.endsWith(".local") ||
    url.hostname.endsWith(".internal")
  ) {
    throw new Error("Deze website kan niet veilig worden gecontroleerd.");
  }

  const addresses = await dns.lookup(url.hostname, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Deze website kan niet veilig worden gecontroleerd.");
  }
}

async function readLimitedBody(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_HTML_BYTES) {
    throw new Error("De homepage is te groot om veilig te analyseren.");
  }

  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error("De homepage is te groot om veilig te analyseren.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

async function fetchHomepage(rawUrl: string): Promise<WebsiteSnapshot> {
  let currentUrl = new URL(rawUrl);
  const startedAt = Date.now();

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicUrl(currentUrl);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "SiteCheckAI/1.0 (+website-analysis)",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new Error("De website kon niet worden opgehaald binnen de tijdslimiet.");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) {
        throw new Error("De website verwijst te vaak door of heeft geen geldige bestemming.");
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) {
      throw new Error(`De website gaf een foutmelding (${response.status}).`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("De opgegeven URL bevat geen HTML-homepage.");
    }

    return {
      url: currentUrl,
      html: await readLimitedBody(response),
      responseTimeMs: Date.now() - startedAt,
    };
  }

  throw new Error("De website kon niet worden opgehaald.");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value: string): string {
  return decodeEntities(
    value
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function getAttribute(tag: string, attribute: string): string | null {
  const match = tag.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1]?.trim() || null;
}

function extractMetaDescription(html: string): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const name = getAttribute(tag, "name") ?? getAttribute(tag, "property");
    if (name?.toLowerCase() === "description") {
      return getAttribute(tag, "content");
    }
  }
  return null;
}

function extractHeadings(html: string): { headings: string[]; h1Count: number } {
  const matches = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const headings = matches
    .map((match) => cleanText(match[2]))
    .filter(Boolean)
    .slice(0, 12);

  return {
    headings,
    h1Count: matches.filter((match) => match[1] === "1").length,
  };
}

function extractCallsToAction(html: string): string[] {
  const ctaPattern =
    /\b(start|bekijk|lees|ontdek|plan|boek|vraag|neem|contact|bel|offerte|gratis|download|aanmelden|inschrijven|shop|koop|learn|get|contact|book|buy|request)\b/i;
  const elements = html.match(/<(?:a|button|input)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi) ?? [];
  return elements
    .map((element) => cleanText(element))
    .filter((text) => text.length > 1 && ctaPattern.test(text))
    .map((text) => text.slice(0, 80))
    .filter((text, index, list) => list.indexOf(text) === index)
    .slice(0, 10);
}

function extractContactSignals(html: string, visibleText: string): string[] {
  const signals: string[] = [];
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(visibleText) || /mailto:/i.test(html)) {
    signals.push("E-mailadres gevonden");
  }
  if (/tel:/i.test(html) || /(?:\+31|0)\s?[\d\s().-]{8,}/.test(visibleText)) {
    signals.push("Telefoonnummer gevonden");
  }
  if (/\b(adres|address|straat|street|postcode|postal code|plaats|city)\b/i.test(visibleText)) {
    signals.push("Adres- of locatiesignaal gevonden");
  }
  return signals;
}

function getCategoryScores(facts: ScanAnalysisResult["detectedFacts"]): ScanAnalysisResult["categoryScores"] {
  const seoScore =
    (facts.pageTitle ? 25 : 0) +
    (facts.metaDescription ? 25 : 0) +
    (facts.h1Count === 1 ? 25 : facts.h1Count > 1 ? 15 : 0) +
    (facts.headingCount > 1 ? 15 : facts.headingCount === 1 ? 8 : 0) +
    (facts.https ? 10 : 0);
  const conversionScore = Math.min(
    100,
    (facts.ctaCount > 0 ? 45 : 0) +
      (facts.ctaCount > 1 ? 25 : 0) +
      (facts.contactSignals.length > 0 ? 30 : 0),
  );
  const technicalScore = Math.min(
    100,
    (facts.https ? 35 : 0) +
      (facts.responseTimeMs < 1000 ? 35 : facts.responseTimeMs < 2500 ? 22 : facts.responseTimeMs < 5000 ? 10 : 0) +
      (facts.pageSizeKb < 500 ? 30 : facts.pageSizeKb < 1500 ? 18 : 8),
  );
  const contentScore = Math.min(
    100,
    (facts.visibleTextLength >= 300 ? 45 : facts.visibleTextLength >= 120 ? 25 : 10) +
      (facts.headingCount >= 3 ? 30 : facts.headingCount > 0 ? 15 : 0) +
      (facts.pageTitle ? 25 : 0),
  );
  const trustScore = Math.min(
    100,
    (facts.https ? 40 : 0) +
      (facts.contactSignals.length > 0 ? 35 : 0) +
      (facts.ctaCount > 0 ? 25 : 0),
  );
  const localScore = Math.min(
    100,
    (facts.contactSignals.includes("Adres- of locatiesignaal gevonden") ? 60 : 0) +
      (facts.contactSignals.includes("Telefoonnummer gevonden") ? 20 : 0) +
      (facts.contactSignals.includes("E-mailadres gevonden") ? 20 : 0),
  );

  return [
    { key: "conversie", label: "Conversie", score: conversionScore, checked: true, note: facts.ctaCount > 0 ? "Call-to-actions gevonden op de homepage." : "Geen duidelijke call-to-action gevonden." },
    { key: "seo", label: "SEO", score: seoScore, checked: true, note: facts.metaDescription ? "Basiselementen voor zoekmachines gecontroleerd." : "De homepage mist minstens één belangrijk SEO-element." },
    { key: "mobiel", label: "Mobiel", score: 0, checked: false, note: "Niet gecontroleerd: er is geen echte mobiele browsercheck uitgevoerd." },
    { key: "techniek", label: "Techniek & snelheid", score: technicalScore, checked: true, note: "Laadtijd, paginagrootte, HTTPS en HTML-respons gecontroleerd." },
    { key: "content", label: "Content", score: contentScore, checked: true, note: "Tekstvolume, titel en koppen op de homepage gecontroleerd." },
    { key: "vertrouwen", label: "Vertrouwen", score: trustScore, checked: true, note: "HTTPS, contactsignalen en vervolgstappen gecontroleerd." },
    { key: "lokaal", label: "Lokale vindbaarheid", score: localScore, checked: true, note: "Contact- en locatiesignalen in de homepage gecontroleerd." },
  ];
}

function getIssues(
  facts: ScanAnalysisResult["detectedFacts"],
): ScanAnalysisResult["issues"] {
  const issues: ScanAnalysisResult["issues"] = [];

  if (!facts.metaDescription) {
    issues.push({
      id: "missing-meta-description",
      title: "Geen meta description gevonden",
      severity: "high",
      fact: "We vonden geen meta description in de HTML van de homepage.",
      recommendation: "Schrijf een korte, concrete omschrijving van de pagina die uitnodigt om vanuit Google door te klikken.",
    });
  }
  if (facts.h1Count === 0) {
    issues.push({
      id: "missing-h1",
      title: "Geen H1-kop gevonden",
      severity: "high",
      fact: "Er is geen H1-element gevonden op de homepage.",
      recommendation: "Voeg één duidelijke H1 toe die uitlegt wat je bedrijf aanbiedt en voor wie.",
    });
  } else if (facts.h1Count > 1) {
    issues.push({
      id: "multiple-h1",
      title: "Meerdere H1-koppen gevonden",
      severity: "medium",
      fact: `We vonden ${facts.h1Count} H1-koppen op de homepage.`,
      recommendation: "Maak één hoofdboodschap de H1 en gebruik H2-koppen voor de onderdelen daaronder.",
    });
  }
  if (facts.ctaCount === 0) {
    issues.push({
      id: "missing-cta",
      title: "Geen duidelijke call-to-action gevonden",
      severity: "high",
      fact: "We vonden geen herkenbare call-to-action in links of knoppen op de homepage.",
      recommendation: "Kies één logische volgende stap, zoals contact opnemen, een offerte aanvragen of een afspraak plannen.",
    });
  }
  if (facts.imageCount > 0 && facts.imagesWithAlt < facts.imageCount) {
    issues.push({
      id: "missing-image-alt",
      title: "Niet alle afbeeldingen hebben alt-tekst",
      severity: "medium",
      fact: `Van de ${facts.imageCount} afbeeldingen hebben ${facts.imagesWithAlt} een alt-tekst.`,
      recommendation: "Geef betekenisvolle afbeeldingen een korte alt-tekst en laat decoratieve afbeeldingen leeg met alt=\"\".",
    });
  }
  if (!facts.https) {
    issues.push({
      id: "missing-https",
      title: "De URL gebruikt geen HTTPS",
      severity: "high",
      fact: "De opgegeven homepage is opgehaald via HTTP.",
      recommendation: "Zet HTTPS aan met een geldig TLS-certificaat en stuur HTTP automatisch door naar HTTPS.",
    });
  }
  if (facts.responseTimeMs >= 2500) {
    issues.push({
      id: "slow-response",
      title: "De eerste respons is relatief traag",
      severity: facts.responseTimeMs >= 5000 ? "high" : "medium",
      fact: `De eerste HTML-respons duurde ${facts.responseTimeMs} ms.`,
      recommendation: "Onderzoek serverresponstijd, caching en zware serverlogica. Dit is een basismeting, geen volledige snelheidstest.",
    });
  }
  if (facts.contactSignals.length === 0) {
    issues.push({
      id: "missing-contact-signal",
      title: "Geen contactsignaal gevonden",
      severity: "medium",
      fact: "We vonden geen duidelijk e-mailadres, telefoonnummer of adres-signaal in de homepage.",
      recommendation: "Maak een laagdrempelige contactmogelijkheid zichtbaar op een plek die bezoekers snel herkennen.",
    });
  }
  if (facts.visibleTextLength < 120) {
    issues.push({
      id: "thin-homepage-content",
      title: "Weinig zichtbare tekst gevonden",
      severity: "medium",
      fact: `De homepage bevat ongeveer ${facts.visibleTextLength} tekens zichtbare tekst.`,
      recommendation: "Leg duidelijker uit wat je aanbiedt, voor wie het is en waarom iemand voor jou kiest.",
    });
  }

  return issues
    .sort((left, right) => {
      const weight = { high: 3, medium: 2, low: 1 };
      return weight[right.severity] - weight[left.severity];
    })
    .slice(0, 5);
}

function createAnalysis(snapshot: WebsiteSnapshot): ScanAnalysisResult {
  const { html, url, responseTimeMs } = snapshot;
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? cleanText(titleMatch[1]) || null : null;
  const metaDescription = extractMetaDescription(html);
  const { headings, h1Count } = extractHeadings(html);
  const visibleText = cleanText(html);
  const linkCount = (html.match(/<a\b[^>]*\bhref\s*=/gi) ?? []).length;
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithAlt = imageTags.filter((tag) => Boolean(getAttribute(tag, "alt"))).length;
  const callsToAction = extractCallsToAction(html);
  const contactSignals = extractContactSignals(html, visibleText);
  const hasViewport = /<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>/i.test(html);
  const hasCanonical = /<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/i.test(html);
  const hasLanguage = /<html\b[^>]*\blang\s*=/i.test(html);
  const technicalSignals = [
    url.protocol === "https:" ? "HTTPS actief" : "HTTP zonder HTTPS",
    hasViewport ? "Viewport-instelling gevonden" : "Geen viewport-instelling gevonden",
    hasCanonical ? "Canonical-link gevonden" : "Geen canonical-link gevonden",
    hasLanguage ? "Taalinstelling gevonden" : "Geen taalinstelling gevonden",
  ];

  const detectedFacts: ScanAnalysisResult["detectedFacts"] = {
    pageTitle,
    metaDescription,
    h1Count,
    headingCount: headings.length,
    headings,
    visibleTextLength: visibleText.length,
    linkCount,
    imageCount: imageTags.length,
    imagesWithAlt,
    ctaCount: callsToAction.length,
    callsToAction,
    contactSignals,
    technicalSignals,
    responseTimeMs,
    pageSizeKb: Number((Buffer.byteLength(html, "utf8") / 1024).toFixed(1)),
    https: url.protocol === "https:",
  };
  const categoryScores = getCategoryScores(detectedFacts);
  const checkedScores = categoryScores.filter((category) => category.checked);
  const overallScore = Math.round(
    checkedScores.reduce((total, category) => total + category.score, 0) / checkedScores.length,
  );

  return {
    overallScore,
    categoryScores,
    detectedFacts,
    notChecked: [
      "Mobiele weergave is niet met een echte mobiele browser getest.",
      "Core Web Vitals en interactiesnelheid zijn niet gemeten.",
      "Alleen de homepage is opgehaald; interne pagina's zijn niet gecrawld.",
      "De inhoud en kwaliteit van externe backlinks zijn niet gecontroleerd.",
    ],
    issues: getIssues(detectedFacts),
  };
}

export async function analyzeWebsite(rawUrl: string): Promise<ScanAnalysisResult> {
  const snapshot = await fetchHomepage(rawUrl);
  return createAnalysis(snapshot);
}