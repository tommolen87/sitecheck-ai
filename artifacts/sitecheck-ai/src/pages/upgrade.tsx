import { ArrowLeft, Check } from 'lucide-react';
import { useLocation, useParams } from 'wouter';
import { LanguageSwitcher, Localized, translateText, useLanguage } from '@/lib/i18n';

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { locale } = useLanguage();
  const translate = (value: string) => translateText(value, locale);

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
              Je gratis scan laat zien waar de belangrijkste problemen en
              kansen op je website zitten. Met het volledige rapport krijg je
              per gevonden punt een concrete aanpak, zodat je weet wat je
              als eerste kunt verbeteren.
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
                  <span>Alle gevonden verbeterpunten</span>
                </div>

                <div>
                  <Check />
                  <span>Concrete AI-voorstellen per punt</span>
                </div>

                <div>
                  <Check />
                  <span>Impact en moeilijkheid per punt</span>
                </div>

                <div>
                  <Check />
                  <span>Een praktisch actieplan op volgorde</span>
                </div>
              </div>

              <button
                type="button"
                className="upgrade-main-button"
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `/api/scans/${params?.scanId}/checkout`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
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