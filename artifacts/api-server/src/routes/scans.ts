import "dotenv/config";
import OpenAI from "openai";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, isNotNull, lt, or } from "drizzle-orm";
import { db, scansTable } from "@workspace/db";
import {
  CreateScanBody,
  CreateScanResponse,
  GetScanParams,
  GetScanResponse,
} from "@workspace/api-zod";
import { analyzeWebsite } from "../lib/website-analysis";
import { generateAiRecommendations } from "../lib/ai-website-analysis";
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import { checkoutRateLimit, scanRateLimit } from "../lib/rate-limit";
import { normalizeLocale, type Locale } from "../lib/locale";

const router: IRouter = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

const frontendUrl =
  process.env.FRONTEND_URL ?? "http://localhost:5173";

const FREE_SCAN_RETENTION_DAYS = 30;
const PAID_SCAN_RETENTION_DAYS = 365;

async function cleanupExpiredScans(): Promise<void> {
  const now = Date.now();
  const freeCutoff = new Date(now - FREE_SCAN_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const paidCutoff = new Date(now - PAID_SCAN_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  await db.delete(scansTable).where(
    or(
      and(
        eq(scansTable.paymentStatus, "unpaid"),
        lt(scansTable.createdAt, freeCutoff),
      ),
      and(
        eq(scansTable.paymentStatus, "paid"),
        lt(scansTable.paidAt, paidCutoff),
      ),
    ),
  );
}

void cleanupExpiredScans().catch((error) => {
  console.error("[retention] Initial scan cleanup failed", error);
});

setInterval(() => {
  void cleanupExpiredScans().catch((error) => {
    console.error("[retention] Scheduled scan cleanup failed", error);
  });
}, 24 * 60 * 60 * 1000);



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
  locale: Locale,
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

router.post("/scans", scanRateLimit, async (req, res): Promise<void> => {
  const parsed = CreateScanBody.safeParse(req.body);
  if (!parsed.success || !isWebsiteUrl(parsed.data?.url ?? "")) {
    res.status(400).json({ error: "Vul een geldige website-URL in." });
    return;
  }

  const locale = normalizeLocale(req.headers["x-sitecheck-language"]);

  const [scan] = await db
    .insert(scansTable)
    .values({ url: parsed.data.url, status: "analyzing" })
    .returning();

  const accessToken = createScanAccessToken(scan.id);

  req.log.info({ scanId: scan.id }, "Website scan request accepted");

  res.status(201).json({ ...CreateScanResponse.parse(scan), accessToken });

  void processScan(scan.id, parsed.data.url, locale, req.log);
});

router.get("/scans/stats", async (_req, res): Promise<void> => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await db
      .select({ id: scansTable.id })
      .from(scansTable)
      .where(and(lt(since, scansTable.createdAt)));
    res.setHeader("Cache-Control", "no-store");
    res.json({ last7Days: recent.length });
  } catch (error) {
    console.error("[stats] Could not count recent scans", error);
    res.status(503).json({ error: "Statistieken tijdelijk niet beschikbaar." });
  }
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

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.json(GetScanResponse.parse(normalizeScanAnalysis(scan)));
});

