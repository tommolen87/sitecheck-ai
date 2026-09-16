import dns from "node:dns/promises";
import net from "node:net";

const MAX_HTML_BYTES = 2_000_000;
const MAX_AUXILIARY_BYTES = 400_000;
const REQUEST_TIMEOUT_MS = 10_000;
const AUXILIARY_TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;

export type CheckStatus = "pass" | "fail" | "unknown";

export type CategoryCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  evidence: string;
};

export type ScanAnalysisResult = {
  overallScore: number;
  categoryScores: Array<{
    key: string;
    label: string;
    score: number;
    checked: boolean;
    note: string;
    checks: CategoryCheck[];
  }>;
  detectedFacts: {
    pageTitle: string | null;
    pageTitleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    h1Count: number;
    headingCount: number;
    headings: string[];
    headingLevels: number[];
    visibleTextLength: number;
    linkCount: number;
    internalLinkCount: number;
    externalLinkCount: number;
    imageCount: number;
    imagesWithAlt: number;
    ctaCount: number;
    callsToAction: string[];
    primaryCta: string | null;
    ctaAboveFold: boolean | null;
    contactSignals: string[];
    legalSignals: string[];
    companySignals: string[];
    socialProofSignals: string[];
    localSignals: string[];
    technicalSignals: string[];
    responseTimeMs: number;
    httpStatus: number;
    pageSizeKb: number;
    https: boolean;
    compressed: boolean | null;
    contentEncoding: string | null;
    canonical: string | null;
    robotsDirectives: string[];
    openGraphSignals: string[];
    hasViewport: boolean;
    hasLanguage: boolean;
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    sitemapUrl: string | null;
    localBusinessStructuredData: boolean;
    mapsLink: boolean;
    valuePropositionSignal: boolean | null;
    duplicateTextDetected: boolean | null;
  };
  notChecked: string[];
  issues: Array<{
    id: string;
    title: string;
    severity: "high" | "medium" | "low";
    impact: "high" | "medium" | "low";
    difficulty: "easy" | "medium" | "hard";
    fact: string;
    whyItMatters: string;
    recommendation: string;
  }>;
};

type WebsiteSnapshot = {
  url: URL;
  html: string;
  responseTimeMs: number;
  status: number;
  contentEncoding: string | null;
};

type AuxiliaryResource = {
  text: string;
  url: URL;
} | null;

type WeightedCheck = CategoryCheck & { weight: number };

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
    if (normalized.startsWith("::ffff:")) return isPrivateAddress(normalized.slice(7));
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

async function readLimitedBody(response: Response, maximumBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > maximumBytes) {
    throw new Error("De homepage is te groot om veilig te analyseren.");
  }

  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel();
      throw new Error("De homepage is te groot om veilig te analyseren.");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

async function fetchResource(
  rawUrl: string,
  options: { maximumBytes: number; timeoutMs: number; requireHtml: boolean },
): Promise<{ url: URL; response: Response; text: string } | null> {
  let currentUrl = new URL(rawUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicUrl(currentUrl);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        headers: {
          accept: options.requireHtml ? "text/html,application/xhtml+xml" : "text/plain,text/xml,application/xml",
          "user-agent": "SiteCheckAI/1.0 (+website-analysis)",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(options.timeoutMs),
      });
    } catch {
      return null;
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) return null;
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) return null;
    if (
      options.requireHtml &&
      !(
        (response.headers.get("content-type") ?? "").includes("text/html") ||
        (response.headers.get("content-type") ?? "").includes("application/xhtml+xml")
      )
    ) {
      throw new Error("De opgegeven URL bevat geen HTML-homepage.");
    }

    return {
      url: currentUrl,
      response,
      text: await readLimitedBody(response, options.maximumBytes),
    };
  }

  return null;
}

async function fetchHomepage(rawUrl: string): Promise<WebsiteSnapshot> {
  const startedAt = Date.now();
  const result = await fetchResource(rawUrl, {
    maximumBytes: MAX_HTML_BYTES,
    timeoutMs: REQUEST_TIMEOUT_MS,
    requireHtml: true,
  });
  if (!result) throw new Error("De website kon niet worden opgehaald binnen de tijdslimiet.");

  return {
    url: result.url,
    html: result.text,
    responseTimeMs: Date.now() - startedAt,
    status: result.response.status,
    contentEncoding: result.response.headers.get("content-encoding"),
  };
}

