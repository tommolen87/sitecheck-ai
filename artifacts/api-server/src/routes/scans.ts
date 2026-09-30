import "dotenv/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, scansTable } from "@workspace/db";
import {
  CreateScanBody,
  CreateScanResponse,
  GetScanParams,
  GetScanResponse,
  ListScansResponse,
} from "@workspace/api-zod";
import { analyzeWebsite } from "../lib/website-analysis";
import { generateAiRecommendations } from "../lib/ai-website-analysis";
import Stripe from "stripe";
import PDFDocument from "pdfkit";

const router: IRouter = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

const frontendUrl =
  process.env.FRONTEND_URL ?? "http://localhost:5173";


const scanAccessSecret = process.env.SCAN_ACCESS_SECRET ?? process.env.STRIPE_SECRET_KEY;

function createScanAccessToken(scanId: number): string {
  if (!scanAccessSecret) {
    throw new Error("SCAN_ACCESS_SECRET is not configured.");
  }
  return createHmac("sha256", scanAccessSecret).update(`scan:${scanId}`).digest("hex");
}

function hasScanAccess(req: { headers: Record<string, unknown> }, scanId: number): boolean {
  if (!scanAccessSecret) return false;
  const supplied = String(req.headers["x-scan-access-token"] ?? "");
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createScanAccessToken(scanId);
  return timingSafeEqual(Buffer.from(supplied, "hex"), Buffer.from(expected, "hex"));
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  conversie: 20,
  seo: 20,
  mobiel: 15,
  techniek: 15,
  content: 10,
  vertrouwen: 10,
  lokaal: 10,
};

function normalizeScanAnalysis<T extends { analysis: unknown }>(scan: T): T {
  const { analysis } = scan;
  if (typeof analysis !== "object" || analysis === null || Array.isArray(analysis)) return scan;
  const analysisRecord = analysis as Record<string, unknown>;

  const categoryScores = Array.isArray(analysisRecord.categoryScores)
    ? analysisRecord.categoryScores.map((category: unknown) => {
        if (typeof category !== "object" || category === null || Array.isArray(category)) return category;
        const categoryRecord = category as Record<string, unknown>;
        const checks = Array.isArray(categoryRecord.checks) ? categoryRecord.checks : [];
        const normalizedChecks = checks.map((check) => {
          if (typeof check !== "object" || check === null || Array.isArray(check)) return check;
          const checkRecord = check as Record<string, unknown>;
          const status = checkRecord.status === "passed" || checkRecord.status === "pass"
            ? "passed"
            : checkRecord.status === "failed" || checkRecord.status === "fail"
              ? "failed"
              : "unknown";
          return {
            ...checkRecord,
            status,
            value: Object.prototype.hasOwnProperty.call(checkRecord, "value") ? checkRecord.value : null,
          };
        });
        const statuses = normalizedChecks.map((check) =>
          typeof check === "object" && check !== null && !Array.isArray(check)
            ? (check as Record<string, unknown>).status
            : "unknown",
        );
        const passedCount =
          typeof categoryRecord.passedCount === "number"
            ? categoryRecord.passedCount
            : statuses.filter((status) => status === "passed").length;
        const failedCount =
          typeof categoryRecord.failedCount === "number"
            ? categoryRecord.failedCount
            : statuses.filter((status) => status === "failed").length;
        const unknownCount =
          typeof categoryRecord.unknownCount === "number"
            ? categoryRecord.unknownCount
            : statuses.filter((status) => status === "unknown").length;
        const executedCount =
          typeof categoryRecord.executedCount === "number"
            ? categoryRecord.executedCount
            : passedCount + failedCount;
        const checked = executedCount > 0;
        const coveragePercent =
          typeof categoryRecord.coveragePercent === "number"
            ? categoryRecord.coveragePercent
            : checks.length > 0
              ? Math.round((executedCount / checks.length) * 100)
              : 0;
        const knownWeights = normalizedChecks.reduce(
          (totals, check) => {
            if (typeof check !== "object" || check === null || Array.isArray(check)) return totals;
            const checkRecord = check as Record<string, unknown>;
            const status =
              checkRecord.status === "passed" || checkRecord.status === "pass"
                ? "passed"
                : checkRecord.status === "failed" || checkRecord.status === "fail"
                  ? "failed"
                  : "unknown";
            const weight = typeof checkRecord.weight === "number" ? checkRecord.weight : 1;
            if (status !== "unknown") totals.total += weight;
            if (typeof checkRecord.score === "number") {
              totals.passed += weight * Math.max(0, Math.min(100, checkRecord.score)) / 100;
            } else if (status === "passed") {
              totals.passed += weight;
            }
            return totals;
          },
          { passed: 0, total: 0 },
        );
        const qualityScore =
          checked && knownWeights.total > 0
            ? Math.round((knownWeights.passed / knownWeights.total) * 100)
            : null;
        const score =
          qualityScore === null ? null : Math.round(qualityScore * (coveragePercent / 100));
        const key = typeof categoryRecord.key === "string" ? categoryRecord.key : "";
        const weightPercent = CATEGORY_WEIGHTS[key] ?? 0;
        return {
          ...categoryRecord,
          score,
          qualityScore,
          weightPercent,
          checked,
          passedCount,
          failedCount,
          unknownCount,
          executedCount,
          coveragePercent,
          checks: normalizedChecks,
        };
      })
    : analysisRecord.categoryScores;
  const normalizedCategories = Array.isArray(categoryScores)
    ? categoryScores.filter(
        (category): category is Record<string, unknown> =>
          typeof category === "object" && category !== null && !Array.isArray(category),
      )
    : [];
  const overallCoveragePercent = Math.round(
    normalizedCategories.reduce((total, category) => {
      const coverage = typeof category.coveragePercent === "number" ? category.coveragePercent : 0;
      const weight = typeof category.weightPercent === "number" ? category.weightPercent : 0;
      return total + coverage * (weight / 100);
    }, 0),
  );
  const overallScore = Math.round(
    normalizedCategories.reduce((total, category) => {
      const score = typeof category.score === "number" ? category.score : 0;
      const weight = typeof category.weightPercent === "number" ? category.weightPercent : 0;
      return total + score * (weight / 100);
    }, 0),
  );
  const measuredWeight = normalizedCategories.reduce((total, category) => {
    const coverage = typeof category.coveragePercent === "number" ? category.coveragePercent : 0;
    const weight = typeof category.weightPercent === "number" ? category.weightPercent : 0;
    return total + coverage * (weight / 100);
  }, 0);
  const measuredQualityPoints = normalizedCategories.reduce((total, category) => {
    const quality = typeof category.qualityScore === "number" ? category.qualityScore : 0;
    const coverage = typeof category.coveragePercent === "number" ? category.coveragePercent : 0;
    const weight = typeof category.weightPercent === "number" ? category.weightPercent : 0;
    return total + quality * coverage * (weight / 100);
  }, 0);
  const overallQualityScore =
    measuredWeight > 0 ? Math.round(measuredQualityPoints / measuredWeight) : null;
  const detectedFacts =
    typeof analysisRecord.detectedFacts === "object" &&
    analysisRecord.detectedFacts !== null &&
    !Array.isArray(analysisRecord.detectedFacts)
      ? {
          ...(analysisRecord.detectedFacts as Record<string, unknown>),
          imageAltTexts: Array.isArray(
            (analysisRecord.detectedFacts as Record<string, unknown>).imageAltTexts,
          )
            ? (analysisRecord.detectedFacts as Record<string, unknown>).imageAltTexts
            : [],
        }
      : analysisRecord.detectedFacts;
  const issues = Array.isArray(analysisRecord.issues)
    ? analysisRecord.issues.map((issue) =>
        typeof issue === "object" && issue !== null && !Array.isArray(issue)
          ? {
              ...(issue as Record<string, unknown>),
              confidence: ["high", "medium", "low"].includes(
                String((issue as Record<string, unknown>).confidence),
              )
                ? (issue as Record<string, unknown>).confidence
                : "high",
            }
          : issue,
      )
    : analysisRecord.issues;

  return {
    ...scan,
    analysis: {
      ...analysisRecord,
      aiRecommendations: Object.prototype.hasOwnProperty.call(analysisRecord, "aiRecommendations")
        ? analysisRecord.aiRecommendations
        : null,
      overallScore,
      overallQualityScore,
      overallCoveragePercent,
      categoryScores,
      detectedFacts,
      issues,
    },
  };
}

function isWebsiteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function processScan(
  scanId: number,
  url: string,
  locale: "nl" | "en",
  log: { info: (...args: any[]) => void; warn: (...args: any[]) => void },
): Promise<void> {
  try {
    const { analysis: measuredAnalysis, aiContext } = await analyzeWebsite(url);
    let aiRecommendations = null;

    try {
      aiRecommendations = await generateAiRecommendations(
        { ...measuredAnalysis, aiRecommendations: null },
        aiContext,
        locale,
      );
    } catch (error) {
      log.warn?.(
        { scanId, error: error instanceof Error ? error.message : "Unknown AI error" },
        "AI analysis unavailable; using measured recommendations",
      );
    }

    const analysis = { ...measuredAnalysis, aiRecommendations };

    await db
      .update(scansTable)
      .set({ status: "completed", analysis, error: null })
      .where(eq(scansTable.id, scanId));

    log.info?.({ scanId }, "Website scan completed");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "De website kon niet worden geanalyseerd.";

    await db
      .update(scansTable)
      .set({ status: "failed", analysis: null, error: message })
      .where(eq(scansTable.id, scanId));

    log.warn?.({ scanId, error: message }, "Website scan failed");
  }
}

router.post("/scans", async (req, res): Promise<void> => {
  const parsed = CreateScanBody.safeParse(req.body);
  if (!parsed.success || !isWebsiteUrl(parsed.data?.url ?? "")) {
    res.status(400).json({ error: "Vul een geldige website-URL in." });
    return;
  }

  const localeHeader = String(req.headers["x-sitecheck-language"] ?? "").toLowerCase();
  const locale: "nl" | "en" = localeHeader === "en" ? "en" : "nl";

  const [scan] = await db
    .insert(scansTable)
    .values({ url: parsed.data.url, status: "analyzing" })
    .returning();

  const accessToken = createScanAccessToken(scan.id);

  req.log.info({ scanId: scan.id }, "Website scan request accepted");

  res.status(201).json({ ...CreateScanResponse.parse(scan), accessToken });

  void processScan(scan.id, parsed.data.url, locale, req.log);
});

router.get("/scans", async (_req, res): Promise<void> => {
  // Scan records are private resources; never expose the global scan list publicly.
  res.json([]);
});

router.get("/scans/:scanId", async (req, res): Promise<void> => {
  const parsed = GetScanParams.safeParse(req.params);

  if (!parsed.success) {
    res.status(400).json({ error: "Ongeldig scan-ID." });
    return;
  }

  const scanId = Number(parsed.data.scanId);

  if (!hasScanAccess(req, scanId)) {
    res.status(404).json({ error: "Scan niet gevonden." });
    return;
  }

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.id, scanId))
    .limit(1);

  if (!scan) {
    res.status(404).json({ error: "Scan niet gevonden." });
    return;
  }

  res.json(GetScanResponse.parse(normalizeScanAnalysis(scan)));
});

