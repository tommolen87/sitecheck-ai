import { createHash } from "node:crypto";
import { Router, type IRouter } from "express";
import { visitorAlertRateLimit } from "../lib/rate-limit";

const router: IRouter = Router();

const recentVisitorKeys = new Map<string, number>();
const SESSION_TTL_MS = 30 * 60 * 1000;

function cleanRecentVisitors(now: number) {
  for (const [key, timestamp] of recentVisitorKeys) {
    if (now - timestamp > SESSION_TTL_MS) recentVisitorKeys.delete(key);
  }
}

function clientKey(req: { ip?: string; headers: Record<string, unknown> }) {
  const value = `${req.ip ?? "unknown"}|${String(req.headers["user-agent"] ?? "unknown")}`;
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendVisitorAlert(data: {
  path: string;
  referrer: string;
  language: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.VISITOR_ALERT_EMAIL ?? "info@sjoomai.nl";
  const from = process.env.RESEND_FROM ?? "SiteCheck AI <info@sjoomai.nl>";

  if (!apiKey) {
    console.warn("[visitor-alert] RESEND_API_KEY is not configured; alert skipped");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "👀 Nieuwe bezoeker op SiteCheck AI",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>👀 Nieuwe bezoeker op SiteCheck AI</h2>
          <p><strong>Pagina:</strong> ${escapeHtml(data.path)}</p>
          <p><strong>Taal:</strong> ${escapeHtml(data.language)}</p>
          <p><strong>Herkomst:</strong> ${escapeHtml(data.referrer || "Direct / onbekend")}</p>
          <p><strong>Tijd:</strong> ${escapeHtml(new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" }))}</p>
          <p style="color:#667085;font-size:13px">SiteCheck AI stuurt maximaal één melding per bezoeker/sessie binnen 30 minuten.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend returned ${response.status}: ${body.slice(0, 300)}`);
  }
}

router.post("/visitor", visitorAlertRateLimit, async (req, res): Promise<void> => {
  const now = Date.now();
  cleanRecentVisitors(now);

  const path = typeof req.body?.path === "string" ? req.body.path.slice(0, 300) : "/";
  const referrer = typeof req.body?.referrer === "string" ? req.body.referrer.slice(0, 500) : "";
  const language = typeof req.body?.language === "string" ? req.body.language.slice(0, 20) : "unknown";
  const key = clientKey(req);

  if (recentVisitorKeys.has(key)) {
    res.status(204).end();
    return;
  }

  recentVisitorKeys.set(key, now);

  try {
    await sendVisitorAlert({ path, referrer, language });
  } catch (error) {
    console.error("[visitor-alert] Failed to send alert", error);
  }

  res.status(204).end();
});

export default router;
