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

const router: IRouter = Router();

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
    const analysis = await analyzeWebsite(parsed.data.url);
    const [completedScan] = await db
      .update(scansTable)
      .set({ status: "completed", analysis, error: null })
      .where(eq(scansTable.id, scan.id))
      .returning();

    res.status(201).json(CreateScanResponse.parse(completedScan));
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

  res.json(ListScansResponse.parse(scans));
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

  res.json(GetScanResponse.parse(scan));
});

export default router;