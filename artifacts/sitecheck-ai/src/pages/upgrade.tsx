import { ArrowLeft, Check } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { useState } from 'react';
import { LanguageSwitcher, useLanguage } from '@/lib/i18n';
import { getScanAccessToken } from '@/lib/scan-access';

const copy = {
  nl: {
    nav: 'Volledig verbeterplan',
    kicker: 'Volledig verbeterplan',
    title: 'Van inzicht naar',
    titleEm: ' concrete actie.',
    intro: 'Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen en een praktisch plan om je website stap voor stap te verbeteren.',
    oneTime: 'eenmalig · geen abonnement',
    benefits: ['10 belangrijkste verbeterpunten', 'Concrete AI-voorstellen per punt', 'Prioriteit, impact en moeilijkheid per punt', 'Een duidelijk actieplan voor de komende 30 dagen'],
    pdf: 'Volledig rapport als PDF',
    consent: <>Ik ga akkoord met de <a href="/nl/voorwaarden" target="_blank" rel="noreferrer">algemene voorwaarden</a> en vraag om de betaalde dienst direct te starten. Ik begrijp dat dit gevolgen kan hebben voor mijn wettelijke bedenktijd.</>,
    button: 'Bekijk mijn verbeterplan — €29',
    back: 'Terug naar mijn scan',
    unavailable: 'Deze scan is niet beschikbaar in deze browser. Start een nieuwe scan.',
    paymentError: 'Betaling kon niet worden gestart.',
  },
  en: {
    nav: 'Full improvement plan',
    kicker: 'Full improvement plan',
    title: 'From insight to',
    titleEm: ' concrete action.',
    intro: 'Your free scan shows where opportunities lie. For €29, you get the full improvement plan: concrete improvement points, clear priorities, AI suggestions and a practical plan to improve your website step by step.',
    oneTime: 'one-time payment · no subscription',
    benefits: ['10 most important improvement points', 'Concrete AI suggestions for each point', 'Priority, impact and difficulty for each point', 'A clear action plan for the next 30 days'],
    pdf: 'Full report as PDF',
    consent: <>I agree to the <a href="/en/terms" target="_blank" rel="noreferrer">terms and conditions</a> and ask for the paid service to start immediately. I understand that this may affect my statutory withdrawal right.</>,
    button: 'View my improvement plan — €29',
    back: 'Back to my scan',
    unavailable: 'This scan is not available in this browser. Start a new scan.',
    paymentError: 'Payment could not be started.',
  },
  de: {
    nav: 'Vollständiger Verbesserungsplan',
    kicker: 'Vollständiger Verbesserungsplan',
    title: 'Von Erkenntnis zu',
    titleEm: ' konkreter Aktion.',
    intro: 'Ihr kostenloser Scan zeigt, wo Potenzial liegt. Für 29 € erhalten Sie den vollständigen Verbesserungsplan: 10 konkrete Verbesserungspunkte, klare Prioritäten, KI-Vorschläge und einen praktischen Plan zur schrittweisen Verbesserung Ihrer Website.',
    oneTime: 'einmalige Zahlung · kein Abonnement',
    benefits: ['10 wichtigste Verbesserungspunkte', 'Konkrete KI-Vorschläge für jeden Punkt', 'Priorität, Auswirkung und Aufwand je Punkt', 'Ein klarer Aktionsplan für die nächsten 30 Tage'],
    pdf: 'Vollständiger Bericht als PDF',
    consent: <>Ich stimme den <a href="/de/terms" target="_blank" rel="noreferrer">Allgemeinen Geschäftsbedingungen</a> zu und bitte darum, die kostenpflichtige Leistung sofort zu starten. Ich verstehe, dass dies Auswirkungen auf mein gesetzliches Widerrufsrecht haben kann.</>,
    button: 'Meinen Verbesserungsplan ansehen — 29 €',
    back: 'Zurück zu meinem Scan',
    unavailable: 'Dieser Scan ist in diesem Browser nicht verfügbar. Starten Sie einen neuen Scan.',
    paymentError: 'Die Zahlung konnte nicht gestartet werden.',
  },
  fr: {
    nav: 'Plan d’amélioration complet',
    kicker: 'Plan d’amélioration complet',
    title: 'Des résultats à',
    titleEm: ' des actions concrètes.',
    intro: 'Votre analyse gratuite montre où se trouvent les opportunités. Pour 29 €, vous recevez le plan d’amélioration complet : 10 points d’amélioration concrets, des priorités claires, des propositions d’IA et un plan pratique pour améliorer votre site étape par étape.',
    oneTime: 'paiement unique · sans abonnement',
    benefits: ['10 principaux points d’amélioration', 'Des propositions d’IA concrètes pour chaque point', 'Priorité, impact et difficulté pour chaque point', 'Un plan d’action clair pour les 30 prochains jours'],
    pdf: 'Rapport complet en PDF',
    consent: <>J’accepte les <a href="/fr/conditions" target="_blank" rel="noreferrer">conditions générales</a> et demande que le service payant commence immédiatement. Je comprends que cela peut avoir une incidence sur mon droit légal de rétractation.</>,
    button: 'Voir mon plan d’amélioration — 29 €',
    back: 'Retour à mon analyse',
    unavailable: 'Cette analyse n’est pas disponible dans ce navigateur. Lancez une nouvelle analyse.',
    paymentError: 'Le paiement n’a pas pu être démarré.',
  },
  es: {
    nav: 'Plan de mejora completo',
    kicker: 'Plan de mejora completo',
    title: 'Del análisis a',
    titleEm: ' acciones concretas.',
    intro: 'Tu análisis gratuito muestra dónde hay oportunidades. Por 29 €, recibes el plan de mejora completo: 10 puntos de mejora concretos, prioridades claras, propuestas de IA y un plan práctico para mejorar tu sitio paso a paso.',
    oneTime: 'pago único · sin suscripción',
    benefits: ['10 puntos de mejora más importantes', 'Propuestas de IA concretas para cada punto', 'Prioridad, impacto y dificultad de cada punto', 'Un plan de acción claro para los próximos 30 días'],
    pdf: 'Informe completo en PDF',
    consent: <>Acepto los <a href="/es/terminos" target="_blank" rel="noreferrer">términos y condiciones</a> y solicito que el servicio de pago comience de inmediato. Entiendo que esto puede afectar a mi derecho legal de desistimiento.</>,
    button: 'Ver mi plan de mejora — 29 €',
    back: 'Volver a mi análisis',
    unavailable: 'Este análisis no está disponible en este navegador. Inicia un nuevo análisis.',
    paymentError: 'No se ha podido iniciar el pago.',
  },
} as const;

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { locale } = useLanguage();
  const t = copy[locale];
  const [legalConsent, setLegalConsent] = useState(false);

  return (
    <main className="site-shell min-h-[100dvh]">
      <nav className="nav-wrap">
        <div className="page-frame flex items-center justify-between">
          <button type="button" className="brand-mark" onClick={() => setLocation(`/scans/${params?.scanId ?? ''}`)}>
            <span className="brand-symbol">←</span>
            <span className="brand-name">SiteCheck <span>AI</span></span>
          </button>
          <div className="nav-actions"><span className="nav-note">{t.nav}</span><LanguageSwitcher /></div>
        </div>
      </nav>

      <section className="section">
        <div className="page-frame">
          <div className="upgrade-page">
            <div className="section-kicker">{t.kicker}</div>
            <h1>{t.title}<em>{t.titleEm}</em></h1>
            <p className="upgrade-intro">{t.intro}</p>

            <div className="upgrade-offer">
              <div>
                <div className="upgrade-price">€29</div>
                <div className="upgrade-price-note">{t.oneTime}</div>
              </div>

              <div className="upgrade-benefits">
                {t.benefits.map((benefit) => (
                  <div key={benefit}><Check /><span>{benefit}</span></div>
                ))}
              </div>

              <div className="upgrade-benefit-extra"><Check /><span>{t.pdf}</span></div>

              <label className="legal-consent">
                <input type="checkbox" checked={legalConsent} onChange={(event) => setLegalConsent(event.target.checked)} />
                <span>{t.consent}</span>
              </label>

              <button
                type="button"
                className="upgrade-main-button"
                disabled={!legalConsent}
                onClick={async () => {
                  try {
                    const scanId = Number(params?.scanId);
                    const accessToken = Number.isInteger(scanId) ? getScanAccessToken(scanId) : null;
                    if (!accessToken) throw new Error(t.unavailable);
                    const response = await fetch(`/api/scans/${scanId}/checkout`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-scan-access-token': accessToken,
                        'x-sitecheck-language': locale,
                        'x-sitecheck-terms-accepted': 'true',
                      },
                    });
                    const data = await response.json();
                    if (!response.ok || !data.url) throw new Error(data.error || t.paymentError);
                    window.location.href = data.url;
                  } catch (error) {
                    alert(error instanceof Error ? error.message : t.paymentError);
                  }
                }}
              >
                {t.button}
              </button>

              <button type="button" className="upgrade-back" onClick={() => setLocation(`/scans/${params?.scanId ?? ''}`)}>
                <ArrowLeft />{t.back}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
