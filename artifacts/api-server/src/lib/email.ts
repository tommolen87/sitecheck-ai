const RESEND_API_URL = "https://api.resend.com/emails";

import type { Locale } from "./locale";

type PaymentEmailOptions = {
  to: string;
  scanId: number;
  accessToken: string;
  locale: Locale;
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

  const resultUrl = `${options.siteUrl.replace(/\/$/, "")}/scans/${options.scanId}?access=${encodeURIComponent(options.accessToken)}&lang=${options.locale}`;
  const messages = {
    nl: { subject: "Je SiteCheck AI-rapport staat klaar", title: "Je volledige rapport staat klaar", intro: "Bedankt voor je betaling. Je volledige SiteCheck AI-rapport is nu beschikbaar.", button: "Bekijk mijn volledige rapport", details: "Op de rapportpagina vind je alle gevonden verbeterpunten, concrete AI-voorstellen en het praktische actieplan. Daar kun je ook de PDF downloaden.", footer: "Deze link geeft je toegang tot jouw persoonlijke scanresultaat." },
    en: { subject: "Your SiteCheck AI report is ready", title: "Your full report is ready", intro: "Thank you for your payment. Your full SiteCheck AI report is now available.", button: "View my full report", details: "On the report page you'll find all detected improvement points, concrete AI suggestions and the practical action plan. You can also download the PDF there.", footer: "This link gives you access to your personal scan results." },
    de: { subject: "Dein SiteCheck AI-Bericht ist fertig", title: "Dein vollständiger Bericht ist fertig", intro: "Vielen Dank für deine Zahlung. Dein vollständiger SiteCheck AI-Bericht ist jetzt verfügbar.", button: "Meinen vollständigen Bericht ansehen", details: "Auf der Berichtsseite findest du alle gefundenen Verbesserungspunkte, konkrete KI-Vorschläge und den praktischen Aktionsplan. Dort kannst du auch das PDF herunterladen.", footer: "Über diesen Link erhältst du Zugriff auf dein persönliches Scanergebnis." },
    fr: { subject: "Votre rapport SiteCheck AI est prêt", title: "Votre rapport complet est prêt", intro: "Merci pour votre paiement. Votre rapport SiteCheck AI complet est maintenant disponible.", button: "Voir mon rapport complet", details: "Sur la page du rapport, vous trouverez tous les points d'amélioration détectés, des propositions concrètes générées par l'IA et le plan d'action. Vous pouvez également y télécharger le PDF.", footer: "Ce lien vous donne accès à votre résultat de scan personnel." },
    es: { subject: "Tu informe de SiteCheck AI está listo", title: "Tu informe completo está listo", intro: "Gracias por tu pago. Tu informe completo de SiteCheck AI ya está disponible.", button: "Ver mi informe completo", details: "En la página del informe encontrarás todos los puntos de mejora detectados, propuestas concretas de IA y el plan de acción. También podrás descargar allí el PDF.", footer: "Este enlace te da acceso a tu resultado de análisis personal." },
  }[options.locale];

  const htmlLanguage = options.locale;

  const html = `<!doctype html>
<html lang="${htmlLanguage}">
  <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="padding:32px 16px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
        <div style="font-size:22px;font-weight:700;margin-bottom:28px;">SiteCheck <span style="color:#2563eb;">AI</span></div>
        <h1 style="font-size:26px;line-height:1.25;margin:0 0 16px;">${messages.title}</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${messages.intro}</p>
        <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 28px;">${messages.details}</p>
        <a href="${escapeHtml(resultUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:10px;">${messages.button}</a>
        <p style="font-size:13px;line-height:1.5;color:#6b7280;margin:28px 0 0;">${messages.footer}</p>
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
      subject: messages.subject,
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
