const RESEND_API_URL = "https://api.resend.com/emails";

type PaymentEmailOptions = {
  to: string;
  scanId: number;
  accessToken: string;
  locale: "nl" | "en";
  siteUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendPaymentConfirmationEmail(
  options: PaymentEmailOptions,
): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn(
      "[Email] RESEND_API_KEY or RESEND_FROM_EMAIL is not configured; skipping payment email.",
    );
    return null;
  }

  const resultUrl = `${options.siteUrl.replace(/\/$/, "")}/scans/${options.scanId}?access=${encodeURIComponent(options.accessToken)}`;
  const locale = options.locale === "en";

  const subject = locale
    ? "Your SiteCheck AI report is ready"
    : "Je SiteCheck AI-rapport staat klaar";

  const title = locale
    ? "Your full report is ready"
    : "Je volledige rapport staat klaar";

  const intro = locale
    ? "Thank you for your payment. Your full SiteCheck AI report is now available."
    : "Bedankt voor je betaling. Je volledige SiteCheck AI-rapport is nu beschikbaar.";

  const button = locale
    ? "View my full report"
    : "Bekijk mijn volledige rapport";

  const details = locale
    ? "On the report page you'll find all detected improvement points, concrete AI suggestions and the practical action plan. You can also download the PDF there."
    : "Op de rapportpagina vind je alle gevonden verbeterpunten, concrete AI-voorstellen en het praktische actieplan. Daar kun je ook de PDF downloaden.";

  const footer = locale
    ? "This link gives you access to your personal scan results."
    : "Deze link geeft je toegang tot jouw persoonlijke scanresultaat.";

  const html = `<!doctype html>
<html lang="${locale ? "en" : "nl"}">
  <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="padding:32px 16px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <div style="font-size:22px;font-weight:700;margin-bottom:28px;">SiteCheck <span style="color:#2563eb;">AI</span></div>
        <h1 style="font-size:26px;line-height:1.25;margin:0 0 16px;">${title}</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${intro}</p>
        <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 28px;">${details}</p>
        <a href="${escapeHtml(resultUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;">${button}</a>
        <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:28px 0 0;">${footer}</p>
      </div>
    </div>
  </body>
</html>`;

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `sitecheck-report-${options.scanId}`,
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject,
      html,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `Resend email failed with HTTP ${response.status}: ${body || "Unknown error"}`,
    );
  }

  try {
    const parsed = JSON.parse(body) as { id?: string };
    return parsed.id ?? null;
  } catch {
    return null;
  }
}