router.post("/scans/:scanId/checkout", async (req, res): Promise<void> => {
  const scanId = Number(req.params.scanId);

  if (!Number.isInteger(scanId) || scanId <= 0) {
    res.status(400).json({ error: "Ongeldig scan-ID." });
    return;
  }

  if (!hasScanAccess(req, scanId)) {
    res.status(404).json({ error: "Scan niet gevonden." });
    return;
  }

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.id, scanId))
    .limit(1);

  if (!scan) {
    res.status(404).json({ error: "Scan niet gevonden." });
    return;
  }

  const frontendUrl = (
    process.env.FRONTEND_URL ?? "http://localhost:5173"
  ).replace(/\/$/, "");

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "SiteCheck AI – Volledig rapport",
              description:
                "Alle gevonden verbeterpunten, concrete AI-voorstellen en een praktisch actieplan.",
            },
            unit_amount: 2900,
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/scans/${scanId}?payment=success`,
      cancel_url: `${frontendUrl}/scans/${scanId}/upgrade?payment=cancelled`,
      metadata: {
        scanId: String(scanId),
      },
    });

    await db
      .update(scansTable)
      .set({
        stripeCheckoutSessionId: session.id,
      })
      .where(eq(scansTable.id, scanId));

    res.json({ url: session.url });
  } catch (error) {
    req.log.error(
      {
        scanId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Stripe Checkout session creation failed",
    );

    res.status(500).json({
      error: "De betaling kon niet worden gestart.",
    });
  }
});

router.get("/scans/:scanId/report.pdf", async (req, res): Promise<void> => {
  try {
    const scanId = Number(req.params.scanId);

    if (!Number.isInteger(scanId) || scanId <= 0) {
      res.status(400).json({ error: "Ongeldig scan-ID." });
      return;
    }

    const accessToken = String(req.headers["x-scan-access-token"] ?? "");
    if (!hasScanAccess(req, scanId)) {
      res.status(404).json({ error: "Rapport niet gevonden." });
      return;
    }

    const [scan] = await db
      .select()
      .from(scansTable)
      .where(eq(scansTable.id, scanId))
      .limit(1);

    if (!scan) {
      res.status(404).json({ error: "Scan niet gevonden." });
      return;
    }

    if (scan.paymentStatus !== "paid") {
      res.status(403).json({
        error: "Het volledige rapport is alleen beschikbaar na betaling.",
      });
      return;
    }

    if (!scan.analysis) {
      res.status(404).json({
        error: "Voor deze scan is geen analyse beschikbaar.",
      });
      return;
    }

    // Belangrijk:
    // normalizeScanAnalysis retourneert bij jouw huidige structuur
    // een object met daarin .analysis.
    const normalizedScan = normalizeScanAnalysis(scan);
    const analysis = normalizedScan.analysis as Record<string, any>;
    const url = scan.url ?? "Onbekende website";
    const locale = String(req.query.lang ?? "").toLowerCase() === "en" ? "en" : "nl";

    const categories = Array.isArray(analysis.categoryScores)
      ? analysis.categoryScores
      : [];

    const recommendations = Array.isArray(analysis.aiRecommendations)
      ? analysis.aiRecommendations.slice(0, 10)
      : [];

    const strengths = categories
      .flatMap((category: any) =>
        Array.isArray(category.checks)
          ? category.checks
              .filter(
                (check: any) =>
                  check.status === "passed" &&
                  check.label &&
                  check.evidence,
              )
              .map((check: any) => ({
                ...check,
                category:
                  category.label ??
                  category.key ??
                  "Onderdeel",
              }))
          : [],
      )
      // Vermijd losse checks die al onderdeel zijn van een
      // bredere, relevantere positieve bevinding.
      .filter(
        (check: any) =>
          ![
            "email",
            "phone",
            "cta-found",
            "multiple-ctas",
            "contact",
            "contact-option",
          ].includes(check.key),
      )
      // Eerst de checks met de hoogste inhoudelijke relevantie.
      .sort(
        (a: any, b: any) =>
          (b.weight ?? 0) - (a.weight ?? 0),
      )
      .slice(0, 6);

      console.log(
        "PDF STRENGTHS:",
        strengths.map((s: any) => ({
          key: s.key,
          label: s.label,
          weight: s.weight,
        })),
      );

    const facts =
      analysis.detectedFacts &&
      typeof analysis.detectedFacts === "object"
        ? analysis.detectedFacts
        : {};

    const notChecked = Array.isArray(analysis.notChecked)
      ? analysis.notChecked
      : [];

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,
      info: {
        Title: `SiteCheck AI – ${t("Website rapport")}`,
        Author: "SiteCheck AI",
        Subject: `${t("Website analyse voor")} ${url}`,
      },
    });

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="sitecheck-ai-report-${scanId}.pdf"`,
    );

    doc.pipe(res);

    // -------------------------------------------------------------------------
    // DESIGN
    // -------------------------------------------------------------------------

    const COLORS = {
      navy: "#111827",
      navy2: "#1F2937",
      blue: "#2563EB",
      blueLight: "#EFF6FF",
      green: "#15803D",
      greenLight: "#F0FDF4",
      orange: "#C2410C",
      orangeLight: "#FFF7ED",
      red: "#B91C1C",
      redLight: "#FEF2F2",
      purple: "#7C3AED",
      purpleLight: "#F5F3FF",
      gray900: "#111827",
      gray700: "#374151",
      gray600: "#4B5563",
      gray500: "#6B7280",
      gray400: "#9CA3AF",
      gray300: "#D1D5DB",
      gray200: "#E5E7EB",
      gray100: "#F3F4F6",
      gray50: "#F9FAFB",
      white: "#FFFFFF",
    };

    const PAGE = {
      width: 595.28,
      height: 841.89,
      left: 48,
      right: 48,
      top: 46,
      bottom: 48,
    };

    const contentWidth =
      PAGE.width - PAGE.left - PAGE.right;

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------

    const pdfTranslations: Record<string, string> = {
      "Website rapport": "Website report",
      "SiteCheck AI • Website analyse": "SiteCheck AI • Website analysis",
      "Website analyse": "Website analysis",
      "Website analyse voor": "Website analysis for",
      "Onderdeel": "Area",
      "Niet beschikbaar": "Not available",
      "Ja": "Yes",
      "Nee": "No",
      "Niet gemeten": "Not measured",
      "Uitstekend": "Excellent",
      "Goed": "Good",
      "Redelijk": "Fair",
      "Verbetering nodig": "Needs improvement",
      "Veel verbetering nodig": "Significant improvement needed",
      "1. Overzicht": "1. Overview",
      "Een compacte samenvatting van de belangrijkste meetresultaten.": "A concise summary of the key measurements.",
      "Totale score": "Overall score",
      "Gemeten kwaliteit": "Measured quality",
      "Totale meetdekking": "Overall coverage",
      "Website": "Website",
      "Scan uitgevoerd": "Scan completed",
      "De zeven invalshoeken": "The seven areas",
      "Sterke punten": "Strengths",
      "Wat gaat er al goed?": "What is already working well?",
      "Sterke punten die tijdens de scan zijn aangetroffen.": "Strengths found during the scan.",
      "Er zijn geen afzonderlijke sterke punten beschikbaar in de scanresultaten.": "No individual strengths are available in the scan results.",
      "2. Wat gaat er al goed?": "2. What is already working well?",
      "3. Belangrijkste verbeterpunten": "3. Key improvement points",
      "Belangrijkste verbeterpunten": "Key improvement points",
      "Belangrijkste verbeterpunten uit het betaalde rapport.": "Key improvement points from the paid report.",
      "Impact": "Impact",
      "Moeite": "Effort",
      "Niet aangegeven": "Not specified",
      "Aanbeveling": "Recommendation",
      "Wat we zagen": "What we found",
      "Waarom dit belangrijk is": "Why this matters",
      "Concreet voorstel": "Concrete suggestion",
      "Verbeterpunt": "Improvement point",
      "4. Actieplan": "4. Action plan",
      "Een compacte samenvatting van de verbeterpunten en de bijbehorende aanpak.": "A concise summary of the improvement points and the corresponding approach.",
      "ACTIE": "ACTION",
      "MOEITE": "EFFORT",
      "5. Technische metingen": "5. Technical measurements",
      "De belangrijkste technische meetwaarden uit de scan, inclusief uitleg in gewone taal.": "The key technical measurements from the scan, explained in plain language.",
      "Er zijn geen afzonderlijke technische meetwaarden beschikbaar.": "No individual technical measurements are available.",
      "6. Wat konden we niet controleren?": "6. What could we not check?",
      "Niet iedere eigenschap van een website kan betrouwbaar automatisch worden vastgesteld.": "Not every website property can be reliably determined automatically.",
      "Samengevat": "Summary",
      "Gebruik de verbeterpunten in dit rapport als praktische checklist. Begin met de punten met de grootste impact en werk daarna de technische en inhoudelijke verbeteringen verder uit.": "Use the improvement points in this report as a practical checklist. Start with the highest-impact items, then work through the technical and content improvements.",
      "OK": "OK",
      "Sterk punt": "Strength",
      "Niet beschikbaar in de scanresultaten.": "Not available in the scan results.",
      "AI-verbeterpunten": "AI improvement points",
      "Er zijn geen AI-verbeterpunten beschikbaar voor deze scan.": "No AI improvement points are available for this scan.",
      "Pagina": "Page",
      "Paginatitel": "Page title",
      "Lengte paginatitel": "Page title length",
      "Korte omschrijving voor Google": "Short description for Google",
      "Lengte omschrijving voor Google": "Description length for Google",
      "Hoofdtitels van de pagina": "Main page headings",
      "Alle koppen": "All headings",
      "Zichtbare tekens": "Visible characters",
      "Interne links": "Internal links",
      "Externe links": "External links",
      "Afbeeldingen": "Images",
      "Afbeeldingen met alt-tekst": "Images with alt text",
      "Actieknoppen": "Call-to-action buttons",
      "Belangrijkste actieknop": "Primary action button",
      "Voorkeursadres van de pagina": "Preferred page address",
      "Instructies voor zoekmachines": "Search engine instructions",
      "Pagina-overzicht voor zoekmachines": "Page overview for search engines",
      "Voorvertoning bij delen": "Sharing preview",
      "Serverantwoord": "Server response",
      "Responstijd": "Response time",
      "Paginagrootte": "Page size",
      "Gegevenscompressie": "Data compression",
      "Vindbaarheid in Google": "Visibility in Google",
      "Conversie": "Conversion",
      "Mobiel": "Mobile",
      "Techniek & snelheid": "Technology & speed",
      "Content": "Content",
      "Vertrouwen": "Trust",
      "Lokale vindbaarheid": "Local visibility",
      "Hoe goed de pagina bezoekers richting een gewenste actie stuurt.": "How well the page guides visitors toward a desired action.",
      "Hoe goed zoekmachines de pagina kunnen begrijpen en indexeren.": "How well search engines can understand and index the page.",
      "Signalen rondom mobiele weergave en gebruik.": "Signals related to mobile display and usability.",
      "Technische kwaliteit, prestaties en basisinstellingen van de pagina.": "The technical quality, performance and basic settings of the page.",
      "De hoeveelheid en structuur van de zichtbare inhoud.": "The amount and structure of visible content.",
      "Signalen die bezoekers helpen vertrouwen in de organisatie te krijgen.": "Signals that help visitors trust the organization.",
      "Signalen die helpen om lokaal gevonden te worden.": "Signals that help the website be found locally.",
      "Een verzameling controles die samen dit onderdeel van de website beoordelen.": "A collection of checks that together assess this area of the website.",
      "Niet aangetroffen": "Not found",
      "Aangetroffen": "Found",
      "Bereikbaar": "Available",
      "Niet gevonden": "Not found",
      "Niet vastgesteld": "Not determined",
    };

    const t = (value: string): string => locale === "en" ? (pdfTranslations[value] ?? value) : value;

    const safe = (value: unknown, fallback = "Niet beschikbaar") => {
      if (value === null || value === undefined || value === "") {
        return t(fallback);
      }

      if (typeof value === "boolean") {
        return value ? t("Ja") : t("Nee");
      }

      if (typeof value === "object") {
        try {
          return JSON.stringify(value);
        } catch {
          return fallback;
        }
      }

      return String(value);
    };

    const plainLanguage = (value: string): string => {
      return t(value)
        .replace(/\bCTA('s|’s|s)?\b/gi, (_match, suffix = "") =>
          suffix ? "actieknoppen" : "actieknop",
        )
        .replace(/\bH1-koppen?\b/gi, "hoofdtitels")
        .replace(/\bH1-kop\b/gi, "hoofdtitel")
        .replace(/\bH1\b/gi, "hoofdtitel")
        .replace(/\bSEO\b/gi, "vindbaarheid in Google")
        .replace(/meta description/gi, "korte omschrijving voor Google")
        .replace(/Open Graph/gi, "voorvertoning bij delen")
        .replace(/LocalBusiness structured data/gi, "gestructureerde bedrijfsinformatie voor zoekmachines")
        .replace(/structured data/gi, "gestructureerde informatie voor zoekmachines")
        .replace(/Core Web Vitals/gi, "belangrijke metingen voor snelheid en gebruiksgemak")
        .replace(/PageSpeed Insights/gi, "Google-meting voor snelheid en prestaties")
        .replace(/robots\.txt/gi, "instructies voor zoekmachines (robots.txt)")
        .replace(/sitemap\.xml/gi, "pagina-overzicht voor zoekmachines (sitemap)")
        .replace(/\bCanonical-link\b/gi, "voorkeursadres van de pagina")
    .replace(/\bCanonical URL\b/gi, "voorkeursadres van de pagina")
    .replace(/\bCanonical\b/gi, "voorkeursadres van de pagina")
    .replace(/\bHTTP-status\b/gi, "serverantwoord")
    .replace(/\bViewport-instelling\b/gi, "instelling voor mobiele weergave")
    .replace(/\bcontent encoding\b/gi, "compressiemethode")
    .replace(/\bRobots-directives\b/gi, "instructies voor zoekmachines");
    };

    const scoreColor = (score: number | null | undefined) => {
      if (typeof score !== "number") return COLORS.gray500;
      if (score >= 80) return COLORS.green;
      if (score >= 60) return COLORS.orange;
      return COLORS.red;
    };

    const scoreBackground = (score: number) => {
      if (score >= 80) return COLORS.greenLight;
      if (score >= 60) return COLORS.orangeLight;
      return COLORS.redLight;
    };

    const scoreLabel = (score: number | null | undefined) => {
      if (typeof score !== "number") return t("Niet gemeten");
      if (score >= 90) return t("Uitstekend");
      if (score >= 80) return t("Goed");
      if (score >= 60) return t("Redelijk");
      if (score >= 40) return t("Verbetering nodig");
      return t("Veel verbetering nodig");
    };

    const addFooter = () => {
      const y = PAGE.height - 30;

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.gray400)
        .text(
          t("SiteCheck AI • Website analyse"),
          PAGE.left,
          y,
          {
            width: contentWidth / 2,
            lineBreak: false,
          },
        );

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.gray400)
        .text(
          `${t("Pagina")} ${doc.bufferedPageRange().count}`,
          PAGE.width - PAGE.right - 80,
          y,
          {
            width: 80,
            align: "right",
            lineBreak: false,
          },
        );
    };

    const newPage = () => {
      addFooter();
      doc.addPage();
      doc.y = PAGE.top;
    };

    const ensureSpace = (height: number) => {
      if (doc.y + height > PAGE.height - PAGE.bottom) {
        newPage();
      }
    };

    const roundedCard = (
      x: number,
      y: number,
      width: number,
      height: number,
      fill: string = COLORS.white,
      stroke: string = COLORS.gray200,
      radius = 10,
    ) => {
      doc
        .save()
        .roundedRect(x, y, width, height, radius)
        .fillAndStroke(fill, stroke)
        .restore();
    };

    const drawScoreCircle = (
      x: number,
      y: number,
      radius: number,
      score: number,
    ) => {
      const color = scoreColor(score);

      doc
        .save()
        .circle(x, y, radius)
        .lineWidth(8)
        .strokeColor(color)
        .stroke()
        .restore();

      doc
        .font("Helvetica-Bold")
        .fontSize(radius > 35 ? 25 : 18)
        .fillColor(COLORS.gray900)
        .text(
          `${Math.round(score)}`,
          x - radius,
          y - 12,
          {
            width: radius * 2,
            align: "center",
            lineBreak: false,
          },
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.gray500)
        .text(
          "/ 100",
          x - radius,
          y + 15,
          {
            width: radius * 2,
            align: "center",
            lineBreak: false,
          },
        );
    };

    const drawScoreBar = (
      x: number,
      y: number,
      width: number,
      score: number,
    ) => {
      doc
        .save()
        .roundedRect(x, y, width, 6, 3)
        .fill(COLORS.gray200)
        .roundedRect(
          x,
          y,
          Math.max(3, width * Math.max(0, Math.min(score, 100)) / 100),
          6,
          3,
        )
        .fill(scoreColor(score))
        .restore();
    };

    const drawPill = (
      text: string,
      x: number,
      y: number,
      width: number,
      background: string,
      color: string,
    ) => {
      doc
        .save()
        .roundedRect(x, y, width, 20, 10)
        .fill(background)
        .restore();

      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(color)
        .text(text, x, y + 6, {
          width,
          align: "center",
          lineBreak: false,
        });
    };

    const sectionTitle = (
      title: string,
      subtitle?: string,
    ) => {
      ensureSpace(subtitle ? 70 : 45);

      doc
        .font("Helvetica-Bold")
        .fontSize(17)
        .fillColor(COLORS.gray900)
        .text(t(title), PAGE.left, doc.y, {
          width: contentWidth,
          lineBreak: false,
        });

      doc.y += 7;

      if (subtitle) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(COLORS.gray500)
          .text(t(subtitle), PAGE.left, doc.y, {
            width: contentWidth,
          });

        doc.y += 12;
      } else {
        doc.y += 5;
      }
    };

    const getCategoryDescription = (category: any) => {
      const key = String(category?.key ?? "").toLowerCase();
      const label = String(category?.label ?? "").toLowerCase();

      const descriptions: Record<string, string> = {
        conversie:
          t("Hoe goed de pagina bezoekers richting een gewenste actie stuurt."),
        seo:
          t("Hoe goed zoekmachines de pagina kunnen begrijpen en indexeren."),
        mobiel:
          t("Signalen rondom mobiele weergave en gebruik."),
        techniek:
          t("Technische kwaliteit, prestaties en basisinstellingen van de pagina."),
        content:
          t("De hoeveelheid en structuur van de zichtbare inhoud."),
        vertrouwen:
          t("Signalen die bezoekers helpen vertrouwen in de organisatie te krijgen."),
        lokaal:
          t("Signalen die helpen om lokaal gevonden te worden."),
      };

      if (descriptions[key]) {
        return descriptions[key];
      }

      for (const [name, description] of Object.entries(descriptions)) {
        if (label.includes(name)) {
          return description;
        }
      }

      return t("Een verzameling controles die samen dit onderdeel van de website beoordelen.");
    };

    const TECHNICAL_LABELS: Record<string, string> = {
      https: "Beveiligde verbinding",
      h1Count: "Aantal H1-koppen",
      ctaCount: "Aantal CTA's",
      mapsLink: "Google Maps / kaartlink",
      canonical: "Canonical URL",
      linkCount: "Aantal links",
      pageTitle: "Paginatitel",
      compressed: "Compressie actief",
      hasSitemap: "Sitemap gevonden",
      httpStatus: "HTTP-status",
      imageCount: "Aantal afbeeldingen",
      pageSizeKb: "Paginaomvang",
      primaryCta: "Primaire CTA",
      sitemapUrl: "Sitemap URL",
      hasLanguage: "Taalinstelling",
      hasViewport: "Viewport ingesteld",
      placeSignal: "Locatiesignaal",
      hasRobotsTxt: "Robots.txt",
      headingCount: "Aantal headings",
      regionSignal: "Regio-signaal",
      imagesWithAlt: "Afbeeldingen met alt-tekst",
      responseTimeMs: "Responstijd",
      contentEncoding: "Content encoding",
      metaDescription: "Meta description",
      pageTitleLength: "Lengte paginatitel",
      externalLinkCount: "Externe links",
      internalLinkCount: "Interne links",
      visibleTextLength: "Zichtbare tekst",
      duplicateTextDetected: "Dubbele tekst gedetecteerd",
      metaDescriptionLength: "Lengte meta description",
      primaryCtaClearlyMarked: "Primaire CTA duidelijk gemarkeerd",
      localBusinessStructuredData:
        "LocalBusiness structured data",
    };

    const TECHNICAL_EXPLANATIONS: Record<string, string> = {
      https:
        "Een beveiligde verbinding tussen de website en de bezoeker. HTTPS helpt gegevens tijdens het versturen te beschermen.",
      h1Count:
        "Het aantal H1-hoofdkoppen op de pagina. De H1 helpt bezoekers en zoekmachines begrijpen waar de pagina over gaat.",
      ctaCount:
        "Het aantal duidelijke Call To Actions, zoals knoppen of links die bezoekers aansporen tot een actie.",
      mapsLink:
        "Of er een kaart- of routeverwijzing naar een fysieke locatie is gevonden.",
      canonical:
        "De URL die aan zoekmachines aangeeft welke versie van de pagina als hoofdversie moet worden beschouwd.",
      linkCount:
        "Het totale aantal links dat op de gecontroleerde pagina is gevonden.",
      pageTitle:
        "De titel van de pagina die onder meer in zoekresultaten en browsertabbladen wordt gebruikt.",
      compressed:
        "Of de webserver de pagina gecomprimeerd aanlevert om de hoeveelheid data en mogelijk de laadtijd te beperken.",
      hasSitemap:
        "Of een sitemap is gevonden die zoekmachines helpt pagina's van de website te ontdekken.",
      httpStatus:
        "De HTTP-status die de server terugstuurt. Status 200 betekent dat de pagina succesvol is opgehaald.",
      imageCount:
        "Het aantal afbeeldingen dat op de gecontroleerde pagina is gevonden.",
      pageSizeKb:
        "De omvang van de opgehaalde pagina. Een kleinere overdracht kan bijdragen aan sneller laden.",
      primaryCta:
        "De belangrijkste Call To Action die tijdens de scan als primaire actie is herkend.",
      sitemapUrl:
        "De URL van de sitemap die tijdens de scan is gevonden.",
      hasLanguage:
        "Of de HTML een taalinstelling bevat die de taal van de pagina aangeeft.",
      hasViewport:
        "Of de pagina een viewport-instelling bevat die belangrijk is voor correcte mobiele weergave.",
      placeSignal:
        "Of er een signaal voor een fysieke plaats of locatie is gevonden.",
      hasRobotsTxt:
        "Of robots.txt is gevonden. Dit bestand kan zoekmachines instructies geven over het crawlen van de website.",
      headingCount:
        "Het totale aantal headings of koppen dat op de pagina is gevonden.",
      regionSignal:
        "Of een duidelijk regionaal signaal is gevonden dat de pagina aan een gebied koppelt.",
      imagesWithAlt:
        "Het aantal afbeeldingen waarvoor alternatieve tekst is gevonden. Alt-tekst helpt toegankelijkheid en beschrijft afbeeldingen voor zoekmachines.",
      responseTimeMs:
        "De tijd die nodig was om de eerste webrespons te ontvangen. Een lagere waarde is doorgaans gunstiger voor snelheid.",
      contentEncoding:
        "De compressiemethode waarmee webinhoud wordt verstuurd. Brotli (br) is een moderne compressiemethode.",
      metaDescription:
        "De korte beschrijving van de pagina die onder meer in zoekresultaten kan worden gebruikt.",
      pageTitleLength:
        "Het aantal tekens in de paginatitel.",
      externalLinkCount:
        "Het aantal links naar andere domeinen dat op de pagina is gevonden.",
      internalLinkCount:
        "Het aantal links binnen dezelfde website dat op de pagina is gevonden.",
      visibleTextLength:
        "Het aantal tekens zichtbare tekst dat op de pagina is gevonden.",
      duplicateTextDetected:
        "Of tijdens de scan opvallend veel dubbele tekst is gedetecteerd.",
      metaDescriptionLength:
        "Het aantal tekens in de meta description.",
      primaryCtaClearlyMarked:
        "Of de primaire Call To Action in de HTML duidelijk als actie is gemarkeerd.",
      localBusinessStructuredData:
        "Of LocalBusiness structured data is gevonden waarmee bedrijfs- en locatiegegevens aan zoekmachines kunnen worden doorgegeven.",
    };

    const getTechnicalLabel = (key: string) =>
      TECHNICAL_LABELS[key] ?? key;

    const getTechnicalExplanation = (key: string) =>
      TECHNICAL_EXPLANATIONS[key] ??
      "Technische meetwaarde die tijdens de website-analyse is vastgesteld.";

    const formatTechnicalValue = (
      key: string,
      value: unknown,
    ) => {
      if (typeof value === "boolean") {
        return value ? "Ja" : "Nee";
      }

      if (value === null || value === undefined || value === "") {
        return "Niet gevonden";
      }

      if (key === "contentEncoding" && value === "br") {
        return "Brotli (br)";
      }

      if (key === "httpStatus" && Number(value) === 200) {
        return "200 — OK";
      }

      if (key === "pageSizeKb") {
        return `${value} KB`;
      }

      if (key === "responseTimeMs") {
        return `${value} ms`;
      }

      if (key === "pageTitleLength") {
        return `${value} tekens`;
      }

      if (key === "metaDescriptionLength") {
        return `${value} tekens`;
      }

      if (key === "visibleTextLength") {
        return `${value} tekens`;
      }

      return safe(value);
    };

    // -------------------------------------------------------------------------
    // COVER
    // -------------------------------------------------------------------------

    doc
      .rect(0, 0, PAGE.width, PAGE.height)
      .fill(COLORS.navy);

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(COLORS.white)
      .text("SITECHECK AI", PAGE.left, 58, {
        width: contentWidth,
        characterSpacing: 1.2,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(30)
      .fillColor(COLORS.white)
      .text("Volledig website-rapport", PAGE.left, 115, {
        width: contentWidth,
      });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#CBD5E1")
      .text(
        "Een overzicht van wat goed gaat, wat beter kan en welke acties het meeste verschil kunnen maken.",
        PAGE.left,
        160,
        {
          width: 430,
          lineGap: 4,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.white)
      .text("Website", PAGE.left, 232);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#CBD5E1")
      .text(url, PAGE.left, 249, {
        width: contentWidth,
      });

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#94A3B8")
      .text(
        `Gegenereerd op ${new Date().toLocaleDateString("nl-NL")}`,
        PAGE.left,
        274,
      );

    // Cover score card
    const coverCardY = 330;
    const coverCardH = 310;

    doc
      .save()
      .roundedRect(
        PAGE.left,
        coverCardY,
        contentWidth,
        coverCardH,
        16,
      )
      .fill(COLORS.white)
      .restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.gray500)
      .text("TOTAALSCORE", PAGE.left + 28, coverCardY + 28);

    drawScoreCircle(
      PAGE.left + 100,
      coverCardY + 105,
      58,
      Number(analysis.overallScore ?? 0),
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(COLORS.gray900)
      .text(
        scoreLabel(Number(analysis.overallScore ?? 0)),
        PAGE.left + 185,
        coverCardY + 66,
        {
          width: 250,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.gray600)
      .text(
        "De totaalscore is een samengestelde score op basis van de gemeten kwaliteit en de beschikbare meetdekking.",
        PAGE.left + 185,
        coverCardY + 92,
        {
          width: 270,
          lineGap: 3,
        },
      );

    // Quality
    roundedCard(
      PAGE.left + 28,
      coverCardY + 175,
      245,
      104,
      COLORS.gray50,
      COLORS.gray200,
      10,
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.gray900)
      .text(
        "Gemeten kwaliteit",
        PAGE.left + 42,
        coverCardY + 191,
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor(
        scoreColor(Number(analysis.overallQualityScore ?? 0)),
      )
      .text(
        `${Math.round(Number(analysis.overallQualityScore ?? 0))}/100`,
        PAGE.left + 42,
        coverCardY + 212,
      );

    doc
      .font("Helvetica")
      .fontSize(7.8)
      .fillColor(COLORS.gray600)
      .text(
        "Hoe goed de onderdelen die daadwerkelijk konden worden gemeten scoorden.",
        PAGE.left + 42,
        coverCardY + 241,
        {
          width: 210,
          lineGap: 2,
        },
      );

    // Coverage
    roundedCard(
      PAGE.left + 285,
      coverCardY + 175,
      234,
      104,
      COLORS.gray50,
      COLORS.gray200,
      10,
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.gray900)
      .text(
        "Meetdekking",
        PAGE.left + 299,
        coverCardY + 191,
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor(
        scoreColor(Number(analysis.overallCoveragePercent ?? 0)),
      )
      .text(
        `${Math.round(Number(analysis.overallCoveragePercent ?? 0))}%`,
        PAGE.left + 299,
        coverCardY + 212,
      );

    doc
      .font("Helvetica")
      .fontSize(7.8)
      .fillColor(COLORS.gray600)
      .text(
        "Hoeveel van de beschikbare controles tijdens deze scan konden worden uitgevoerd.",
        PAGE.left + 299,
        coverCardY + 241,
        {
          width: 198,
          lineGap: 2,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.gray400)
      .text(
        "Dit rapport bevat zowel meetresultaten als verbeteradviezen. Niet alle website-eigenschappen zijn automatisch te controleren.",
        PAGE.left + 28,
        coverCardY + 292,
        {
          width: contentWidth - 56,
        },
      );

    // -------------------------------------------------------------------------
    // EXECUTIVE SUMMARY
    // -------------------------------------------------------------------------

    newPage();

    sectionTitle(
      "1. Executive summary",
      "De belangrijkste uitkomsten van de website-analyse in één overzicht.",
    );

    const summaryY = doc.y;

    roundedCard(
      PAGE.left,
      summaryY,
      contentWidth,
      106,
      scoreBackground(Number(analysis.overallScore ?? 0)),
      scoreColor(Number(analysis.overallScore ?? 0)),
      12,
    );

    drawScoreCircle(
      PAGE.left + 68,
      summaryY + 53,
      35,
      Number(analysis.overallScore ?? 0),
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(COLORS.gray900)
      .text(
        "Totaalscore",
        PAGE.left + 125,
        summaryY + 24,
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.gray600)
      .text(
        "De totaalscore combineert de uitkomsten van de verschillende onderdelen van de website.",
        PAGE.left + 125,
        summaryY + 46,
        {
          width: 340,
          lineGap: 3,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.gray700)
      .text(
        `${Math.round(Number(analysis.overallQualityScore ?? 0))}% kwaliteit`,
        PAGE.left + 125,
        summaryY + 78,
      );

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.gray600)
      .text(
        "van de uitgevoerde controles",
        PAGE.left + 205,
        summaryY + 79,
      );

    doc.y = summaryY + 122;

    // Category cards
    const categoryCardWidth = (contentWidth - 14) / 2;
    const categoryCardHeight = 94;
    const categoryGap = 12;
    const categoryRows = Math.ceil(categories.length / 2);
    const categoryGridHeight =
      categoryRows * (categoryCardHeight + categoryGap) -
      categoryGap;

    ensureSpace(categoryGridHeight + 15);

    const categoryStartY = doc.y;

    categories.forEach((category: any, index: number) => {
      const row = Math.floor(index / 2);
      const col = index % 2;

      const x =
        PAGE.left +
        col * (categoryCardWidth + categoryGap);

      const y =
        categoryStartY +
        row * (categoryCardHeight + categoryGap);

      const score =
        typeof category?.score === "number"
          ? category.score
          : null;

      roundedCard(
        x,
        y,
        categoryCardWidth,
        categoryCardHeight,
        COLORS.white,
        COLORS.gray200,
        10,
      );

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(COLORS.gray900)
        .text(
          plainLanguage(safe(category?.label, "Categorie")),
          x + 14,
          y + 13,
          {
            width: categoryCardWidth - 70,
          },
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor(scoreColor(score))
        .text(
          typeof score === "number" ? `${Math.round(score)}` : "—",
          x + categoryCardWidth - 55,
          y + 11,
          {
            width: 40,
            align: "right",
          },
        );

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.gray600)
        .text(
          getCategoryDescription(category),
          x + 14,
          y + 35,
          {
            width: categoryCardWidth - 28,
            height: 25,
            lineGap: 2,
          },
        );

      drawScoreBar(
        x + 14,
        y + 66,
        categoryCardWidth - 28,
        score,
      );

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(COLORS.gray400)
        .text(
          scoreLabel(score),
          x + 14,
          y + 75,
          {
            width: categoryCardWidth - 28,
            align: "right",
          },
        );
    });

    doc.y = categoryStartY + categoryGridHeight + 12;

    // -------------------------------------------------------------------------
    // GLOSSARY
    // -------------------------------------------------------------------------

    sectionTitle(
      "Begrippen eenvoudig uitgelegd",
      "Geen technische voorkennis nodig. Hieronder staan de belangrijkste termen uit dit rapport in gewone taal.",
    );

    const glossary = [
      ["Vindbaarheid in Google", "Hoe goed zoekmachines kunnen begrijpen en vinden waar een pagina over gaat."],
      ["Actieknop", "Een knop of link die een bezoeker uitnodigt om iets te doen, zoals contact opnemen of een product bekijken."],
      ["Hoofdtitel", "De belangrijkste titel van een pagina. Deze helpt bezoekers en zoekmachines begrijpen waar de pagina over gaat."],
      ["Korte omschrijving voor Google", "Een korte beschrijving van een pagina die zoekmachines kunnen gebruiken in zoekresultaten."],
      ["Voorkeursadres van de pagina", "Het adres dat aan zoekmachines aangeeft welke versie van een pagina de hoofdversie is."],
      ["Voorvertoning bij delen", "Informatie die bepaalt hoe een pagina eruitziet wanneer de link wordt gedeeld via sociale media of berichtenapps."],
      ["Instructies voor zoekmachines", "Instellingen waarmee een website zoekmachines aanwijzingen kan geven over welke onderdelen ze mogen bezoeken."],
      ["Pagina-overzicht voor zoekmachines", "Een overzicht van belangrijke pagina’s waarmee zoekmachines nieuwe of gewijzigde pagina’s kunnen ontdekken."],
      ["Alt-tekst", "Een korte beschrijving van een afbeelding. Dit helpt mensen die de afbeelding niet kunnen zien en geeft zoekmachines extra context."],
      ["Google-meting voor snelheid en prestaties", "Een automatische Google-meting die onder andere kijkt naar de prestaties van een pagina op een mobiel apparaat."],
    ];

    ensureSpace(210);
    const glossaryWidth = contentWidth;
    const glossaryStartY = doc.y;
    let glossaryY = glossaryStartY;

    glossary.forEach(([term, explanation]) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(COLORS.gray900)
        .text(term, PAGE.left, glossaryY, {
          width: 175,
          lineBreak: false,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.gray600)
        .text(explanation, PAGE.left + 185, glossaryY, {
          width: glossaryWidth - 185,
          lineGap: 2,
        });

      glossaryY += Math.max(28, doc.heightOfString(explanation, {
        width: glossaryWidth - 185,
        lineGap: 2,
      }) + 12);

      if (glossaryY > PAGE.height - PAGE.bottom - 35) {
        newPage();
        glossaryY = doc.y;
      }
    });

    doc.y = glossaryY + 8;

    // -------------------------------------------------------------------------
    // STRENGTHS
    // -------------------------------------------------------------------------

    sectionTitle(
      "2. Wat gaat er al goed?",
      "Sterke punten die tijdens de scan zijn aangetroffen.",
    );

    if (strengths.length === 0) {
      roundedCard(
        PAGE.left,
        doc.y,
        contentWidth,
        64,
        COLORS.gray50,
        COLORS.gray200,
      );

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.gray600)
        .text(
          "Er zijn geen afzonderlijke sterke punten beschikbaar in de scanresultaten.",
          PAGE.left + 16,
          doc.y + 21,
          {
            width: contentWidth - 32,
          },
        );

      doc.y += 80;
    } else {
      const strengthCardWidth = (contentWidth - 14) / 2;
      const strengthCardHeight = 100;
      const strengthGap = 12;
      const strengthRows = Math.ceil(strengths.length / 2);
      const strengthGridHeight =
        strengthRows * (strengthCardHeight + strengthGap) -
        strengthGap;

      ensureSpace(strengthGridHeight);

      const strengthStartY = doc.y;

      strengths.forEach((issue: any, index: number) => {
        const row = Math.floor(index / 2);
        const col = index % 2;

        const x =
          PAGE.left +
          col * (strengthCardWidth + strengthGap);

        const y =
          strengthStartY +
          row * (strengthCardHeight + strengthGap);

        roundedCard(
          x,
          y,
          strengthCardWidth,
          strengthCardHeight,
          COLORS.greenLight,
          "#BBF7D0",
          10,
        );

        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor(COLORS.green)
          .text(
            "OK  " +
              plainLanguage(safe(
                issue?.label ??
                  issue?.title ??
                  issue?.name ??
                  issue?.key,
                "Sterk punt",
              )),
            x + 14,
            y + 13,
            {
              width: strengthCardWidth - 28,
            },
          );

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.gray600)
          .text(
            plainLanguage(safe(
              issue?.evidence ??
                issue?.description ??
                issue?.explanation ??
                issue?.message,
              "Dit onderdeel scoorde positief tijdens de scan.",
            )),
            x + 14,
            y + 39,
            {
              width: strengthCardWidth - 28,
              height: 48,
              lineGap: 2.5,
            },
          );
      });

      doc.y = strengthStartY + strengthGridHeight + 12;
    }

    // -------------------------------------------------------------------------
    // RECOMMENDATIONS
    // -------------------------------------------------------------------------

    sectionTitle(
      "3. Belangrijkste verbeterpunten",
      `De ${recommendations.length} belangrijkste verbeterpunten uit het betaalde rapport.`,
    );

    const addRecommendationCard = (
      recommendation: any,
      index: number,
    ) => {
      const cardWidth = contentWidth;
      const innerWidth = cardWidth - 32;

      const title = plainLanguage(safe(
        recommendation?.title ??
          recommendation?.issue ??
          recommendation?.name,
        `Verbeterpunt ${index + 1}`,
      ));

      const impact = safe(
        recommendation?.impact,
        "Niet aangegeven",
      );

      const difficulty = safe(
        recommendation?.difficulty,
        "Niet aangegeven",
      );

      const fact = plainLanguage(safe(
        recommendation?.fact ??
          recommendation?.finding ??
          recommendation?.what,
        "",
      ));

      const why = plainLanguage(safe(
        recommendation?.why ??
          recommendation?.importance ??
          recommendation?.reason,
        "",
      ));

      const recommendationText = plainLanguage(safe(
        recommendation?.recommendation ??
          recommendation?.advice ??
          recommendation?.solution,
        "",
      ));

      const proposal = plainLanguage(safe(
        recommendation?.concreteProposal ??
          recommendation?.proposal ??
          recommendation?.action,
        "",
      ));

      const blocks = [
        ["Wat we zagen", fact],
        ["Waarom dit belangrijk is", why],
        ["Aanbeveling", recommendationText],
        ["Concreet voorstel", proposal],
      ].filter((item) => item[1] && item[1] !== "Niet beschikbaar");

      doc.font("Helvetica-Bold").fontSize(11);
      const titleHeight = doc.heightOfString(title, {
        width: cardWidth - 170,
        lineGap: 2,
      });

      let measuredContentHeight = 0;

      for (const [, text] of blocks) {
        doc.font("Helvetica").fontSize(8);
        measuredContentHeight +=
          10 +
          doc.heightOfString(text, {
            width: innerWidth,
            lineGap: 2,
          }) +
          8;
      }

      const cardHeight = Math.max(
        128,
        70 +
          Math.max(22, Math.min(titleHeight, 40)) +
          measuredContentHeight,
      );

      const available =
        PAGE.height - PAGE.bottom - doc.y;

      if (
        cardHeight > available &&
        doc.y > PAGE.top + 20
      ) {
        newPage();
      }

      const y = doc.y;

      roundedCard(
        PAGE.left,
        y,
        cardWidth,
        cardHeight,
        COLORS.white,
        COLORS.gray200,
        12,
      );

      // Number
      doc
        .save()
        .circle(PAGE.left + 27, y + 27, 14)
        .fill(COLORS.navy)
        .restore();

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.white)
        .text(
          `${index + 1}`,
          PAGE.left + 18,
          y + 23,
          {
            width: 18,
            align: "center",
            lineBreak: false,
          },
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLORS.gray900)
        .text(
          title,
          PAGE.left + 52,
          y + 16,
          {
            width: cardWidth - 190,
            height: 36,
            lineGap: 2,
          },
        );

      drawPill(
        `Impact: ${impact}`,
        PAGE.left + cardWidth - 132,
        y + 12,
        76,
        COLORS.orangeLight,
        COLORS.orange,
      );

      drawPill(
        `Moeite: ${difficulty}`,
        PAGE.left + cardWidth - 132,
        y + 38,
        76,
        COLORS.blueLight,
        COLORS.blue,
      );

      let textY =
        y +
        70 +
        Math.max(0, Math.min(titleHeight - 22, 18));

      for (const [label, text] of blocks) {
        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor(COLORS.gray500)
          .text(label, PAGE.left + 16, textY, {
            width: innerWidth,
            lineBreak: false,
          });

        textY += 10;

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.gray700)
          .text(text, PAGE.left + 16, textY, {
            width: innerWidth,
            lineGap: 2,
          });

        textY +=
          doc.heightOfString(text, {
            width: innerWidth,
            lineGap: 2,
          }) + 8;
      }

      doc.y = y + cardHeight + 12;
    };

    if (recommendations.length === 0) {
      roundedCard(
        PAGE.left,
        doc.y,
        contentWidth,
        70,
        COLORS.gray50,
        COLORS.gray200,
      );

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.gray600)
        .text(
          "Er zijn geen AI-verbeterpunten beschikbaar voor deze scan.",
          PAGE.left + 16,
          doc.y + 25,
          {
            width: contentWidth - 32,
          },
        );

      doc.y += 86;
    } else {
      recommendations.forEach(
        (recommendation: any, index: number) => {
          addRecommendationCard(
            recommendation,
            index,
          );
        },
      );
    }

    // -------------------------------------------------------------------------
    // ACTION PLAN
    // -------------------------------------------------------------------------

    ensureSpace(180);

    sectionTitle(
      "4. Actieplan",
      "Een compacte samenvatting van de verbeterpunten en de bijbehorende aanpak.",
    );

    const actionHeaderY = doc.y;

    roundedCard(
      PAGE.left,
      actionHeaderY,
      contentWidth,
      30,
      COLORS.navy,
      COLORS.navy,
      6,
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.white)
      .text("ACTIE", PAGE.left + 14, actionHeaderY + 10);

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.white)
      .text(
        "IMPACT",
        PAGE.left + contentWidth - 155,
        actionHeaderY + 10,
        {
          width: 60,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.white)
      .text(
        "MOEITE",
        PAGE.left + contentWidth - 82,
        actionHeaderY + 10,
        {
          width: 65,
        },
      );

    doc.y = actionHeaderY + 40;

    recommendations.forEach(
      (recommendation: any, index: number) => {
        const rowHeight = 42;

        ensureSpace(rowHeight + 6);

        const y = doc.y;

        const background =
          index % 2 === 0
            ? COLORS.gray50
            : COLORS.white;

        roundedCard(
          PAGE.left,
          y,
          contentWidth,
          rowHeight,
          background,
          COLORS.gray200,
          6,
        );

        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor(COLORS.gray900)
          .text(
            `${index + 1}. ${safe(
              recommendation?.title ??
                recommendation?.issue ??
                recommendation?.name,
              "Verbeterpunt",
            )}`,
            PAGE.left + 12,
            y + 13,
            {
              width: contentWidth - 175,
              lineBreak: false,
            },
          );

        const impact = safe(
          recommendation?.impact,
          "—",
        );

        const difficulty = safe(
          recommendation?.difficulty,
          "—",
        );

        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(COLORS.gray600)
          .text(
            impact,
            PAGE.left + contentWidth - 155,
            y + 14,
            {
              width: 60,
              align: "center",
            },
          );

        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(COLORS.gray600)
          .text(
            difficulty,
            PAGE.left + contentWidth - 82,
            y + 14,
            {
              width: 65,
              align: "center",
            },
          );

        doc.y = y + rowHeight + 5;
      },
    );

    // -------------------------------------------------------------------------
    // TECHNICAL MEASUREMENTS
    // -------------------------------------------------------------------------

    ensureSpace(190);

    sectionTitle(
      "5. Technische metingen",
      "De belangrijkste technische meetwaarden uit de scan, inclusief uitleg in gewone taal.",
    );

    const technicalEntries = Object.entries(facts)
      .filter(([key, value]) => {
        if (Array.isArray(value)) return false;
        if (value === null || value === undefined) return false;
        return true;
      })
      .map(([key, value]) => ({
        key,
        label: plainLanguage(getTechnicalLabel(key)),
        value: formatTechnicalValue(key, value),
        explanation: plainLanguage(getTechnicalExplanation(key)),
      }));

    if (technicalEntries.length === 0) {
      roundedCard(
        PAGE.left,
        doc.y,
        contentWidth,
        65,
        COLORS.gray50,
        COLORS.gray200,
      );

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.gray600)
        .text(
          "Er zijn geen afzonderlijke technische meetwaarden beschikbaar.",
          PAGE.left + 16,
          doc.y + 22,
        );

      doc.y += 80;
    } else {
      const metricGap = 12;
      const metricWidth =
        (contentWidth - metricGap) / 2;

      for (
        let index = 0;
        index < technicalEntries.length;
        index += 2
      ) {
        const rowEntries =
          technicalEntries.slice(index, index + 2);

        const measuredHeights = rowEntries.map(
          (entry) => {
            doc.font("Helvetica").fontSize(7.5);

            const explanationHeight =
              doc.heightOfString(
                entry.explanation,
                {
                  width: metricWidth - 28,
                  lineGap: 2,
                },
              );

            doc.font("Helvetica-Bold").fontSize(9);

            const valueHeight =
              doc.heightOfString(
                entry.value,
                {
                  width: metricWidth - 28,
                  lineGap: 2,
                },
              );

            return Math.max(
              88,
              48 +
                explanationHeight +
                valueHeight,
            );
          },
        );

        const rowHeight = Math.max(
          ...measuredHeights,
        );

        ensureSpace(rowHeight + 10);

        const rowY = doc.y;

        rowEntries.forEach(
          (entry, col) => {
            const x =
              PAGE.left +
              col * (metricWidth + metricGap);

            roundedCard(
              x,
              rowY,
              metricWidth,
              rowHeight,
              COLORS.white,
              COLORS.gray200,
              9,
            );

            doc
              .font("Helvetica-Bold")
              .fontSize(8.5)
              .fillColor(COLORS.gray900)
              .text(
                entry.label,
                x + 14,
                rowY + 12,
                {
                  width: metricWidth - 28,
                },
              );

            doc
              .font("Helvetica-Bold")
              .fontSize(9)
              .fillColor(COLORS.blue)
              .text(
                entry.value,
                x + 14,
                rowY + 31,
                {
                  width: metricWidth - 28,
                  lineGap: 2,
                },
              );

            const valueHeight =
              doc.heightOfString(
                entry.value,
                {
                  width: metricWidth - 28,
                  lineGap: 2,
                },
              );

            doc
              .font("Helvetica")
              .fontSize(7.5)
              .fillColor(COLORS.gray600)
              .text(
                entry.explanation,
                x + 14,
                rowY + 38 + valueHeight,
                {
                  width: metricWidth - 28,
                  lineGap: 2,
                },
              );
          },
        );

        doc.y = rowY + rowHeight + 10;
      }
    }

    // -------------------------------------------------------------------------
    // NOT CHECKED
    // -------------------------------------------------------------------------

    if (notChecked.length > 0) {
      ensureSpace(160);

      sectionTitle(
        "6. Wat konden we niet controleren?",
        "Niet iedere eigenschap van een website kan betrouwbaar automatisch worden vastgesteld.",
      );

      notChecked.forEach(
        (item: any, index: number) => {
          const text =
            typeof item === "string"
              ? item
              : safe(
                  item?.message ??
                    item?.reason ??
                    item?.title ??
                    item,
                );

          doc.font("Helvetica").fontSize(8);

          const textHeight =
            doc.heightOfString(text, {
              width: contentWidth - 48,
              lineGap: 2,
            });

          const cardHeight = Math.max(
            48,
            textHeight + 28,
          );

          ensureSpace(cardHeight + 8);

          const y = doc.y;

          roundedCard(
            PAGE.left,
            y,
            contentWidth,
            cardHeight,
            COLORS.orangeLight,
            "#FED7AA",
            9,
          );

          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .fillColor(COLORS.orange)
            .text(
              `${index + 1}`,
              PAGE.left + 14,
              y + 13,
              {
                width: 20,
              },
            );

          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(COLORS.gray700)
            .text(
              text,
              PAGE.left + 40,
              y + 13,
              {
                width: contentWidth - 56,
                lineGap: 2,
              },
            );

          doc.y = y + cardHeight + 8;
        },
      );
    }

    // -------------------------------------------------------------------------
    // CLOSING
    // -------------------------------------------------------------------------

    ensureSpace(125);

    roundedCard(
      PAGE.left,
      doc.y,
      contentWidth,
      105,
      COLORS.navy,
      COLORS.navy,
      12,
    );

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.white)
      .text(
        "Samengevat",
        PAGE.left + 20,
        doc.y + 18,
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#CBD5E1")
      .text(
        "Gebruik de verbeterpunten in dit rapport als praktische checklist. Begin met de punten met de grootste impact en werk daarna de technische en inhoudelijke verbeteringen verder uit.",
        PAGE.left + 20,
        doc.y + 43,
        {
          width: contentWidth - 40,
          lineGap: 3,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.white)
      .text(
        "SiteCheck AI",
        PAGE.left + 20,
        doc.y + 82,
      );

    // Footer on final page
    addFooter();

        doc.end();
  } catch (error) {
    console.error("Failed to generate PDF report:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "PDF kon niet worden gegenereerd.",
      });
    }
  }
});

export default router;