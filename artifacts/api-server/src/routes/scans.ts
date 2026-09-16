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
    .values({ url: parsed.data.url, status: "queued" })
    .returning();

  req.log.info({ scanId: scan.id }, "Website scan request accepted");
  res.status(202).json(CreateScanResponse.parse(scan));
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