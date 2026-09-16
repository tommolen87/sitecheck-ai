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

const router: IRouter = Router();
const TOTAL_CATEGORY_COUNT = 7;

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
            if (status === "passed") totals.passed += weight;
            return totals;
          },
          { passed: 0, total: 0 },
        );
        const score =
          !checked
            ? null
            : typeof categoryRecord.score === "number"
              ? categoryRecord.score
              : knownWeights.total > 0
                ? Math.round((knownWeights.passed / knownWeights.total) * 100)
                : null;
        return {
          ...categoryRecord,
          score,
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
  const overallCoveragePercent =
    typeof analysisRecord.overallCoveragePercent === "number"
      ? analysisRecord.overallCoveragePercent
      : Array.isArray(categoryScores) && categoryScores.length > 0
        ? Math.round(
            categoryScores.reduce(
              (total, category) =>
                total +
                (typeof category === "object" &&
                category !== null &&
                !Array.isArray(category) &&
                typeof category.coveragePercent === "number"
                  ? category.coveragePercent
                  : 0),
              0,
            ) / TOTAL_CATEGORY_COUNT,
          )
        : 0;
  const usesCurrentScoring = typeof analysisRecord.overallCoveragePercent === "number";
  const overallScore =
    usesCurrentScoring
      ? analysisRecord.overallScore
      : Array.isArray(categoryScores) && categoryScores.length > 0
        ? Math.round(
            categoryScores.reduce((total, category) => {
              if (typeof category !== "object" || category === null || Array.isArray(category)) return total;
              const categoryRecord = category as Record<string, unknown>;
              const score = typeof categoryRecord.score === "number" ? categoryRecord.score : 0;
              const coverage =
                typeof categoryRecord.coveragePercent === "number"
                  ? categoryRecord.coveragePercent
                  : 0;
              return total + score * (coverage / 100);
            }, 0) / TOTAL_CATEGORY_COUNT,
          )
        : 0;

  return {
    ...scan,
    analysis: {
      ...analysisRecord,
      aiRecommendations: Object.prototype.hasOwnProperty.call(analysisRecord, "aiRecommendations")
        ? analysisRecord.aiRecommendations
        : null,
      overallScore,
      overallCoveragePercent,
      categoryScores,
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

router.post("/scans", async (req, res): Promise<void> => {
  const parsed = CreateScanBody.safeParse(req.body);
  if (!parsed.success || !isWebsiteUrl(parsed.data?.url ?? "")) {
    res.status(400).json({ error: "Vul een geldige website-URL in." });
    return;
  }

  const [scan] = await db
    .insert(scansTable)
    .values({ url: parsed.data.url, status: "analyzing" })
    .returning();

  req.log.info({ scanId: scan.id }, "Website scan request accepted");

  try {
    const { analysis: measuredAnalysis, aiContext } = await analyzeWebsite(parsed.data.url);
    let aiRecommendations = null;
    try {
      aiRecommendations = await generateAiRecommendations(
        { ...measuredAnalysis, aiRecommendations: null },
        aiContext,
      );
    } catch (error) {
      req.log.warn(
        { scanId: scan.id, error: error instanceof Error ? error.message : "Unknown AI error" },
        "AI analysis unavailable; using measured recommendations",
      );
    }
    const analysis = { ...measuredAnalysis, aiRecommendations };
    const [completedScan] = await db
      .update(scansTable)
      .set({ status: "completed", analysis, error: null })
      .where(eq(scansTable.id, scan.id))
      .returning();

    res.status(201).json(CreateScanResponse.parse(normalizeScanAnalysis(completedScan)));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "De website kon niet worden geanalyseerd.";
    const [failedScan] = await db
      .update(scansTable)
      .set({ status: "failed", analysis: null, error: message })
      .where(eq(scansTable.id, scan.id))
      .returning();

    req.log.warn({ scanId: scan.id, error: message }, "Website scan failed");
    res.status(201).json(CreateScanResponse.parse(failedScan));
  }
});

router.get("/scans", async (_req, res): Promise<void> => {
  const scans = await db
    .select()
    .from(scansTable)
    .orderBy(desc(scansTable.createdAt))
    .limit(10);

  res.json(ListScansResponse.parse(scans.map(normalizeScanAnalysis)));
});

router.get("/scans/:scanId", async (req, res): Promise<void> => {
  const parsedParams = GetScanParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: "Ongeldig scan-ID." });
    return;
  }

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.id, parsedParams.data.scanId))
    .limit(1);

  if (!scan) {
    res.status(404).json({ error: "Scan niet gevonden." });
    return;
  }

  res.json(GetScanResponse.parse(normalizeScanAnalysis(scan)));
});

export default router;