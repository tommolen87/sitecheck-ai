import { ArrowLeft, Check } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { useState } from 'react';
import { LanguageSwitcher, Localized, translateText, useLanguage } from '@/lib/i18n';
import { getScanAccessToken } from '@/lib/scan-access';

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { locale } = useLanguage();
  const translate = (value: string) => translateText(value, locale);
  const [legalConsent, setLegalConsent] = useState(false);

  return (
    <Localized><main className="site-shell min-h-[100dvh]">
      <nav className="nav-wrap">
        <div className="page-frame flex items-center justify-between">
          <button
            type="button"
            className="brand-mark"
            onClick={() => setLocation(`/scans/${params?.scanId ?? ''}`)}
          >
            <span className="brand-symbol">←</span>
            <span className="brand-name">
              SiteCheck <span>AI</span>
            </span>
          </button>

          <div className="nav-actions"><span className="nav-note">Volledig verbeterplan</span><LanguageSwitcher /></div>
        </div>
      </nav>

      <section className="section">
        <div className="page-frame">
          <div className="upgrade-page">
            <div className="section-kicker">Volledig verbeterplan</div>

            <h1>
              Van inzicht naar
              <em> concrete actie.</em>
            </h1>

            <p className="upgrade-intro">
              Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan:
              concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen en een praktisch plan
              om je website stap voor stap te verbeteren.
            </p>

            <div className="upgrade-offer">
              <div>
                <div className="upgrade-price">€29</div>
                <div className="upgrade-price-note">
                  eenmalig · geen abonnement
                </div>
              </div>

              <div className="upgrade-benefits">
                <div>
                  <Check />
                  <span>10 belangrijkste verbeterpunten</span>
                </div>

                <div>
                  <Check />
                  <span>Concrete AI-voorstellen per punt</span>
                </div>

                <div>
                  <Check />
                  <span>Prioriteit, impact en moeilijkheid per punt</span>
                </div>

                <div>
                  <Check />
                  <span>Een duidelijk actieplan voor de komende 30 dagen</span>
                </div>
              </div>

              <div className="upgrade-benefit-extra">
                <Check />
                <span>Volledig rapport als PDF</span>
              </div>

              <label className="legal-consent">
                <input
                  type="checkbox"
                  checked={legalConsent}
                  onChange={(event) => setLegalConsent(event.target.checked)}
                />
                <span>
                  {locale === 'nl'
                    ? <>Ik ga akkoord met de <a href="/nl/voorwaarden" target="_blank" rel="noreferrer">algemene voorwaarden</a> en vraag om de betaalde dienst direct te starten. Ik begrijp dat dit gevolgen kan hebben voor mijn wettelijke bedenktijd.</>
                    : <>I agree to the <a href="/en/terms" target="_blank" rel="noreferrer">terms and conditions</a> and ask for the paid service to start immediately. I understand that this may affect my statutory withdrawal right.</>}
                </span>
              </label>

              <button
                type="button"
                className="upgrade-main-button"
                disabled={!legalConsent}
                onClick={async () => {
                  try {
                    const scanId = Number(params?.scanId);
                    const accessToken = Number.isInteger(scanId) ? getScanAccessToken(scanId) : null;
                    if (!accessToken) throw new Error(translate('Deze scan is niet beschikbaar in deze browser. Start een nieuwe scan.'));
                    const response = await fetch(
                      `/api/scans/${scanId}/checkout`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-scan-access-token': accessToken,
                          'x-sitecheck-language': locale,
                          'x-sitecheck-terms-accepted': 'true',
                        },
                      },
                    );

                    const data = await response.json();

                    if (!response.ok || !data.url) {
                      throw new Error(
                        translate(data.error || 'Betaling kon niet worden gestart.'),
                      );
                    }

                    window.location.href = data.url;
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? translate(error.message)
                        : translate('Betaling kon niet worden gestart.'),
                    );
                  }
                }}
              >
                Bekijk mijn verbeterplan — €29
              </button>

              <button
                type="button"
                className="upgrade-back"
                onClick={() =>
                  setLocation(`/scans/${params?.scanId ?? ''}`)
                }
              >
                <ArrowLeft />
                Terug naar mijn scan
              </button>
            </div>
          </div>
        </div>
      </section>
    </main></Localized>
  );
}