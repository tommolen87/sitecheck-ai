import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import ScanResults from '@/pages/scan-results';
import Upgrade from '@/pages/upgrade';
import {
  getGetScanQueryKey,
  getListScansQueryKey,
  useCreateScan,
  useGetScan,
  useListScans,
} from '@workspace/api-client-react';
import {
  ArrowRight,
  ClipboardCheck,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import {
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [url, setUrl] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [activeScanId, setActiveScanId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [paidScanPending, setPaidScanPending] = useState(false);
  const createScan = useCreateScan();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const recentScans = useListScans({
    query: {
      queryKey: getListScansQueryKey(),
      staleTime: 15_000,
    },
  });
  const activeScan = useGetScan(activeScanId ?? 0, {
    query: {
      enabled: activeScanId !== null,
      queryKey: getGetScanQueryKey(activeScanId ?? 0),
      refetchInterval: activeScanId !== null ? 4_000 : false,
    },
  });

  const queueCount = useMemo(
    () => (Array.isArray(recentScans.data) ? recentScans.data.length : null),
    [recentScans.data],
  );
  const isQueued = activeScanId !== null && (activeScan.data?.status === 'analyzing' || activeScan.isLoading);

  useEffect(() => {
    if (activeScan.data && activeScan.data.status !== 'analyzing') {
      setActiveScanId(null);
    }
  }, [activeScan.data]);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const value = (error as { error?: unknown }).error;
      if (typeof value === 'string') return value;
    }
    return 'Er ging iets mis bij het aanmelden van je scan. Probeer het opnieuw.';
  };

  const validateUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  };

  const validateAndGetUrl = () => {
    const normalizedUrl = url.trim();
    setSubmitError('');
    if (!normalizedUrl) {
      setFieldError('Vul het adres van je website in.');
      return null;
    }
    if (!validateUrl(normalizedUrl)) {
      setFieldError('Gebruik een volledig webadres, bijvoorbeeld https://jouwbedrijf.nl');
      return null;
    }
    setFieldError('');
    return normalizedUrl;
  };

  const submitScan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUrl = validateAndGetUrl();
    if (!normalizedUrl) return;

    createScan.mutate(
      { data: { url: normalizedUrl } },
      {
        onSuccess: (scan) => {
          setActiveScanId(scan.id);
          void queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
          setLocation(`/scans/${scan.id}`);
        },
        onError: (error) => setSubmitError(getErrorMessage(error)),
      },
    );
  };

  const startPaidScan = () => {
    const normalizedUrl = validateAndGetUrl();
    if (!normalizedUrl) return;

    setPaidScanPending(true);
    createScan.mutate(
      { data: { url: normalizedUrl } },
      {
        onSuccess: async (scan) => {
          try {
            const response = await fetch(`/api/scans/${scan.id}/checkout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (!response.ok || !data.url) {
              throw new Error(data.error || 'Betaling kon niet worden gestart.');
            }

            window.location.href = data.url;
          } catch (error) {
            setPaidScanPending(false);
            setSubmitError(
              error instanceof Error
                ? error.message
                : 'Betaling kon niet worden gestart.',
            );
          }
        },
        onError: (error) => {
          setPaidScanPending(false);
          setSubmitError(getErrorMessage(error));
        },
      },
    );
  };

  const showQueued = createScan.isPending || isQueued || Boolean(activeScan.data?.status === 'analyzing');

  return (
    <main className="site-shell min-h-[100dvh]">
      <nav className="nav-wrap">
        <div className="page-frame flex items-center justify-between">
          <a className="brand-mark" href="/" data-testid="link-home">
            <span className="brand-symbol" aria-hidden="true"><Radar /></span>
            <span className="brand-name">SiteCheck <span>AI</span></span>
          </a>
          <span className="nav-note">Voor ondernemers met een helder verhaal</span>
        </div>
      </nav>

      <section className="hero">
        <div className="page-frame hero-grid">
          <div className="reveal">
            <div className="eyebrow">Een nuchtere blik op je website</div>
            <h1>Hoe goed presteert <em>jouw website?</em></h1>
            <p className="hero-lede">
              SiteCheck AI analyseert je website en geeft praktische verbeteradviezen.
              Geen technisch rapport waar je doorheen moet ploegen, maar duidelijke handvatten voor de volgende stap.
            </p>
            <div className="hero-meta">
              <span className="meta-item"><ShieldCheck /> Eerlijk over wat we weten</span>
              <span className="meta-item"><LockKeyhole /> Je gegevens blijven privé</span>
            </div>
          </div>

          <div className="scan-card reveal reveal-delay-2">
            <div className="scan-card-label">
              <strong>Start met je website</strong>
              <span className="free-pill">Gratis eerste scan</span>
            </div>
            <form onSubmit={submitScan} noValidate>
              <label className="form-label" htmlFor="website-url">Website-adres</label>
              <div className="url-field">
                <Globe2 aria-hidden="true" />
                <input
                  id="website-url"
                  className={`url-input ${fieldError ? 'input-error' : ''}`}
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://jouwbedrijf.nl"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? 'url-error' : undefined}
                  data-testid="input-website-url"
                />
              </div>
              {fieldError && <p className="field-error" id="url-error" data-testid="error-invalid-url">{fieldError}</p>}
              <div className="scan-actions">
                <button
                  className="scan-button"
                  type="submit"
                  disabled={createScan.isPending || paidScanPending}
                  data-testid="button-start-scan"
                >
                  {createScan.isPending && !paidScanPending ? (
                    <>SiteCheck AI analyseert... <Timer className="animate-pulse" /></>
                  ) : (
                    <>Start gratis scan <ArrowRight /></>
                  )}
                </button>
                <button
                  className="paid-scan-button"
                  type="button"
                  onClick={startPaidScan}
                  disabled={createScan.isPending || paidScanPending}
                  data-testid="button-start-paid-scan"
                >
                  {paidScanPending ? (
                    <>Volledig rapport voorbereiden... <Timer className="animate-pulse" /></>
                  ) : (
                    <>Volledig rapport — €29 <ArrowRight /></>
                  )}
                </button>
              </div>
              <p className="fine-print"><strong>Gratis scan:</strong> krijg inzicht in je website. <strong>Volledig rapport:</strong> krijg alle verbeterpunten en concrete AI-voorstellen voor €29, eenmalig.</p>
            </form>
            {submitError && (
              <div className="api-error" role="alert" data-testid="error-scan-request">
                {submitError}
              </div>
            )}
            {showQueued && (
              <div className="queued-panel" role="status" data-testid="status-scan-queued">
                <div className="queued-top">
                  <div className="queued-icon"><Timer /></div>
                  <div className="queued-copy">
                    <strong>{createScan.isPending ? 'SiteCheck AI analyseert je website' : 'Je scan staat klaar'}</strong>
                    <p>{createScan.isPending ? 'We halen de homepage op en controleren alleen wat we daadwerkelijk kunnen meten.' : 'We hebben je aanvraag ontvangen. De analyse wordt op de achtergrond voorbereid.'}</p>
                  </div>
                </div>
                {activeScan.data && <span className="queued-url">{activeScan.data.url}</span>}
                <div className="queue-track" aria-hidden="true"><span /></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="signal-strip">
        <div className="page-frame signal-inner">
          <p className="signal-copy"><strong>Geen vakjargon.</strong> Wel zicht op wat je website voor je bedrijf kan doen.</p>
          <div className="signal-stats">
            <span><span className="stat-dot" />{queueCount === null ? 'Aanvragen worden verwerkt' : `${queueCount} recente aanvraag${queueCount === 1 ? '' : 'en'}`}</span>
            <span>Alleen je URL is nodig</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="page-frame method-grid">
          <div>
            <div className="section-kicker">Zo werkt het</div>
            <h2 className="section-title">Van twijfel naar een volgende stap.</h2>
            <p className="section-intro">Een website hoeft niet perfect te zijn. Je wilt vooral weten waar een kleine verbetering het meeste oplevert.</p>
            <div className="method-list">
              <div className="method-step">
                <span className="step-number">01</span>
                <div><div className="step-title">Je deelt je URL</div><p className="step-copy">Geen account, vragenlijst of technische voorbereiding. Alleen het adres van je website.</p></div>
              </div>
              <div className="method-step">
                <span className="step-number">02</span>
                <div><div className="step-title">Wij nemen rustig de tijd</div><p className="step-copy">De scan wordt ingepland. We doen niet alsof een snelle blik hetzelfde is als goed kijken.</p></div>
              </div>
              <div className="method-step">
                <span className="step-number">03</span>
                <div><div className="step-title">Je krijgt richting</div><p className="step-copy">Praktische aanbevelingen waarmee je zelf, of samen met je webbouwer, verder kunt.</p></div>
              </div>
            </div>
          </div>
          <div className="audit-paper reveal reveal-delay-1" aria-label="Voorbeeld van de aanpak">
            <div className="paper-line" />
            <div className="paper-label">Waar we op letten</div>
            <div className="paper-big">Helder.</div>
            <p className="paper-note">De beste aanbeveling is er één die je morgen begrijpt én kunt uitvoeren.</p>
            <div className="paper-line" />
            <div className="paper-label">SiteCheck AI / 2024</div>
          </div>
        </div>
      </section>

      <section className="section checks-section">
        <div className="page-frame">
          <div className="checks-header">
            <div>
              <div className="section-kicker">Een brede blik</div>
              <h2 className="section-title">Niet alleen de buitenkant.</h2>
            </div>
            <p className="section-intro">Een goede website voelt vanzelfsprekend voor je bezoeker. Daarom kijken we naar de samenhang, niet naar één los vinkje.</p>
          </div>
          <div className="check-grid">
            <article className="check-card">
              <div className="check-icon"><LayoutDashboard /></div>
              <h3>De eerste indruk</h3>
              <p>Is in één oogopslag duidelijk wat je doet, voor wie en waarom iemand verder zou kijken?</p>
            </article>
            <article className="check-card">
              <div className="check-icon"><ClipboardCheck /></div>
              <h3>De route naar contact</h3>
              <p>Kan een geïnteresseerde zonder zoeken de juiste volgende stap zetten?</p>
            </article>
            <article className="check-card">
              <div className="check-icon"><Sparkles /></div>
              <h3>Vertrouwen in details</h3>
              <p>Klopt het verhaal ook in de kleine dingen die bepalen of een bezoeker blijft?</p>
            </article>
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="page-frame closing-box">
          <h2>Maak van je website een betere eerste kennismaking.</h2>
          <p>Begin met wat je al hebt. SiteCheck AI helpt je kiezen wat daarna de moeite waard is.</p>
        </div>
      </section>

      <footer className="footer">
        <div className="page-frame footer-inner">
          <span>© {new Date().getFullYear()} SiteCheck AI</span>
          <span>Een rustige check voor ambitieuze ondernemers</span>
        </div>
      </footer>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
         <Route path="/" component={Home} />
        <Route path="/scans/:scanId" component={ScanResults} />
        <Route path="/scans/:scanId/upgrade" component={Upgrade} />
        <Route component={NotFound} />  
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