router.post("/scans/:scanId/checkout", checkoutRateLimit, async (req, res): Promise<void> => {
  const scanId = Number(req.params.scanId);

  if (!Number.isInteger(scanId) || scanId <= 0) {
    res.status(400).json({ error: "Ongeldig scan-ID." });
    return;
  }

  if (req.headers["x-sitecheck-terms-accepted"] !== "true") {
    res.status(400).json({
      error: "Bevestig eerst de algemene voorwaarden en het verzoek om de dienst direct te starten.",
    });
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
      customer_creation: "always",
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
        locale: normalizeLocale(req.headers["x-sitecheck-language"]),
        termsAccepted: "true",
        serviceStartRequested: "true",
      },
      payment_intent_data: {
        metadata: {
          scanId: String(scanId),
        },
      },
    });

    await db
      .update(scansTable)
      .set({
        stripeCheckoutSessionId: session.id,
      })
      .where(eq(scansTable.id, scanId));

    res.setHeader("Cache-Control", "no-store");
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
    const locale = normalizeLocale(req.query.lang);

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

    const facts =
      analysis.detectedFacts &&
      typeof analysis.detectedFacts === "object"
        ? analysis.detectedFacts
        : {};

    const notChecked = Array.isArray(analysis.notChecked)
      ? analysis.notChecked.map((item: unknown) => {
          const text = typeof item === "string" ? item : String(item ?? "");
          const friendly: Record<string, string> = {
            "De mobiele PageSpeed Insights-performancecheck kon niet worden uitgevoerd.":
              "De mobiele snelheidstest kon op dit moment niet worden uitgevoerd.",
            "Alleen de homepage en de vaste robots.txt/sitemap-locaties zijn opgehaald; interne pagina's zijn niet gecrawld.":
              "We hebben alleen de homepage bekeken. Andere pagina's zijn niet meegenomen in deze scan.",
            "De inhoud en kwaliteit van externe backlinks zijn niet gecontroleerd.":
              "We hebben niet onderzocht welke andere websites naar deze website linken.",
            "De volledigheid van juridische teksten, reviews en bedrijfsgegevens is niet juridisch of handmatig beoordeeld.":
              "We hebben juridische teksten, reviews en bedrijfsgegevens niet inhoudelijk beoordeeld.",
            "CTA-plaatsing boven de vouw is niet gecontroleerd zonder browserrendering.":
              "We hebben niet getest hoe de belangrijkste knop zichtbaar is voordat een bezoeker naar beneden scrollt.",
          };
          return friendly[text] ?? text;
        })
      : [];

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,
      info: {
        Title: "SiteCheck AI – Website rapport",
        Author: "SiteCheck AI",
        Subject: `Website analyse voor ${url}`,
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
      "Volledig website-rapport": "Full website report",
      "Een overzicht van wat goed gaat, wat beter kan en welke acties het meeste verschil kunnen maken.": "An overview of what is working well, what can be improved and which actions can make the biggest difference.",
      "Gegenereerd op": "Generated on",
      "TOTAALSCORE": "OVERALL SCORE",
      "De totaalscore is een samengestelde score op basis van de gemeten kwaliteit en de beschikbare meetdekking.": "The overall score combines measured quality with the available measurement coverage.",
      "Gemeten kwaliteit": "Measured quality",
      "Hoe goed de onderdelen die daadwerkelijk konden worden gemeten scoorden.": "How well the parts that could actually be measured performed.",
      "Meetdekking": "Measurement coverage",
      "Hoeveel van de beschikbare controles tijdens deze scan konden worden uitgevoerd.": "How many of the available checks could be completed during this scan.",
      "Dit rapport bevat zowel meetresultaten als verbeteradviezen. Niet alle website-eigenschappen zijn automatisch te controleren.": "This report contains both measurement results and improvement advice. Not every website property can be checked automatically.",
      "De belangrijkste uitkomsten van de website-analyse in één overzicht.": "The key results of the website analysis in one overview.",
      "Totaalscore": "Overall score",
      "De totaalscore combineert de uitkomsten van de verschillende onderdelen van de website.": "The overall score combines the results of the different areas of the website.",
      "kwaliteit": "quality",
      "De": "The",
      "van de uitgevoerde controles": "of the completed checks",
      "Categorie": "Category",
      "Begrippen eenvoudig uitgelegd": "Key terms explained simply",
      "Geen technische voorkennis nodig. Hieronder staan de belangrijkste termen uit dit rapport in gewone taal.": "No technical knowledge is required. Below are the key terms from this report explained in plain language.",
      "Vindbaarheid in Google": "Visibility in Google",
      "Hoe goed zoekmachines kunnen begrijpen en vinden waar een pagina over gaat.": "How well search engines can understand and identify what a page is about.",
      "Actieknop": "Call-to-action button",
      "Een knop of link die een bezoeker uitnodigt om iets te doen, zoals contact opnemen of een product bekijken.": "A button or link that invites a visitor to take an action, such as getting in touch or viewing a product.",
      "Hoofdtitel": "Main heading",
      "De belangrijkste titel van een pagina. Deze helpt bezoekers en zoekmachines begrijpen waar de pagina over gaat.": "The main heading of a page. It helps visitors and search engines understand what the page is about.",
      "Korte omschrijving voor Google": "Page description for Google",
      "Een korte beschrijving van een pagina die zoekmachines kunnen gebruiken in zoekresultaten.": "A short description of a page that search engines may use in search results.",
      "Voorkeursadres van de pagina": "Preferred page address",
      "Het adres dat aan zoekmachines aangeeft welke versie van een pagina de hoofdversie is.": "The address that tells search engines which version of a page is the main version.",
      "Voorvertoning bij delen": "Sharing preview",
      "Informatie die bepaalt hoe een pagina eruitziet wanneer de link wordt gedeeld via sociale media of berichtenapps.": "Information that determines how a page appears when its link is shared through social media or messaging apps.",
      "Instructies voor zoekmachines": "Search engine instructions",
      "Instellingen waarmee een website zoekmachines aanwijzingen kan geven over welke onderdelen ze mogen bezoeken.": "Settings that give search engines instructions about which parts of a website they may visit.",
      "Pagina-overzicht voor zoekmachines": "Search engine page overview",
      "Een overzicht van belangrijke pagina’s waarmee zoekmachines nieuwe of gewijzigde pagina’s kunnen ontdekken.": "An overview of important pages that helps search engines discover new or changed pages.",
      "Alt-tekst": "Alt text",
      "Een korte beschrijving van een afbeelding. Dit helpt mensen die de afbeelding niet kunnen zien en geeft zoekmachines extra context.": "A short description of an image. It helps people who cannot see the image and gives search engines additional context.",
      "Google-meting voor snelheid en prestaties": "Google speed and performance measurement",
      "Een automatische Google-meting die onder andere kijkt naar de prestaties van een pagina op een mobiel apparaat.": "An automated Google measurement that assesses, among other things, page performance on a mobile device.",
      "De 10 belangrijkste verbeterpunten uit het betaalde rapport.": "The 10 most important improvement points from the paid report.",
      "belangrijkste verbeterpunten uit het betaalde rapport.": "most important improvement points from the paid report.",
      "Actieplan": "Action plan",
      "Een compacte samenvatting van de verbeterpunten en de bijbehorende aanpak.": "A concise summary of the improvement points and the corresponding approach.",
      "Wat we op je website hebben gemeten": "What we measured on your website",
      "De belangrijkste metingen uit de scan. Hiermee zien we waar op je website verbeteringen mogelijk zijn.": "The key measurements from the scan. They help show where improvements may be possible.",
      "Er zijn geen afzonderlijke technische meetwaarden beschikbaar.": "No individual technical measurements are available.",
      "Wat konden we niet controleren?": "What could we not check?",
      "Sommige dingen kun je niet betrouwbaar beoordelen zonder alle pagina’s te bekijken of de website in een echte browser te testen.": "Some things cannot be reliably assessed without checking all pages or testing the website in a real browser.",
      "Samengevat": "Summary",
      "Gebruik de verbeterpunten in dit rapport als praktische checklist. Begin met de punten met de grootste impact en werk daarna de technische en inhoudelijke verbeteringen verder uit.": "Use the improvement points in this report as a practical checklist. Start with the highest-impact items, then work through the technical and content improvements.",
      "Er zijn geen afzonderlijke sterke punten beschikbaar in de scanresultaten.": "No individual strengths are available in the scan results.",
      "Er zijn geen AI-verbeterpunten beschikbaar voor deze scan.": "No AI improvement points are available for this scan.",
      "Beveiligde verbinding": "Secure connection",
      "Aantal H1-koppen": "Number of main headings",
      "Aantal CTA's": "Number of call-to-action buttons",
      "Google Maps / kaartlink": "Google Maps / map link",
      "Canonical URL": "Preferred page address",
      "Aantal links": "Number of links",
      "Compressie actief": "Compression enabled",
      "Sitemap gevonden": "Sitemap found",
      "HTTP-status": "Server response",
      "Aantal afbeeldingen": "Number of images",
      "Paginaomvang": "Page size",
      "Primaire CTA": "Primary call-to-action",
      "Sitemap URL": "Sitemap URL",
      "Taalinstelling": "Language setting",
      "Viewport ingesteld": "Viewport configured",
      "Locatiesignaal": "Location signal",
      "Robots.txt": "Robots.txt",
      "Aantal headings": "Number of headings",
      "Regio-signaal": "Regional signal",
      "Content encoding": "Content encoding",
      "Meta description": "Page description",
      "Zichtbare tekst": "Visible text",
      "Dubbele tekst gedetecteerd": "Duplicate text detected",
      "Lengte meta description": "Page description length",
      "Primaire CTA duidelijk gemarkeerd": "Primary call-to-action clearly marked",
      "Bedrijfsinformatie voor Google": "Structured business information for search engines",
      "Een beveiligde verbinding tussen de website en de bezoeker. HTTPS helpt gegevens tijdens het versturen te beschermen.": "A secure connection between the website and the visitor. HTTPS helps protect data while it is being transmitted.",
      "Het aantal H1-hoofdkoppen op de pagina. De H1 helpt bezoekers en zoekmachines begrijpen waar de pagina over gaat.": "The number of main headings on the page. The main heading helps visitors and search engines understand what the page is about.",
      "Het aantal duidelijke Call To Actions, zoals knoppen of links die bezoekers aansporen tot een actie.": "The number of clear call-to-action elements, such as buttons or links that encourage visitors to take an action.",
      "Of er een kaart- of routeverwijzing naar een fysieke locatie is gevonden.": "Whether a map or route reference to a physical location was found.",
      "De URL die aan zoekmachines aangeeft welke versie van de pagina als hoofdversie moet worden beschouwd.": "The URL that tells search engines which version of the page should be treated as the main version.",
      "Het totale aantal links dat op de gecontroleerde pagina is gevonden.": "The total number of links found on the checked page.",
      "De titel van de pagina die onder meer in zoekresultaten en browsertabbladen wordt gebruikt.": "The title of the page used in search results and browser tabs, among other places.",
      "Of de webserver de pagina gecomprimeerd aanlevert om de hoeveelheid data en mogelijk de laadtijd te beperken.": "Whether the web server delivers the page compressed to reduce the amount of data and potentially improve load time.",
      "Of een sitemap is gevonden die zoekmachines helpt pagina's van de website te ontdekken.": "Whether a sitemap was found that helps search engines discover pages on the website.",
      "De HTTP-status die de server terugstuurt. Status 200 betekent dat de pagina succesvol is opgehaald.": "The server response status. Status 200 means the page was successfully retrieved.",
      "Het aantal afbeeldingen dat op de gecontroleerde pagina is gevonden.": "The number of images found on the checked page.",
      "De omvang van de opgehaalde pagina. Een kleinere overdracht kan bijdragen aan sneller laden.": "The size of the retrieved page. A smaller transfer can contribute to faster loading.",
      "De belangrijkste Call To Action die tijdens de scan als primaire actie is herkend.": "The main call-to-action identified as the primary action during the scan.",
      "De URL van de sitemap die tijdens de scan is gevonden.": "The sitemap URL found during the scan.",
      "Of de HTML een taalinstelling bevat die de taal van de pagina aangeeft.": "Whether the HTML contains a language setting that indicates the page language.",
      "Of de pagina een viewport-instelling bevat die belangrijk is voor correcte mobiele weergave.": "Whether the page contains a viewport setting important for correct mobile display.",
      "Of er een signaal voor een fysieke plaats of locatie is gevonden.": "Whether a signal for a physical place or location was found.",
      "Of robots.txt is gevonden. Dit bestand kan zoekmachines instructies geven over het crawlen van de website.": "Whether robots.txt was found. This file can give search engines instructions about crawling the website.",
      "Het totale aantal headings of koppen dat op de pagina is gevonden.": "The total number of headings found on the page.",
      "Of een duidelijk regionaal signaal is gevonden dat de pagina aan een gebied koppelt.": "Whether a clear regional signal was found linking the page to an area.",
      "Het aantal afbeeldingen waarvoor alternatieve tekst is gevonden. Alt-tekst helpt toegankelijkheid en beschrijft afbeeldingen voor zoekmachines.": "The number of images for which alternative text was found. Alt text supports accessibility and describes images for search engines.",
      "De tijd die nodig was om de eerste webrespons te ontvangen. Een lagere waarde is doorgaans gunstiger voor snelheid.": "The time needed to receive the first web response. A lower value is generally better for speed.",
      "De compressiemethode waarmee webinhoud wordt verstuurd. Brotli (br) is een moderne compressiemethode.": "The compression method used to transmit web content. Brotli (br) is a modern compression method.",
      "De korte beschrijving van de pagina die onder meer in zoekresultaten kan worden gebruikt.": "The short page description that may be used in search results, among other places.",
      "Het aantal tekens in de paginatitel.": "The number of characters in the page title.",
      "Het aantal links naar andere domeinen dat op de pagina is gevonden.": "The number of links to other domains found on the page.",
      "Het aantal links binnen dezelfde website dat op de pagina is gevonden.": "The number of links within the same website found on the page.",
      "Het aantal tekens zichtbare tekst dat op de pagina is gevonden.": "The number of visible text characters found on the page.",
      "Of tijdens de scan opvallend veel dubbele tekst is gedetecteerd.": "Whether an unusually large amount of duplicate text was detected during the scan.",
      "Het aantal tekens in de meta description.": "The number of characters in the page description.",
      "Of de primaire Call To Action in de HTML duidelijk als actie is gemarkeerd.": "Whether the primary call-to-action is clearly marked as an action in the HTML.",
      "Of LocalBusiness structured data is gevonden waarmee bedrijfs- en locatiegegevens aan zoekmachines kunnen worden doorgegeven.": "Whether structured business information was found that can provide business and location details to search engines.",
      "Dit is een meetwaarde uit de scan die helpt om verbeterpunten te bepalen.": "This is a measurement from the scan that helps identify possible improvements.",
      "tekens": "characters",
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
      "Actieplan voor de komende 30 dagen": "30-day action plan",
      "Pak eerst de punten met hoge impact en weinig moeite aan. Werk daarna de overige verbeterpunten stap voor stap af.": "Start with the high-impact, low-effort items. Then work through the remaining improvements step by step.",
      "Een compacte samenvatting van de verbeterpunten en de bijbehorende aanpak.": "A concise summary of the improvement points and the corresponding approach.",
      "ACTIE": "ACTION",
      "MOEITE": "EFFORT",
      "5. Technische metingen": "5. Technical measurements",
      "De belangrijkste technische meetwaarden uit de scan, inclusief uitleg in gewone taal.": "The key technical measurements from the scan, explained in plain language.",
      "Er zijn geen afzonderlijke technische meetwaarden beschikbaar.": "No individual technical measurements are available.",
      "6. Dit konden we niet betrouwbaar beoordelen": "6. What we could not reliably assess",
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
      "Niet aangegeven": "Not specified",
      "Hoog": "High",
      "Gemiddeld": "Medium",
      "Laag": "Low",
      "Makkelijk": "Easy",
      "Gemiddeld moeilijk": "Medium",
      "Moeilijk": "Difficult",
    };

    const pdfInternationalTranslations: Record<"de" | "fr" | "es", Record<string, string>> = {
      de: {
        "Ja":"Ja","Nee":"Nein","Niet gemeten":"Nicht gemessen","Uitstekend":"Ausgezeichnet","Goed":"Gut","Redelijk":"Ordentlich","Verbetering nodig":"Verbesserung erforderlich","Veel verbetering nodig":"Deutlich verbesserungsbedürftig",
        "SiteCheck AI • Website analyse":"SiteCheck AI • Websiteanalyse","Pagina":"Seite","Website":"Website","Gegenereerd op":"Erstellt am","TOTAALSCORE":"GESAMTSCORE","Gemeten kwaliteit":"Gemessene Qualität","Meetdekking":"Messabdeckung","Totaalscore":"Gesamtscore","kwaliteit":"Qualität","van de uitgevoerde controles":"der durchgeführten Prüfungen",
        "Begrippen eenvoudig uitgelegd":"Begriffe einfach erklärt","2. Wat gaat er al goed?":"2. Was läuft bereits gut?","Sterke punten die tijdens de scan zijn aangetroffen.":"Stärken, die beim Scan festgestellt wurden.","Er zijn geen afzonderlijke sterke punten beschikbaar in de scanresultaten.":"Für die Scanergebnisse sind keine einzelnen Stärken verfügbar.",
        "3. Belangrijkste verbeterpunten":"3. Wichtigste Verbesserungspunkte","Wat we zagen":"Was wir festgestellt haben","Waarom dit belangrijk is":"Warum das wichtig ist","Aanbeveling":"Empfehlung","Concreet voorstel":"Konkreter Vorschlag","Impact":"Auswirkung","Moeite":"Aufwand",
        "Er zijn geen AI-verbeterpunten beschikbaar voor deze scan.":"Für diesen Scan sind keine KI-Verbesserungspunkte verfügbar.","4. Actieplan":"4. Aktionsplan","Actieplan voor de komende 30 dagen":"Aktionsplan für die nächsten 30 Tage","ACTIE":"AKTION","MOEITE":"AUFWAND",
        "5. Wat we op je website hebben gemeten":"5. Was wir auf deiner Website gemessen haben","Er zijn geen afzonderlijke technische meetwaarden beschikbaar.":"Es sind keine einzelnen technischen Messwerte verfügbar.","6. Dit konden we niet betrouwbaar beoordelen":"6. Was wir nicht zuverlässig beurteilen konnten","Samengevat":"Zusammenfassung","Volledig website-rapport":"Vollständiger Websitebericht","Tekens":"Zeichen","Niet gevonden":"Nicht gefunden","tekens":"Zeichen",
        "Totaalscore":"Gesamtscore","Hoog":"Hoch","Gemiddeld":"Mittel","Laag":"Niedrig","Makkelijk":"Einfach","Gemiddeld moeilijk":"Mittlerer Aufwand","Moeilijk":"Schwierig",
        "Conversie":"Konversion","Vindbaarheid in Google":"Sichtbarkeit bei Google","Mobiel":"Mobil","Techniek & snelheid":"Technik & Geschwindigkeit","Content":"Inhalt","Vertrouwen":"Vertrauen","Lokale vindbaarheid":"Lokale Sichtbarkeit",
        "Sterke punten":"Stärken","Verbeterpunt":"Verbesserungspunkt","Niet beschikbaar":"Nicht verfügbar","Niet aangegeven":"Nicht angegeben","Niet vastgesteld":"Nicht festgestellt"
      },
      fr: {
        "Ja":"Oui","Nee":"Non","Niet gemeten":"Non mesuré","Uitstekend":"Excellent","Goed":"Bon","Redelijk":"Correct","Verbetering nodig":"Amélioration nécessaire","Veel verbetering nodig":"Amélioration importante nécessaire",
        "SiteCheck AI • Website analyse":"SiteCheck AI • Analyse de site web","Pagina":"Page","Website":"Site web","Gegenereerd op":"Généré le","TOTAALSCORE":"SCORE GLOBAL","Gemeten kwaliteit":"Qualité mesurée","Meetdekking":"Couverture des mesures","Totaalscore":"Score global","kwaliteit":"qualité","van de uitgevoerde controles":"des contrôles effectués",
        "Begrippen eenvoudig uitgelegd":"Les termes expliqués simplement","2. Wat gaat er al goed?":"2. Ce qui fonctionne déjà bien","Sterke punten die tijdens de scan zijn aangetroffen.":"Points forts constatés lors de l'analyse.","Er zijn geen afzonderlijke sterke punten beschikbaar in de scanresultaten.":"Aucun point fort individuel n'est disponible dans les résultats de l'analyse.",
        "3. Belangrijkste verbeterpunten":"3. Principaux points d'amélioration","Wat we zagen":"Ce que nous avons constaté","Waarom dit belangrijk is":"Pourquoi c'est important","Aanbeveling":"Recommandation","Concreet voorstel":"Proposition concrète","Impact":"Impact","Moeite":"Effort",
        "Er zijn geen AI-verbeterpunten beschikbaar voor deze scan.":"Aucun point d'amélioration généré par l'IA n'est disponible pour cette analyse.","4. Actieplan":"4. Plan d'action","Actieplan voor de komende 30 dagen":"Plan d'action pour les 30 prochains jours","ACTIE":"ACTION","MOEITE":"EFFORT",
        "5. Wat we op je website hebben gemeten":"5. Ce que nous avons mesuré sur votre site","Er zijn geen afzonderlijke technische meetwaarden beschikbaar.":"Aucune mesure technique individuelle n'est disponible.","6. Dit konden we niet betrouwbaar beoordelen":"6. Ce que nous n'avons pas pu évaluer de manière fiable","Samengevat":"Résumé","Volledig website-rapport":"Rapport complet du site web","Tekens":"caractères","Niet gevonden":"Non trouvé","tekens":"caractères",
        "Hoog":"Élevé","Gemiddeld":"Moyen","Laag":"Faible","Makkelijk":"Facile","Gemiddeld moeilijk":"Moyen","Moeilijk":"Difficile",
        "Conversie":"Conversion","Vindbaarheid in Google":"Visibilité sur Google","Mobiel":"Mobile","Techniek & snelheid":"Technique et vitesse","Content":"Contenu","Vertrouwen":"Confiance","Lokale vindbaarheid":"Visibilité locale",
        "Sterke punten":"Points forts","Verbeterpunt":"Point d'amélioration","Niet beschikbaar":"Non disponible","Niet aangegeven":"Non précisé","Niet vastgesteld":"Non déterminé"
      },
      es: {
        "Ja":"Sí","Nee":"No","Niet gemeten":"No medido","Uitstekend":"Excelente","Goed":"Bueno","Redelijk":"Aceptable","Verbetering nodig":"Necesita mejoras","Veel verbetering nodig":"Necesita muchas mejoras",
        "SiteCheck AI • Website analyse":"SiteCheck AI • Análisis del sitio web","Pagina":"Página","Website":"Sitio web","Gegenereerd op":"Generado el","TOTAALSCORE":"PUNTUACIÓN GLOBAL","Gemeten kwaliteit":"Calidad medida","Meetdekking":"Cobertura de medición","Totaalscore":"Puntuación global","kwaliteit":"calidad","van de uitgevoerde controles":"de las comprobaciones realizadas",
        "Begrippen eenvoudig uitgelegd":"Términos explicados de forma sencilla","2. Wat gaat er al goed?":"2. Lo que ya funciona bien","Sterke punten die tijdens de scan zijn aangetroffen.":"Puntos fuertes encontrados durante el análisis.","Er zijn geen afzonderlijke sterke punten beschikbaar in de scanresultaten.":"No hay puntos fuertes individuales disponibles en los resultados del análisis.",
        "3. Belangrijkste verbeterpunten":"3. Principales puntos de mejora","Wat we zagen":"Lo que hemos detectado","Waarom dit belangrijk is":"Por qué es importante","Aanbeveling":"Recomendación","Concreet voorstel":"Propuesta concreta","Impact":"Impacto","Moeite":"Esfuerzo",
        "Er zijn geen AI-verbeterpunten beschikbaar voor deze scan.":"No hay puntos de mejora de IA disponibles para este análisis.","4. Actieplan":"4. Plan de acción","Actieplan voor de komende 30 dagen":"Plan de acción para los próximos 30 días","ACTIE":"ACCIÓN","MOEITE":"ESFUERZO",
        "5. Wat we op je website hebben gemeten":"5. Lo que hemos medido en tu sitio web","Er zijn geen afzonderlijke technische meetwaarden beschikbaar.":"No hay mediciones técnicas individuales disponibles.","6. Dit konden we niet betrouwbaar beoordelen":"6. Lo que no pudimos evaluar de forma fiable","Samengevat":"Resumen","Volledig website-rapport":"Informe completo del sitio web","Tekens":"caracteres","Niet gevonden":"No encontrado","tekens":"caracteres",
        "Hoog":"Alto","Gemiddeld":"Medio","Laag":"Bajo","Makkelijk":"Fácil","Gemiddeld moeilijk":"Dificultad media","Moeilijk":"Difícil",
        "Conversie":"Conversión","Vindbaarheid in Google":"Visibilidad en Google","Mobiel":"Móvil","Techniek & snelheid":"Técnica y velocidad","Content":"Contenido","Vertrouwen":"Confianza","Lokale vindbaarheid":"Visibilidad local",
        "Sterke punten":"Puntos fuertes","Verbeterpunt":"Punto de mejora","Niet beschikbaar":"No disponible","Niet aangegeven":"No especificado","Niet vastgesteld":"No determinado"
      },
    };

    const t = (value: string): string => {
      if (locale === "nl") return value;
      if (locale === "en") return pdfTranslations[value] ?? value;
      return pdfInternationalTranslations[locale][value] ?? pdfTranslations[value] ?? value;
    };

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

    const translateDynamicTexts = async (payload: {
      strengths: Array<{ label: string; evidence: string }>;
      recommendations: Array<{
        title: string;
        whatFound: string;
        whyImportant: string;
        whatToImprove: string;
        proposal: string;
      }>;
      notChecked: string[];
    }) => {
      if (locale === "nl") return payload;

      const apiKey =
        process.env.AI_INTEGRATIONS_OPENAI_API_KEY ??
        process.env.OPENAI_API_KEY;
      if (!apiKey) return payload;

      try {
        const client = new OpenAI({
          apiKey,
          ...(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
            ? { baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL }
            : {}),
          timeout: 15_000,
          maxRetries: 1,
        });

        const response = await client.chat.completions.create({
          model: "gpt-5.4-mini",
          max_completion_tokens: 6000,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "sitecheck_pdf_translation",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["strengths", "recommendations", "notChecked"],
                properties: {
                  strengths: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["label", "evidence"],
                      properties: {
                        label: { type: "string" },
                        evidence: { type: "string" },
                      },
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["title", "whatFound", "whyImportant", "whatToImprove", "proposal"],
                      properties: {
                        title: { type: "string" },
                        whatFound: { type: "string" },
                        whyImportant: { type: "string" },
                        whatToImprove: { type: "string" },
                        proposal: { type: "string" },
                      },
                    },
                  },
                  notChecked: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
          messages: [
            {
              role: "system",
              content:
                "Translate the supplied SiteCheck AI report text into natural, professional ${locale === "en" ? "English" : locale === "de" ? "German" : locale === "fr" ? "French" : "Spanish"}. Preserve URLs, numbers, names, quoted website text and factual meaning exactly. Do not add or remove facts. Return exactly the same array lengths and order.",
            },
            { role: "user", content: JSON.stringify(payload) },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (!content) return payload;

        const parsed = JSON.parse(content);
        if (
          !parsed ||
          !Array.isArray(parsed.strengths) ||
          !Array.isArray(parsed.recommendations) ||
          !Array.isArray(parsed.notChecked) ||
          parsed.strengths.length !== payload.strengths.length ||
          parsed.recommendations.length !== payload.recommendations.length ||
          parsed.notChecked.length !== payload.notChecked.length
        ) {
          return payload;
        }

        return parsed;
      } catch (error) {
        console.warn(
          "PDF dynamic translation unavailable; using source text:",
          error instanceof Error ? error.message : "Unknown error",
        );
        return payload;
      }
    };

    const localizedDynamic = await translateDynamicTexts({
      strengths: strengths.map((item: any) => ({
        label: safe(item?.label ?? item?.key, "Sterk punt"),
        evidence: safe(
          item?.evidence ?? item?.description ?? item?.explanation ?? item?.message,
          "Dit onderdeel scoorde positief tijdens de scan.",
        ),
      })),
      recommendations: recommendations.map((item: any) => ({
        title: safe(item?.title ?? item?.issue ?? item?.name, "Verbeterpunt"),
        whatFound: safe(item?.whatFound ?? item?.fact ?? item?.finding ?? item?.what, ""),
        whyImportant: safe(item?.whyImportant ?? item?.why ?? item?.importance ?? item?.reason, ""),
        whatToImprove: safe(item?.whatToImprove ?? item?.recommendation ?? item?.advice ?? item?.solution, ""),
        proposal: safe(item?.proposal ?? item?.concreteProposal ?? item?.action, ""),
      })),
      notChecked: notChecked.map((item: any) =>
        typeof item === "string"
          ? item
          : safe(item?.message ?? item?.reason ?? item?.title ?? item),
      ),
    });

    const localizedStrengths = strengths.map((item: any, index: number) => ({
      ...item,
      label: localizedDynamic.strengths[index]?.label ?? item.label,
      evidence: localizedDynamic.strengths[index]?.evidence ?? item.evidence,
    }));

    const localizedRecommendations = recommendations.map((item: any, index: number) => ({
      ...item,
      title: localizedDynamic.recommendations[index]?.title ?? item.title,
      whatFound: localizedDynamic.recommendations[index]?.whatFound ?? item.whatFound ?? item.fact ?? item.finding ?? item.what,
      whyImportant: localizedDynamic.recommendations[index]?.whyImportant ?? item.whyImportant ?? item.why ?? item.importance ?? item.reason,
      whatToImprove: localizedDynamic.recommendations[index]?.whatToImprove ?? item.whatToImprove ?? item.recommendation ?? item.advice ?? item.solution,
      proposal: localizedDynamic.recommendations[index]?.proposal ?? item.proposal ?? item.concreteProposal ?? item.action,
    }));

    const localizedNotChecked = localizedDynamic.notChecked;

    const plainLanguage = (value: string): string => {
      const translated = t(value);

      if (locale === "en") {
        return translated
          .replace(/\bCTA('s|’s|s)?\b/gi, "call-to-action button")
          .replace(/\bH1-koppen?\b/gi, "main headings")
          .replace(/\bH1-kop\b/gi, "main heading")
          .replace(/\bH1\b/gi, "main heading")
          .replace(/\bSEO\b/gi, "search visibility")
          .replace(/meta description/gi, "page description for Google")
          .replace(/Open Graph/gi, "social sharing preview")
          .replace(/LocalBusiness structured data/gi, "structured business information for search engines")
          .replace(/structured data/gi, "structured information for search engines")
          .replace(/Core Web Vitals/gi, "key speed and usability measurements")
          .replace(/PageSpeed Insights/gi, "Google speed and performance measurement")
          .replace(/robots\.txt/gi, "search engine instructions (robots.txt)")
          .replace(/sitemap\.xml/gi, "search engine page overview (sitemap)")
          .replace(/\bCanonical-link\b/gi, "preferred page address")
          .replace(/\bCanonical URL\b/gi, "preferred page address")
          .replace(/\bCanonical\b/gi, "preferred page address")
          .replace(/\bHTTP-status\b/gi, "server response")
          .replace(/\bViewport-instelling\b/gi, "mobile display setting")
          .replace(/\bcontent encoding\b/gi, "compression method")
          .replace(/\bRobots-directives\b/gi, "search engine instructions");
      }

      return translated
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
      h1Count: "Hoofdtitel op de pagina",
      ctaCount: "Knoppen en acties",
      mapsLink: "Kaart of route",
      canonical: "Hoofdadres voor Google",
      linkCount: "Links op de pagina",
      pageTitle: "Paginatitel",
      compressed: "Website gecomprimeerd",
      hasSitemap: "Pagina-overzicht voor Google",
      httpStatus: "Website bereikbaar",
      imageCount: "Afbeeldingen",
      pageSizeKb: "Hoeveel data moet laden?",
      primaryCta: "Belangrijkste actie",
      sitemapUrl: "Pagina-overzicht gevonden",
      hasLanguage: "Taal van de pagina",
      hasViewport: "Mobiele weergave ingesteld",
      placeSignal: "Bedrijfsadres of locatie",
      hasRobotsTxt: "Instructies voor Google",
      headingCount: "Aantal koppen",
      regionSignal: "Plaats of regio duidelijk",
      imagesWithAlt: "Afbeeldingen met beschrijving",
      responseTimeMs: "Reactietijd van de website",
      contentEncoding: "Website-compressie",
      metaDescription: "Omschrijving voor Google",
      pageTitleLength: "Lengte van de titel",
      externalLinkCount: "Links naar andere websites",
      internalLinkCount: "Links naar eigen pagina’s",
      visibleTextLength: "Hoeveel tekst staat erop?",
      duplicateTextDetected: "Veel dubbele tekst",
      metaDescriptionLength: "Lengte van de omschrijving",
      primaryCtaClearlyMarked: "Belangrijkste actie duidelijk gemarkeerd",
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
        return value ? t("Ja") : t("Nee");
      }

      if (value === null || value === undefined || value === "") {
        return t("Niet gevonden");
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
        return `${value} ${t("tekens")}`;
      }

      if (key === "metaDescriptionLength") {
        return `${value} ${t("tekens")}`;
      }

      if (key === "visibleTextLength") {
        return `${value} ${t("tekens")}`;
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
      .text(t("Volledig website-rapport"), PAGE.left, 115, {
        width: contentWidth,
      });

    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#CBD5E1")
      .text(
        t("Een overzicht van wat goed gaat, wat beter kan en welke acties het meeste verschil kunnen maken."),
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
      .text(t("Website"), PAGE.left, 232);

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
        `${t("Gegenereerd op")} ${new Date().toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL")}`,
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
      .text(t("TOTAALSCORE"), PAGE.left + 28, coverCardY + 28);

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
        t("De totaalscore is een samengestelde score op basis van de gemeten kwaliteit en de beschikbare meetdekking."),
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
        t("Gemeten kwaliteit"),
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
        t("Hoe goed de onderdelen die daadwerkelijk konden worden gemeten scoorden."),
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
        t("Meetdekking"),
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
        t("Hoeveel van de beschikbare controles tijdens deze scan konden worden uitgevoerd."),
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
        t("Dit rapport bevat zowel meetresultaten als verbeteradviezen. Niet alle website-eigenschappen zijn automatisch te controleren."),
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
      t("1. Executive summary"),
      t("De belangrijkste uitkomsten van de website-analyse in één overzicht."),
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
        t("Totaalscore"),
        PAGE.left + 125,
        summaryY + 24,
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.gray600)
      .text(
        t("De totaalscore combineert de uitkomsten van de verschillende onderdelen van de website."),
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
        `${Math.round(Number(analysis.overallQualityScore ?? 0))}% ${t("kwaliteit")}`,
        PAGE.left + 125,
        summaryY + 78,
      );

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.gray600)
      .text(
        t("van de uitgevoerde controles"),
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
      t("Begrippen eenvoudig uitgelegd"),
      t("Geen technische voorkennis nodig. Hieronder staan de belangrijkste termen uit dit rapport in gewone taal."),
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
        .text(t(term), PAGE.left, glossaryY, {
          width: 175,
          lineBreak: false,
        });

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.gray600)
        .text(t(explanation), PAGE.left + 185, glossaryY, {
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
      t("2. Wat gaat er al goed?"),
      t("Sterke punten die tijdens de scan zijn aangetroffen."),
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
        t("Er zijn geen afzonderlijke sterke punten beschikbaar in de scanresultaten."),
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

      localizedStrengths.forEach((issue: any, index: number) => {
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
      t("3. Belangrijkste verbeterpunten"),
      `${t("De")} ${localizedRecommendations.length} ${t("belangrijkste verbeterpunten uit het betaalde rapport.")}`,
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

      const impact = t(safe(
        recommendation?.impact,
        "Niet aangegeven",
      ));

      const difficulty = t(safe(
        recommendation?.difficulty,
        "Niet aangegeven",
      ));

      const fact = plainLanguage(safe(
        recommendation?.whatFound ??
          recommendation?.fact ??
          recommendation?.finding ??
          recommendation?.what,
        "",
      ));

      const why = plainLanguage(safe(
        recommendation?.whyImportant ??
          recommendation?.why ??
          recommendation?.importance ??
          recommendation?.reason,
        "",
      ));

      const recommendationText = plainLanguage(safe(
        recommendation?.whatToImprove ??
          recommendation?.recommendation ??
          recommendation?.advice ??
          recommendation?.solution,
        "",
      ));

      const proposal = plainLanguage(safe(
        recommendation?.proposal ??
          recommendation?.concreteProposal ??
          recommendation?.action,
        "",
      ));

      const blocks = [
        [t("Wat we zagen"), fact],
        [t("Waarom dit belangrijk is"), why],
        [t("Aanbeveling"), recommendationText],
        [t("Concreet voorstel"), proposal],
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
        `${t("Impact")}: ${impact}`,
        PAGE.left + cardWidth - 132,
        y + 12,
        76,
        COLORS.orangeLight,
        COLORS.orange,
      );

      drawPill(
        `${t("Moeite")}: ${difficulty}`,
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

    if (localizedRecommendations.length === 0) {
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
        t("Er zijn geen AI-verbeterpunten beschikbaar voor deze scan."),
          PAGE.left + 16,
          doc.y + 25,
          {
            width: contentWidth - 32,
          },
        );

      doc.y += 86;
    } else {
      localizedRecommendations.forEach(
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
      t("4. Actieplan"),
      t("Actieplan voor de komende 30 dagen"),
    );
    
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.gray600)
      .text(
        t("Pak eerst de punten met hoge impact en weinig moeite aan. Werk daarna de overige verbeterpunten stap voor stap af."),
        PAGE.left,
        doc.y,
        { width: contentWidth, lineGap: 2 },
      );

    doc.y += 14;

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
      .text(t("ACTIE"), PAGE.left + 14, actionHeaderY + 10);

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLORS.white)
      .text(
        t("Impact"),
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
        t("MOEITE"),
        PAGE.left + contentWidth - 82,
        actionHeaderY + 10,
        {
          width: 65,
        },
      );

    doc.y = actionHeaderY + 40;

    localizedRecommendations.forEach(
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
      t("5. Wat we op je website hebben gemeten"),
      t("De belangrijkste metingen uit de scan. Hiermee zien we waar op je website verbeteringen mogelijk zijn."),
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
        t("Er zijn geen afzonderlijke technische meetwaarden beschikbaar."),
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
        t("6. Dit konden we niet betrouwbaar beoordelen"),
        t("Sommige dingen kun je niet betrouwbaar beoordelen zonder alle pagina’s te bekijken of de website in een echte browser te testen."),
      );

      notChecked.forEach(
        (item: any, index: number) => {
          const text = localizedNotChecked[index] ?? (
            typeof item === "string"
              ? item
              : safe(
                  item?.message ??
                    item?.reason ??
                    item?.title ??
                    item,
                )
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
        t("Samengevat"),
        PAGE.left + 20,
        doc.y + 18,
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#CBD5E1")
      .text(
        t("Gebruik de verbeterpunten in dit rapport als praktische checklist. Begin met de punten met de grootste impact en werk daarna de technische en inhoudelijke verbeteringen verder uit."),
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