async function fetchAuxiliaryResource(url: URL, baseUrl: URL): Promise<AuxiliaryResource> {
  if (url.origin !== baseUrl.origin) return null;
  try {
    const result = await fetchResource(url.href, {
      maximumBytes: MAX_AUXILIARY_BYTES,
      timeoutMs: AUXILIARY_TIMEOUT_MS,
      requireHtml: false,
    });
    return result ? { text: result.text, url: result.url } : null;
  } catch {
    return null;
  }
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
  const match = tag.match(new RegExp(`${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[1] ?? match[2] ?? match[3] ?? "").trim() || null : null;
}

function extractMetaTags(html: string): string[] {
  return html.match(/<meta\b[^>]*>/gi) ?? [];
}

function extractMetaValue(html: string, target: string, attribute: "name" | "property"): string | null {
  for (const tag of extractMetaTags(html)) {
    const name = getAttribute(tag, attribute);
    if (name?.toLowerCase() === target.toLowerCase()) return getAttribute(tag, "content");
  }
  return null;
}

function extractMetaDescription(html: string): string | null {
  return (
    extractMetaValue(html, "description", "name") ??
    extractMetaValue(html, "og:description", "property")
  );
}

function extractHeadings(html: string): {
  headings: string[];
  headingLevels: number[];
  h1Count: number;
} {
  const matches = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const headings = matches.map((match) => cleanText(match[2])).filter(Boolean).slice(0, 20);
  return {
    headings,
    headingLevels: matches.map((match) => Number(match[1])).slice(0, 20),
    h1Count: matches.filter((match) => match[1] === "1").length,
  };
}

function extractLinks(html: string, baseUrl: URL): {
  linkCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  mapsLink: boolean;
} {
  const tags = html.match(/<a\b[^>]*>/gi) ?? [];
  let internalLinkCount = 0;
  let externalLinkCount = 0;
  let mapsLink = false;

  for (const tag of tags) {
    const href = getAttribute(tag, "href");
    if (!href) continue;
    if (/google\.[^/]+\/maps|maps\.google|goo\.gl\/maps|waze\.com/i.test(href)) mapsLink = true;
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue;
    try {
      const target = new URL(href, baseUrl);
      if (target.origin === baseUrl.origin) internalLinkCount += 1;
      else externalLinkCount += 1;
    } catch {
      // An invalid href is not counted as a link destination.
    }
  }

  return {
    linkCount: tags.filter((tag) => Boolean(getAttribute(tag, "href"))).length,
    internalLinkCount,
    externalLinkCount,
    mapsLink,
  };
}

function extractCallsToAction(html: string): { callsToAction: string[]; primaryCta: string | null } {
  const ctaPattern =
    /\b(start|bekijk|lees|ontdek|plan|boek|vraag|neem|contact|bel|offerte|gratis|download|aanmelden|inschrijven|shop|koop|learn|get|book|buy|request|discover|schedule)\b/i;
  const elements = [
    ...(html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? []),
    ...(html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) ?? []),
    ...(html.match(/<input\b[^>]*>/gi) ?? []),
  ];
  const callsToAction = elements
    .map((element) => {
      const label = cleanText(element) || getAttribute(element, "aria-label") || getAttribute(element, "value") || "";
      return label.slice(0, 100);
    })
    .filter((text) => text.length > 1 && ctaPattern.test(text))
    .filter((text, index, list) => list.indexOf(text) === index)
    .slice(0, 10);

  return { callsToAction, primaryCta: callsToAction[0] ?? null };
}

function extractContactSignals(html: string, visibleText: string): string[] {
  const signals: string[] = [];
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(visibleText) || /mailto:/i.test(html)) {
    signals.push("E-mailadres gevonden");
  }
  if (/tel:/i.test(html) || /(?:\+31|0)\s?[\d\s().-]{8,}/.test(visibleText)) {
    signals.push("Telefoonnummer gevonden");
  }
  if (/\b(adres|address|straat|street|postcode|postal code|plaats|city|vestiging)\b/i.test(visibleText) ||
      /\b\d{4}\s?[A-Z]{2}\b/.test(visibleText)) {
    signals.push("Adres- of locatiesignaal gevonden");
  }
  return signals;
}

function extractSignalList(html: string, visibleText: string): {
  legalSignals: string[];
  companySignals: string[];
  socialProofSignals: string[];
  localSignals: string[];
  localBusinessStructuredData: boolean;
} {
  const legalSignals: string[] = [];
  const companySignals: string[] = [];
  const socialProofSignals: string[] = [];
  const localSignals: string[] = [];
  const lowerText = `${html} ${visibleText}`.toLowerCase();
  const localBusinessStructuredData = /"@type"\s*:\s*"?[a-z]*localbusiness/i.test(html);

  if (/\b(privacy|privacybeleid|privacy policy|cookie|avg|gegevensbescherming)\b/i.test(lowerText)) {
    legalSignals.push("Privacy- of cookiesignaal gevonden");
  }
  if (/\b(kvk|kvk-nummer|btw|over ons|about us|bedrijfsgegevens|company information)\b/i.test(lowerText)) {
    companySignals.push("Bedrijfs- of registratiesignaal gevonden");
  }
  if (/\b(review|reviews|beoordeling|testimonial|klantverhaal|ervaringen|tevreden klanten)\b/i.test(lowerText) || /★|⭐/.test(visibleText)) {
    socialProofSignals.push("Review- of klantreferentiesignaal gevonden");
  }
  if (/\b(gemeente|provincie|regio|lokaal|local|vestiging|locatie)\b/i.test(lowerText)) {
    localSignals.push("Plaats- of regiobegrip gevonden");
  }
  if (localBusinessStructuredData) localSignals.push("LocalBusiness structured data gevonden");

  return { legalSignals, companySignals, socialProofSignals, localSignals, localBusinessStructuredData };
}

function extractCanonical(html: string): string | null {
  const tag = (html.match(/<link\b[^>]*\brel\s*=\s*["'][^"']*canonical[^"']*["'][^>]*>/i) ?? [])[0];
  return tag ? getAttribute(tag, "href") : null;
}

function extractOpenGraphSignals(html: string): string[] {
  return extractMetaTags(html)
    .map((tag) => {
      const property = getAttribute(tag, "property");
      const content = getAttribute(tag, "content");
      return property?.toLowerCase().startsWith("og:") && content ? property : null;
    })
    .filter((value): value is string => Boolean(value))
    .filter((value, index, list) => list.indexOf(value) === index);
}

function extractRobotsDirectives(html: string): string[] {
  return extractMetaTags(html)
    .map((tag) => {
      const name = getAttribute(tag, "name")?.toLowerCase();
      return name === "robots" || name === "googlebot" ? getAttribute(tag, "content") : null;
    })
    .filter((value): value is string => Boolean(value));
}

function getVisibleText(html: string): string {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return cleanText(bodyMatch?.[1] ?? html);
}

function detectValueProposition(visibleText: string): boolean | null {
  const sample = visibleText.slice(0, 900);
  if (sample.length < 50) return null;
  return /\b(voor|helpt|biedt|maakt|oplossing|oplossingen|specialist|gespecialiseerd|begeleidt|wij helpen|we help|for|helps|solution|specialist)\b/i.test(sample) &&
    sample.split(/[.!?]/).filter((sentence) => sentence.trim().length > 25).length > 0;
}

function detectDuplicateText(visibleText: string): boolean | null {
  const sentences = visibleText
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.toLowerCase().replace(/\W+/g, " ").trim())
    .filter((sentence) => sentence.length >= 35);
  if (sentences.length < 2) return null;
  return new Set(sentences).size !== sentences.length;
}

function headingStructureIsHealthy(levels: number[]): boolean | null {
  if (levels.length === 0) return false;
  let previous = 0;
  for (const level of levels) {
    if (previous > 0 && level > previous + 1) return false;
    previous = level;
  }
  return levels[0] === 1;
}

function statusFromBoolean(value: boolean | null): CheckStatus {
  return value === null ? "unknown" : value ? "pass" : "fail";
}

function scoreCategory(
  key: string,
  label: string,
  checks: WeightedCheck[],
): ScanAnalysisResult["categoryScores"][number] {
  const knownChecks = checks.filter((check) => check.status !== "unknown");
  const totalWeight = knownChecks.reduce((sum, check) => sum + check.weight, 0);
  const passedWeight = knownChecks.reduce((sum, check) => sum + (check.status === "pass" ? check.weight : 0), 0);
  const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
  const passedCount = knownChecks.filter((check) => check.status === "pass").length;
  const unknownCount = checks.length - knownChecks.length;
  const note =
    knownChecks.length === 0
      ? "Niet gecontroleerd: voor deze categorie zijn geen meetbare signalen beschikbaar."
      : `${passedCount} van ${knownChecks.length} gecontroleerde checks geslaagd${unknownCount > 0 ? `; ${unknownCount} onbekend` : ""}.`;

  return {
    key,
    label,
    score,
    checked: knownChecks.length > 0,
    note,
    checks: checks.map(({ weight: _weight, ...check }) => check),
  };
}

function getCategoryScores(facts: ScanAnalysisResult["detectedFacts"]): ScanAnalysisResult["categoryScores"] {
  const hasEmail = facts.contactSignals.includes("E-mailadres gevonden");
  const hasPhone = facts.contactSignals.includes("Telefoonnummer gevonden");
  const hasAddress = facts.contactSignals.includes("Adres- of locatiesignaal gevonden");
  const titleQuality = Boolean(facts.pageTitle && facts.pageTitleLength >= 10 && facts.pageTitleLength <= 60);
  const metaQuality = Boolean(facts.metaDescription && facts.metaDescriptionLength >= 70 && facts.metaDescriptionLength <= 160);
  const headingHealth = headingStructureIsHealthy(facts.headingLevels);
  const titleH1Relationship =
    facts.pageTitle && facts.headings[0]
      ? facts.pageTitle.toLowerCase().split(/\W+/).some((word) => word.length > 3 && facts.headings[0].toLowerCase().includes(word))
      : null;

  return [
    scoreCategory("conversie", "Conversie", [
      { key: "primary-cta", label: "Duidelijke primaire CTA", status: facts.primaryCta ? "pass" : "fail", evidence: facts.primaryCta ? `CTA gevonden: “${facts.primaryCta}”.` : "Geen herkenbare CTA gevonden.", weight: 3 },
      { key: "cta-quality", label: "Aantal en kwaliteit van CTA’s", status: facts.ctaCount >= 1 && facts.ctaCount <= 5 ? "pass" : "fail", evidence: `${facts.ctaCount} herkenbare CTA${facts.ctaCount === 1 ? "" : "’s"} gevonden.`, weight: 2 },
      { key: "contact-option", label: "Contactoptie", status: facts.contactSignals.length > 0 ? "pass" : "fail", evidence: facts.contactSignals.length > 0 ? facts.contactSignals.join(", ") : "Geen contactsignaal gevonden.", weight: 2 },
      { key: "phone-or-email", label: "Telefoonnummer of e-mail", status: hasPhone || hasEmail ? "pass" : "fail", evidence: hasPhone || hasEmail ? "Telefoonnummer of e-mailadres gevonden." : "Geen telefoonnummer of e-mailadres gevonden.", weight: 2 },
      { key: "value-proposition", label: "Waardepropositie", status: statusFromBoolean(facts.valuePropositionSignal), evidence: facts.valuePropositionSignal === null ? "Niet betrouwbaar uit statische HTML vast te stellen." : facts.valuePropositionSignal ? "In de eerste tekst staat een concreet aanbod- of doelgroepbegrip." : "Geen duidelijk aanbod- of doelgroepbegrip in de eerste tekst gevonden.", weight: 3 },
      { key: "logical-next-step", label: "Logische vervolgstap", status: facts.ctaCount > 0 ? "pass" : "fail", evidence: facts.ctaCount > 0 ? "Er is een vervolgstap in een link, knop of invoerveld gevonden." : "Geen vervolgstap gevonden.", weight: 2 },
      { key: "cta-above-fold", label: "CTA boven de vouw", status: "unknown", evidence: "Niet gecontroleerd: dit vereist een echte browserweergave.", weight: 1 },
    ]),
    scoreCategory("seo", "SEO", [
      { key: "title-quality", label: "Paginatitel", status: titleQuality ? "pass" : "fail", evidence: facts.pageTitle ? `Titel bevat ${facts.pageTitleLength} tekens.` : "Geen paginatitel gevonden.", weight: 3 },
      { key: "meta-quality", label: "Meta description", status: metaQuality ? "pass" : "fail", evidence: facts.metaDescription ? `Meta description bevat ${facts.metaDescriptionLength} tekens.` : "Geen meta description gevonden.", weight: 3 },
      { key: "single-h1", label: "Precies één H1", status: facts.h1Count === 1 ? "pass" : "fail", evidence: `${facts.h1Count} H1-kop${facts.h1Count === 1 ? "" : "pen"} gevonden.`, weight: 3 },
      { key: "heading-structure", label: "Headingstructuur", status: statusFromBoolean(headingHealth), evidence: headingHealth === null ? "Geen koppen gevonden." : headingHealth ? "Koppen beginnen met H1 en slaan geen niveaus over." : "De koppenstructuur begint niet met H1 of slaat een niveau over.", weight: 2 },
      { key: "canonical", label: "Canonical-link", status: facts.canonical ? "pass" : "fail", evidence: facts.canonical ? "Canonical-link gevonden." : "Geen canonical-link gevonden.", weight: 2 },
      { key: "robots-file", label: "robots.txt", status: facts.hasRobotsTxt ? "pass" : "fail", evidence: facts.hasRobotsTxt ? "robots.txt kon veilig worden opgehaald." : "Geen bereikbare robots.txt gevonden.", weight: 1 },
      { key: "open-graph", label: "Open Graph", status: facts.openGraphSignals.length >= 2 ? "pass" : "fail", evidence: facts.openGraphSignals.length > 0 ? `${facts.openGraphSignals.length} Open Graph-signalen gevonden.` : "Geen Open Graph-signalen gevonden.", weight: 2 },
      { key: "image-alt", label: "Alt-teksten", status: facts.imageCount === 0 || facts.imagesWithAlt === facts.imageCount ? "pass" : "fail", evidence: facts.imageCount === 0 ? "Geen afbeeldingen gevonden." : `${facts.imagesWithAlt} van ${facts.imageCount} afbeeldingen heeft alt-tekst.`, weight: 2 },
      { key: "internal-links", label: "Interne links", status: facts.internalLinkCount > 0 ? "pass" : "fail", evidence: `${facts.internalLinkCount} interne links gevonden.`, weight: 1 },
      { key: "sitemap-file", label: "Sitemap", status: facts.hasSitemap ? "pass" : "fail", evidence: facts.hasSitemap ? "Sitemap kon veilig worden opgehaald." : "Geen bereikbare sitemap gevonden.", weight: 1 },
    ]),
    scoreCategory("mobiel", "Mobiel", [
      { key: "mobile-browser", label: "Mobiele browsercheck", status: "unknown", evidence: "Niet gecontroleerd: er is geen echte mobiele browser- of PageSpeed-check uitgevoerd.", weight: 1 },
      { key: "core-web-vitals", label: "Core Web Vitals", status: "unknown", evidence: "Niet gecontroleerd: Core Web Vitals zijn niet gemeten.", weight: 1 },
    ]),
    scoreCategory("techniek", "Techniek & snelheid", [
      { key: "https", label: "HTTPS", status: facts.https ? "pass" : "fail", evidence: facts.https ? "Homepage gebruikt HTTPS." : "Homepage gebruikt HTTP zonder HTTPS.", weight: 3 },
      { key: "http-response", label: "HTTP-respons", status: facts.httpStatus >= 200 && facts.httpStatus < 300 ? "pass" : "fail", evidence: `Homepage gaf HTTP-status ${facts.httpStatus}.`, weight: 2 },
      { key: "response-time", label: "Eerste responstijd", status: facts.responseTimeMs < 1000 ? "pass" : facts.responseTimeMs < 2500 ? "fail" : "fail", evidence: `Eerste HTML-respons duurde ${facts.responseTimeMs} ms.`, weight: 3 },
      { key: "html-size", label: "HTML-paginagrootte", status: facts.pageSizeKb < 500 ? "pass" : facts.pageSizeKb < 1500 ? "fail" : "fail", evidence: `HTML-respons is ${facts.pageSizeKb} KB.`, weight: 2 },
      { key: "compression", label: "Compressie", status: facts.compressed === null ? "unknown" : facts.compressed ? "pass" : "fail", evidence: facts.compressed === null ? "Niet vastgesteld: de responseheader vermeldde geen compressie." : facts.compressed ? `Compressie gevonden (${facts.contentEncoding}).` : "Geen compressieheader gevonden.", weight: 1 },
    ]),
    scoreCategory("content", "Content", [
      { key: "useful-text", label: "Hoeveelheid zichtbare tekst", status: facts.visibleTextLength >= 300 ? "pass" : "fail", evidence: `Ongeveer ${facts.visibleTextLength} tekens zichtbare tekst gevonden.`, weight: 3 },
      { key: "title-h1", label: "Relatie titel en H1", status: statusFromBoolean(titleH1Relationship), evidence: titleH1Relationship === null ? "Niet vast te stellen zonder zowel titel als H1." : titleH1Relationship ? "Een betekenisvol woord uit de titel komt ook in de eerste H1 voor." : "Titel en eerste H1 lijken inhoudelijk niet op elkaar.", weight: 2 },
      { key: "value-proposition", label: "Duidelijkheid van aanbod", status: statusFromBoolean(facts.valuePropositionSignal), evidence: facts.valuePropositionSignal === null ? "Niet betrouwbaar vast te stellen uit de beschikbare tekst." : facts.valuePropositionSignal ? "Een aanbod- of doelgroepbegrip staat vroeg in de tekst." : "Geen duidelijk aanbod- of doelgroepbegrip staat vroeg in de tekst.", weight: 3 },
      { key: "headings", label: "Koppen voor structuur", status: facts.headingCount >= 3 ? "pass" : "fail", evidence: `${facts.headingCount} tekstuele koppen gevonden.`, weight: 2 },
      { key: "duplicate-text", label: "Geen herhaalde tekstblokken", status: facts.duplicateTextDetected === null ? "unknown" : facts.duplicateTextDetected ? "fail" : "pass", evidence: facts.duplicateTextDetected === null ? "Niet vast te stellen: te weinig langere zinnen." : facts.duplicateTextDetected ? "Herhaalde langere zinnen gevonden." : "Geen exact herhaalde langere zinnen gevonden.", weight: 1 },
    ]),
    scoreCategory("vertrouwen", "Vertrouwen", [
      { key: "contact", label: "Contactinformatie", status: facts.contactSignals.length > 0 ? "pass" : "fail", evidence: facts.contactSignals.length > 0 ? facts.contactSignals.join(", ") : "Geen contactinformatie gevonden.", weight: 3 },
      { key: "address", label: "Adres", status: hasAddress ? "pass" : "fail", evidence: hasAddress ? "Adres- of locatiesignaal gevonden." : "Geen adres- of locatiesignaal gevonden.", weight: 2 },
      { key: "phone", label: "Telefoon", status: hasPhone ? "pass" : "fail", evidence: hasPhone ? "Telefoonnummer gevonden." : "Geen telefoonnummer gevonden.", weight: 1 },
      { key: "email", label: "E-mail", status: hasEmail ? "pass" : "fail", evidence: hasEmail ? "E-mailadres gevonden." : "Geen e-mailadres gevonden.", weight: 1 },
      { key: "privacy", label: "Privacy/cookie-informatie", status: facts.legalSignals.length > 0 ? "pass" : "fail", evidence: facts.legalSignals.length > 0 ? facts.legalSignals.join(", ") : "Geen privacy- of cookiesignaal gevonden.", weight: 2 },
      { key: "company", label: "Bedrijfsinformatie", status: facts.companySignals.length > 0 ? "pass" : "fail", evidence: facts.companySignals.length > 0 ? facts.companySignals.join(", ") : "Geen bedrijfs- of registratiesignaal gevonden.", weight: 1 },
      { key: "social-proof", label: "Reviews of klantreferenties", status: facts.socialProofSignals.length > 0 ? "pass" : "fail", evidence: facts.socialProofSignals.length > 0 ? facts.socialProofSignals.join(", ") : "Geen review- of klantreferentiesignaal gevonden.", weight: 1 },
    ]),
    scoreCategory("lokaal", "Lokale vindbaarheid", [
      { key: "physical-address", label: "Fysiek adres", status: hasAddress ? "pass" : "fail", evidence: hasAddress ? "Adres- of locatiesignaal gevonden." : "Geen fysiek adres gevonden.", weight: 3 },
      { key: "city-region", label: "Plaats of regio", status: facts.localSignals.some((signal) => signal.includes("Plaats")) ? "pass" : "fail", evidence: facts.localSignals.some((signal) => signal.includes("Plaats")) ? "Plaats- of regiobegrip gevonden." : "Geen duidelijk plaats- of regiobegrip gevonden.", weight: 2 },
      { key: "telephone", label: "Lokaal telefoonnummer", status: hasPhone ? "pass" : "fail", evidence: hasPhone ? "Telefoonnummer gevonden." : "Geen telefoonnummer gevonden.", weight: 2 },
      { key: "maps", label: "Google Maps of Waze-link", status: facts.mapsLink ? "pass" : "fail", evidence: facts.mapsLink ? "Kaartlink gevonden." : "Geen Google Maps- of Waze-link gevonden.", weight: 1 },
      { key: "local-business-data", label: "LocalBusiness structured data", status: facts.localBusinessStructuredData ? "pass" : "fail", evidence: facts.localBusinessStructuredData ? "LocalBusiness structured data gevonden." : "Geen LocalBusiness structured data gevonden.", weight: 2 },
    ]),
  ];
}

function issue(
  value: Omit<ScanAnalysisResult["issues"][number], "severity"> & { severity: "high" | "medium" | "low" },
): ScanAnalysisResult["issues"][number] {
  return value;
}

function getIssues(facts: ScanAnalysisResult["detectedFacts"]): ScanAnalysisResult["issues"] {
  const hasEmail = facts.contactSignals.includes("E-mailadres gevonden");
  const hasPhone = facts.contactSignals.includes("Telefoonnummer gevonden");
  const hasAddress = facts.contactSignals.includes("Adres- of locatiesignaal gevonden");
  const issues: ScanAnalysisResult["issues"] = [];

  if (!facts.primaryCta) {
    issues.push(issue({
      id: "missing-primary-cta",
      title: "Geen duidelijke primaire CTA gevonden",
      severity: "high",
      impact: "high",
      difficulty: "easy",
      fact: "We vonden geen herkenbare call-to-action in links, knoppen of invoervelden op de homepage.",
      whyItMatters: "Bezoekers zien daardoor minder duidelijk wat de logische volgende stap is.",
      recommendation: "Kies één hoofdactie, zoals contact opnemen, een offerte aanvragen of een afspraak plannen, en maak die zichtbaar.",
    }));
  }
  if (!facts.pageTitle || facts.pageTitleLength < 10 || facts.pageTitleLength > 60) {
    issues.push(issue({
      id: "weak-page-title",
      title: facts.pageTitle ? "Paginatitel kan sterker" : "Geen goede paginatitel gevonden",
      severity: "high",
      impact: "high",
      difficulty: "easy",
      fact: facts.pageTitle ? `De titel bevat ${facts.pageTitleLength} tekens; een bruikbare titel ligt meestal rond 10–60 tekens.` : "We vonden geen HTML-title op de homepage.",
      whyItMatters: "De paginatitel helpt zoekmachines en bezoekers begrijpen waar de pagina over gaat.",
      recommendation: "Schrijf een unieke titel met het aanbod en eventueel de plaats of doelgroep, binnen ongeveer 10–60 tekens.",
    }));
  }
  if (!facts.metaDescription || facts.metaDescriptionLength < 70 || facts.metaDescriptionLength > 160) {
    issues.push(issue({
      id: "weak-meta-description",
      title: facts.metaDescription ? "Meta description kan sterker" : "Geen meta description gevonden",
      severity: "high",
      impact: "high",
      difficulty: "easy",
      fact: facts.metaDescription ? `De meta description bevat ${facts.metaDescriptionLength} tekens; de gebruikte richtlijn ligt rond 70–160 tekens.` : "We vonden geen meta description in de HTML van de homepage.",
      whyItMatters: "Een goede omschrijving geeft zoekers context en kan de doorklik naar je website ondersteunen.",
      recommendation: "Schrijf een concrete omschrijving van het aanbod en de reden om door te klikken, ongeveer 70–160 tekens lang.",
    }));
  }
  if (facts.h1Count !== 1) {
    issues.push(issue({
      id: "h1-structure",
      title: facts.h1Count === 0 ? "Geen H1-kop gevonden" : "Meerdere H1-koppen gevonden",
      severity: facts.h1Count === 0 ? "high" : "medium",
      impact: facts.h1Count === 0 ? "high" : "medium",
      difficulty: "easy",
      fact: `We vonden ${facts.h1Count} H1-kop${facts.h1Count === 1 ? "" : "pen"} op de homepage.`,
      whyItMatters: "Een duidelijke hoofdstructuur helpt bezoekers en zoekmachines de hoofdboodschap herkennen.",
      recommendation: "Gebruik één H1 voor de hoofdboodschap en gebruik H2/H3-koppen voor de onderdelen daaronder.",
    }));
  }
  if (facts.imageCount > 0 && facts.imagesWithAlt < facts.imageCount) {
    issues.push(issue({
      id: "missing-image-alt",
      title: "Niet alle afbeeldingen hebben alt-tekst",
      severity: "medium",
      impact: "medium",
      difficulty: "easy",
      fact: `Van de ${facts.imageCount} afbeeldingen hebben ${facts.imagesWithAlt} een alt-tekst.`,
      whyItMatters: "Alt-tekst helpt bezoekers die afbeeldingen niet kunnen zien en geeft zoekmachines extra context.",
      recommendation: "Geef betekenisvolle afbeeldingen een korte beschrijving en gebruik alt=\"\" voor decoratieve afbeeldingen.",
    }));
  }
  if (!facts.https) {
    issues.push(issue({
      id: "missing-https",
      title: "De homepage gebruikt geen HTTPS",
      severity: "high",
      impact: "high",
      difficulty: "medium",
      fact: "De homepage is opgehaald via HTTP zonder HTTPS.",
      whyItMatters: "HTTPS beschermt verbindingen en is een basisverwachting voor vertrouwen en moderne browsers.",
      recommendation: "Activeer een geldig TLS-certificaat en stuur HTTP automatisch door naar HTTPS.",
    }));
  }
  if (facts.responseTimeMs >= 2500) {
    issues.push(issue({
      id: "slow-response",
      title: "De eerste HTML-respons is relatief traag",
      severity: facts.responseTimeMs >= 5000 ? "high" : "medium",
      impact: facts.responseTimeMs >= 5000 ? "high" : "medium",
      difficulty: "hard",
      fact: `De eerste HTML-respons duurde ${facts.responseTimeMs} ms.`,
      whyItMatters: "Een trage serverrespons verlengt de tijd voordat bezoekers inhoud kunnen zien.",
      recommendation: "Onderzoek serverresponstijd, caching en zware serverlogica. Dit is een basismeting, geen volledige snelheidstest.",
    }));
  }
  if (facts.contactSignals.length === 0) {
    issues.push(issue({
      id: "missing-contact-signal",
      title: "Geen contactsignaal gevonden",
      severity: "medium",
      impact: "medium",
      difficulty: "easy",
      fact: "We vonden geen duidelijk e-mailadres, telefoonnummer of adres-signaal in de homepage.",
      whyItMatters: "Een bezoeker met koopintentie moet zonder zoeken kunnen zien hoe contact mogelijk is.",
      recommendation: "Maak minstens één laagdrempelige contactmogelijkheid zichtbaar op een herkenbare plek.",
    }));
  }
  if (facts.legalSignals.length === 0) {
    issues.push(issue({
      id: "missing-privacy-signal",
      title: "Geen privacy- of cookiesignaal gevonden",
      severity: "low",
      impact: "medium",
      difficulty: "medium",
      fact: "In de homepage vonden we geen privacy-, cookie- of AVG-gerelateerd signaal.",
      whyItMatters: "Duidelijke privacy-informatie kan bijdragen aan vertrouwen en aan het uitleggen van gegevensgebruik.",
      recommendation: "Maak een passende privacy- en cookie-informatie vindbaar. De scan beoordeelt niet of de juridische inhoud volledig is.",
    }));
  }
  if (facts.duplicateTextDetected) {
    issues.push(issue({
      id: "duplicate-text",
      title: "Herhaalde tekst gevonden",
      severity: "low",
      impact: "low",
      difficulty: "medium",
      fact: "De scan vond exact herhaalde langere zinnen in de zichtbare homepage-tekst.",
      whyItMatters: "Herhaling kan de boodschap minder helder maken en ruimte innemen die voor relevante informatie beschikbaar is.",
      recommendation: "Controleer de herhaalde blokken en houd één duidelijke versie over. Dit is een tekstsignaal, geen volledige duplicate-contentanalyse.",
    }));
  }

  const weight = { high: 3, medium: 2, low: 1 };
  return issues
    .sort((left, right) => weight[right.severity] - weight[left.severity])
    .slice(0, 5);
}

async function createAnalysis(snapshot: WebsiteSnapshot): Promise<ScanAnalysisResult> {
  const { html, url, responseTimeMs } = snapshot;
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? cleanText(titleMatch[1]) || null : null;
  const metaDescription = extractMetaDescription(html);
  const { headings, headingLevels, h1Count } = extractHeadings(html);
  const visibleText = getVisibleText(html);
  const links = extractLinks(html, url);
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithAlt = imageTags.filter((tag) => getAttribute(tag, "alt") !== null).length;
  const { callsToAction, primaryCta } = extractCallsToAction(html);
  const contactSignals = extractContactSignals(html, visibleText);
  const signalLists = extractSignalList(html, visibleText);
  const canonical = extractCanonical(html);
  const robotsDirectives = extractRobotsDirectives(html);
  const openGraphSignals = extractOpenGraphSignals(html);
  const hasViewport = /<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>/i.test(html);
  const hasLanguage = /<html\b[^>]*\blang\s*=/i.test(html);
  const robotsResource = await fetchAuxiliaryResource(new URL("/robots.txt", url), url);
  const robotsSitemap = robotsResource?.text.match(/^\s*sitemap:\s*(\S+)/im)?.[1] ?? null;
  const sitemapUrl = robotsSitemap && (() => {
    try {
      const candidate = new URL(robotsSitemap, url);
      return candidate.origin === url.origin ? candidate.href : null;
    } catch {
      return null;
    }
  })();
  const sitemapResource = await fetchAuxiliaryResource(
    sitemapUrl ? new URL(sitemapUrl) : new URL("/sitemap.xml", url),
    url,
  );
  const compressed = snapshot.contentEncoding === null ? null : snapshot.contentEncoding !== "identity";
  const detectedFacts: ScanAnalysisResult["detectedFacts"] = {
    pageTitle,
    pageTitleLength: pageTitle?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count,
    headingCount: headings.length,
    headings,
    headingLevels,
    visibleTextLength: visibleText.length,
    ...links,
    imageCount: imageTags.length,
    imagesWithAlt,
    ctaCount: callsToAction.length,
    callsToAction,
    primaryCta,
    ctaAboveFold: null,
    contactSignals,
    ...signalLists,
    technicalSignals: [
      snapshot.url.protocol === "https:" ? "HTTPS actief" : "HTTP zonder HTTPS",
      `HTTP-status ${snapshot.status}`,
      hasViewport ? "Viewport-instelling gevonden" : "Geen viewport-instelling gevonden",
      canonical ? "Canonical-link gevonden" : "Geen canonical-link gevonden",
      hasLanguage ? "Taalinstelling gevonden" : "Geen taalinstelling gevonden",
      compressed === null ? "Compressie niet vastgesteld" : compressed ? `Compressie gevonden (${snapshot.contentEncoding})` : "Geen compressieheader gevonden",
      robotsResource ? "robots.txt bereikbaar" : "robots.txt niet gevonden",
      sitemapResource ? "Sitemap bereikbaar" : "Sitemap niet gevonden",
    ],
    responseTimeMs,
    httpStatus: snapshot.status,
    pageSizeKb: Number((Buffer.byteLength(html, "utf8") / 1024).toFixed(1)),
    https: url.protocol === "https:",
    compressed,
    contentEncoding: snapshot.contentEncoding,
    canonical,
    robotsDirectives,
    openGraphSignals,
    hasViewport,
    hasLanguage,
    hasRobotsTxt: Boolean(robotsResource),
    hasSitemap: Boolean(sitemapResource),
    sitemapUrl: sitemapResource?.url.href ?? sitemapUrl,
    valuePropositionSignal: detectValueProposition(visibleText),
    duplicateTextDetected: detectDuplicateText(visibleText),
  };
  const categoryScores = getCategoryScores(detectedFacts);
  const checkedScores = categoryScores.filter((category) => category.checked);
  const overallScore = checkedScores.length
    ? Math.round(checkedScores.reduce((total, category) => total + category.score, 0) / checkedScores.length)
    : 0;

  return {
    overallScore,
    categoryScores,
    detectedFacts,
    notChecked: [
      "Mobiele weergave is niet met een echte mobiele browser getest.",
      "Core Web Vitals en interactiesnelheid zijn niet gemeten.",
      "Alleen de homepage en de vaste robots.txt/sitemap-locaties zijn opgehaald; interne pagina's zijn niet gecrawld.",
      "De inhoud en kwaliteit van externe backlinks zijn niet gecontroleerd.",
      "De volledigheid van juridische teksten, reviews en bedrijfsgegevens is niet juridisch of handmatig beoordeeld.",
      "CTA-plaatsing boven de vouw is niet gecontroleerd zonder browserrendering.",
    ],
    issues: getIssues(detectedFacts),
  };
}

export async function analyzeWebsite(rawUrl: string): Promise<ScanAnalysisResult> {
  const snapshot = await fetchHomepage(rawUrl);
  return createAnalysis(snapshot);
}