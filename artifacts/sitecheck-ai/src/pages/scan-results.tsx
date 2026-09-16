import { ArrowLeft, Check, CheckCircle2, CircleAlert, CircleHelp, Clock3, ExternalLink, FileWarning, Gauge, LockKeyhole, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { getGetScanQueryKey, useGetScan, type AiRecommendation, type ScanAnalysis, type ScanIssue } from '@workspace/api-client-react';

const categoryOrder = [
  { key: 'conversie', label: 'Conversie' },
  { key: 'seo', label: 'SEO' },
  { key: 'mobiel', label: 'Mobiel' },
  { key: 'techniek', label: 'Techniek & snelheid' },
  { key: 'content', label: 'Content' },
  { key: 'vertrouwen', label: 'Vertrouwen' },
  { key: 'lokaal', label: 'Lokale vindbaarheid' },
] as const;

const factLabels: Array<{ key: keyof ScanAnalysis['detectedFacts']; label: string; format?: (value: unknown) => string }> = [
  { key: 'pageTitle', label: 'Paginatitel', format: (value) => value ? String(value) : 'Niet aangetroffen' },
  { key: 'pageTitleLength', label: 'Lengte paginatitel', format: (value) => `${Number(value).toLocaleString('nl-NL')} tekens` },
  { key: 'metaDescription', label: 'Meta description', format: (value) => value ? String(value) : 'Niet aangetroffen' },
  { key: 'metaDescriptionLength', label: 'Lengte meta description', format: (value) => `${Number(value).toLocaleString('nl-NL')} tekens` },
  { key: 'h1Count', label: 'H1-koppen' },
  { key: 'headingCount', label: 'Alle koppen' },
  { key: 'visibleTextLength', label: 'Zichtbare tekens', format: (value) => `${Number(value).toLocaleString('nl-NL')}` },
  { key: 'internalLinkCount', label: 'Interne links' },
  { key: 'externalLinkCount', label: 'Externe links' },
  { key: 'imageCount', label: 'Afbeeldingen' },
  { key: 'imagesWithAlt', label: 'Afbeeldingen met alt-tekst' },
  { key: 'ctaCount', label: 'CTA’s' },
  { key: 'primaryCta', label: 'Eerste duidelijke CTA', format: (value) => value ? String(value) : 'Niet aangetroffen' },
  { key: 'canonical', label: 'Canonical', format: (value) => value ? 'Aangetroffen' : 'Niet aangetroffen' },
  { key: 'hasRobotsTxt', label: 'robots.txt', format: (value) => value ? 'Bereikbaar' : 'Niet gevonden' },
  { key: 'hasSitemap', label: 'Sitemap', format: (value) => value ? 'Bereikbaar' : 'Niet gevonden' },
  { key: 'openGraphSignals', label: 'Open Graph-signalen', format: (value) => `${Array.isArray(value) ? value.length : 0}` },
  { key: 'httpStatus', label: 'HTTP-status' },
  { key: 'responseTimeMs', label: 'Responstijd', format: (value) => `${Number(value).toLocaleString('nl-NL')} ms` },
  { key: 'pageSizeKb', label: 'Paginagrootte', format: (value) => `${Number(value).toLocaleString('nl-NL')} KB` },
  { key: 'https', label: 'HTTPS', format: (value) => value ? 'Ja' : 'Nee' },
  { key: 'compressed', label: 'Compressie', format: (value) => value === null ? 'Niet vastgesteld' : value ? 'Ja' : 'Nee' },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const value = (error as { error?: unknown }).error;
    if (typeof value === 'string') return value;
  }
  return 'De scan kon niet worden opgehaald. Probeer het opnieuw.';
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="score-ring" style={{ background: `conic-gradient(hsl(var(--primary)) ${score}%, hsl(var(--border)) 0)` }} data-testid="score-overall">
      <div className="score-ring-inner">
        <strong>{score}</strong>
        <span>van 100</span>
      </div>
    </div>
  );
}

function CategoryScores({ analysis }: { analysis: ScanAnalysis }) {
  const scoresByKey = new Map(analysis.categoryScores.map((category) => [category.key, category]));
  const importantConversionChecks = new Set(['primary-cta-clear', 'value-proposition', 'target-audience']);

  return (
    <section className="results-section" aria-labelledby="category-scores-title">
      <div className="results-section-heading">
        <div>
          <div className="section-kicker">De zeven invalshoeken</div>
          <h2 className="results-title" id="category-scores-title">Waar staat je website?</h2>
        </div>
        <p className="results-section-note">Alleen onderdelen die de scan daadwerkelijk heeft beoordeeld krijgen een score.</p>
      </div>
      <div className="category-score-list">
        {categoryOrder.map((category) => {
          const result = scoresByKey.get(category.key);
          const score = result?.score;
          const importantUnknownCount = result?.key === 'conversie'
            ? result.checks.filter((check) => check.status === 'unknown' && importantConversionChecks.has(check.key)).length
            : 0;
          return (
            <article className={`category-score-row ${result?.checked === false ? 'is-unchecked' : ''}`} key={category.key} data-testid={`score-category-${category.key}`}>
              <div className="category-score-name">
                <span className="category-score-index">{String(categoryOrder.indexOf(category) + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{result?.label || category.label}</h3>
                  <p>{result ? result.note : 'Niet beschikbaar in deze analyse.'}</p>
                  {result && (
                    <div className="category-coverage">
                      <span>Meetdekking: <strong>{result.coveragePercent}%</strong></span>
                      {result.checked && score === 100 && result.unknownCount > 0 && (
                        <span>Op de meetbare onderdelen sterk</span>
                      )}
                      {importantUnknownCount > 0 && (
                        <span>{importantUnknownCount} belangrijke {importantUnknownCount === 1 ? 'check kon' : 'checks konden'} we niet betrouwbaar beoordelen.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="category-score-value">
                {typeof score === 'number' && result?.checked !== false ? <strong>{score}</strong> : <span>—</span>}
                <small>{typeof score === 'number' && result?.checked !== false ? '/100' : 'niet gecheckt'}</small>
              </div>
              <div className="category-score-track" aria-hidden="true">
                <span style={{ width: `${typeof score === 'number' && result?.checked !== false ? score : 0}%` }} />
              </div>
              {result && (
                <details className="category-checks">
                  <summary>
                    <span>Bekijk score-opbouw</span>
                    <span>{result.passedCount} geslaagd · {result.failedCount} niet geslaagd · {result.unknownCount} onbekend</span>
                  </summary>
                  <div className="category-check-list">
                    {result.checks.map((check) => (
                      <div className={`category-check check-${check.status}`} key={check.key}>
                        <span className="check-status-icon" aria-hidden="true">
                          {check.status === 'passed' ? <CheckCircle2 /> : check.status === 'failed' ? <XCircle /> : <CircleHelp />}
                        </span>
                        <div>
                          <div className="check-title-row">
                            <strong>{check.label}</strong>
                            <span>Weging {check.weight === 3 ? 'hoog' : check.weight === 2 ? 'middel' : 'laag'}</span>
                          </div>
                          <p>{check.evidence}</p>
                        </div>
                        <span className="check-status-label">
                          {check.status === 'passed' ? 'Geslaagd' : check.status === 'failed' ? 'Niet geslaagd' : 'Onbekend'}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

type RecommendationDisplay = {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: 'high' | 'medium' | 'low' | null;
  fact: string;
  whyItMatters: string;
  recommendation: string;
  proposal: string | null;
  relatedChecks: string[];
};

function deterministicRecommendation(issue: ScanIssue): RecommendationDisplay {
  return {
    ...issue,
    confidence: null,
    proposal: null,
  };
}

function aiRecommendation(recommendation: AiRecommendation, index: number): RecommendationDisplay {
  return {
    id: `ai-${index}`,
    title: recommendation.title,
    severity: recommendation.impact,
    impact: recommendation.impact,
    difficulty: recommendation.difficulty,
    confidence: recommendation.confidence,
    fact: recommendation.whatFound,
    whyItMatters: recommendation.whyImportant,
    recommendation: recommendation.whatToImprove,
    proposal: recommendation.proposal,
    relatedChecks: recommendation.basedOnChecks,
  };
}

function IssueCard({ issue, index }: { issue: RecommendationDisplay; index: number }) {
  const impactLabel = issue.impact === 'high' ? 'Hoog' : issue.impact === 'medium' ? 'Middel' : 'Laag';
  const difficultyLabel = issue.difficulty === 'easy' ? 'Makkelijk' : issue.difficulty === 'medium' ? 'Gemiddeld' : 'Moeilijk';
  const confidenceLabel = issue.confidence === 'high' ? 'Hoog' : issue.confidence === 'medium' ? 'Gemiddeld' : issue.confidence === 'low' ? 'Laag' : null;
  return (
    <article className={`issue-card issue-${issue.severity}`} data-testid={`issue-card-${issue.id}`}>
      <div className="issue-card-top">
        <span className="issue-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="severity-label">Impact: {impactLabel}</span>
      </div>
      <h3>{issue.title}</h3>
      <div className="issue-detail">
        <div className="issue-detail-label"><CircleAlert /> Waar we het vonden</div>
        <p>{issue.fact}</p>
      </div>
      <div className="issue-detail">
        <div className="issue-detail-label"><CircleHelp /> Waarom dit belangrijk is</div>
        <p>{issue.whyItMatters}</p>
      </div>
      <div className="issue-detail recommendation">
        <div className="issue-detail-label"><Check /> Wat je concreet kunt verbeteren</div>
        <p>{issue.recommendation}</p>
      </div>
      {issue.proposal && (
        <div className="issue-detail proposal">
          <div className="issue-detail-label"><FileWarning /> Voorstel</div>
          <p>{issue.proposal}</p>
        </div>
      )}
      <div className="issue-meta" aria-label={`Impact ${impactLabel}, moeilijkheid ${difficultyLabel}`}>
        <span>Impact <strong>{impactLabel}</strong></span>
        <span>Moeilijkheid <strong>{difficultyLabel}</strong></span>
        {confidenceLabel && <span>Vertrouwen <strong>{confidenceLabel}</strong></span>}
      </div>
      {issue.relatedChecks.length > 0 && (
        <p className="issue-related-checks">Gebaseerd op: {issue.relatedChecks.join(' · ')}</p>
      )}
    </article>
  );
}

function DetectedFacts({ analysis }: { analysis: ScanAnalysis }) {
  const { detectedFacts } = analysis;
  return (
    <section className="results-section facts-section" aria-labelledby="facts-title">
      <div className="results-section-heading">
        <div>
          <div className="section-kicker">De meting achter de score</div>
          <h2 className="results-title" id="facts-title">Wat de scan zag</h2>
        </div>
        <p className="results-section-note">Dit zijn meetbare signalen uit de opgehaalde pagina. Ze zijn geen interpretatie of belofte.</p>
      </div>
      <div className="facts-layout">
        <div className="facts-grid">
          {factLabels.map(({ key, label, format }) => (
            <div className="fact-item" key={key} data-testid={`fact-${String(key)}`}>
              <span>{label}</span>
              <strong>{format ? format(detectedFacts[key]) : Number(detectedFacts[key]).toLocaleString('nl-NL')}</strong>
            </div>
          ))}
        </div>
        <div className="signal-panel">
          <div className="signal-panel-heading"><ShieldCheck /> Contactsignalen</div>
          {detectedFacts.contactSignals.length > 0 ? (
            <ul>{detectedFacts.contactSignals.map((signal, index) => <li key={`${signal}-${index}`}>{signal}</li>)}</ul>
          ) : <p>Geen contactsignalen gerapporteerd.</p>}
          <div className="signal-panel-heading technical-heading"><Gauge /> Technische signalen</div>
          {detectedFacts.technicalSignals.length > 0 ? (
            <ul>{detectedFacts.technicalSignals.map((signal, index) => <li key={`${signal}-${index}`}>{signal}</li>)}</ul>
          ) : <p>Geen technische signalen gerapporteerd.</p>}
        </div>
      </div>
    </section>
  );
}

function ResultHeader({ scan, analysis }: { scan: { url: string; createdAt: string }; analysis: ScanAnalysis }) {
  const checkedCategoryCount = analysis.categoryScores.filter((category) => category.checked).length;
  const mobileWasMeasured = analysis.categoryScores.find((category) => category.key === 'mobiel')?.checked === true;
  return (
    <header className="results-hero">
      <div className="page-frame">
        <Link href="/" className="back-link" data-testid="link-back-home"><ArrowLeft /> Nieuwe scan</Link>
        <div className="results-hero-grid">
          <div className="reveal">
            <div className="eyebrow">Scan afgerond</div>
            <h1>Een helder beeld van <em>je website.</em></h1>
            <a className="scanned-url" href={scan.url} target="_blank" rel="noreferrer" data-testid="link-scanned-url">
              <span>{scan.url}</span><ExternalLink />
            </a>
            <p className="scan-date"><Clock3 /> Gescand op {formatDate(scan.createdAt)}</p>
          </div>
          <div className="overall-score-card reveal reveal-delay-1">
            <div className="score-card-caption"><span>Totale score</span><span>SiteCheck AI</span></div>
            <div className="score-card-main">
              <ScoreRing score={analysis.overallScore} />
              <div>
                <strong className="score-verdict">{analysis.overallScore >= 70 ? 'Een stevige basis' : analysis.overallScore >= 40 ? 'Ruimte om te groeien' : 'Tijd voor aandacht'}</strong>
                <p>De score laat zien hoe de website presteert op de onderdelen die we betrouwbaar konden controleren.</p>
                <div className="overall-coverage">
                  <strong>{checkedCategoryCount} van {analysis.categoryScores.length} categorieën gecontroleerd</strong>
                  {!mobileWasMeasured && <span>Mobiel is nog niet gemeten.</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ResultsContent({ analysis }: { analysis: ScanAnalysis }) {
  const aiRecommendations = analysis.aiRecommendations ?? null;
  const hasAiAnalysis = aiRecommendations !== null;
  const issues = aiRecommendations !== null
    ? aiRecommendations.slice(0, 5).map(aiRecommendation)
    : analysis.issues.slice(0, 5).map(deterministicRecommendation);
  return (
    <>
      <CategoryScores analysis={analysis} />
      <section className="results-section issues-section" aria-labelledby="issues-title">
        <div className="results-section-heading">
          <div>
            <div className="section-kicker">{hasAiAnalysis ? 'AI-analyse op basis van de gevonden websitegegevens' : 'Van inzicht naar actie'}</div>
            <h2 className="results-title" id="issues-title">De belangrijkste aandachtspunten.</h2>
          </div>
          <p className="results-section-note">
            {hasAiAnalysis
              ? 'De AI interpreteert uitsluitend gegevens die onze scanner heeft verzameld. AI-beoordelingen vervangen geen menselijke website-audit.'
              : 'De aanbevelingen hieronder volgen direct uit de bevindingen van deze scan.'}
          </p>
        </div>
        {issues.length > 0 ? (
          <div className="issues-grid">{issues.map((issue, index) => <IssueCard issue={issue} index={index} key={issue.id} />)}</div>
        ) : (
          <div className="results-empty" data-testid="empty-issues">Deze scan rapporteerde geen aandachtspunten.</div>
        )}
      </section>
      <DetectedFacts analysis={analysis} />
      <section className="results-section not-checked-section" aria-labelledby="not-checked-title">
        <div className="not-checked-icon"><FileWarning /></div>
        <div>
          <div className="section-kicker">Transparant over de grenzen</div>
          <h2 className="results-title" id="not-checked-title">Dit konden we niet controleren.</h2>
          {analysis.notChecked.length > 0 ? (
            <ul className="not-checked-list">{analysis.notChecked.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
          ) : (
            <p className="not-checked-none">Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.</p>
          )}
        </div>
      </section>
    </>
  );
}

function LoadingResults() {
  return (
    <main className="site-shell results-shell">
      <nav className="nav-wrap"><div className="page-frame"><Link href="/" className="brand-mark" data-testid="link-home-loading"><span className="brand-symbol" aria-hidden="true"><RefreshCw /></span><span className="brand-name">SiteCheck <span>AI</span></span></Link></div></nav>
      <div className="page-frame loading-results" role="status" data-testid="status-scan-loading">
        <div className="loading-orbit"><RefreshCw /></div>
        <div className="eyebrow">Even geduld</div>
        <h1>SiteCheck AI analyseert<br /><em>de website.</em></h1>
        <p>We halen de pagina op en kijken rustig naar wat er daadwerkelijk te controleren is. Deze pagina ververst automatisch.</p>
        <div className="loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </main>
  );
}

function ScanProblem({ title, message, url }: { title: string; message: string; url?: string }) {
  return (
    <main className="site-shell results-shell">
      <nav className="nav-wrap"><div className="page-frame"><Link href="/" className="brand-mark" data-testid="link-home-problem"><span className="brand-symbol" aria-hidden="true"><RadarIcon /></span><span className="brand-name">SiteCheck <span>AI</span></span></Link></div></nav>
      <div className="page-frame scan-problem" role="alert" data-testid="status-scan-problem">
        <div className="problem-icon"><CircleAlert /></div>
        <div className="eyebrow">Scan niet beschikbaar</div>
        <h1>{title}</h1>
        <p>{message}</p>
        {url && <span className="problem-url">{url}</span>}
        <Link href="/" className="scan-button problem-button" data-testid="link-start-new-scan"><ArrowLeft /> Terug naar een nieuwe scan</Link>
      </div>
    </main>
  );
}

function RadarIcon() {
  return <LockKeyhole />;
}

export default function ScanResults() {
  const params = useParams<{ scanId?: string }>();
  const scanId = Number(params.scanId);
  const validScanId = Number.isInteger(scanId) && scanId > 0;
  const scanQuery = useGetScan(validScanId ? scanId : 0, {
    query: {
      enabled: validScanId,
      queryKey: getGetScanQueryKey(validScanId ? scanId : 0),
      refetchInterval: (query) => query.state.data?.status === 'analyzing' ? 4_000 : false,
    },
  });

  if (!validScanId) return <ScanProblem title="Dit scanadres klopt niet." message="We kunnen zonder een geldig scan-ID geen resultaat ophalen." />;
  if (scanQuery.isLoading) return <LoadingResults />;
  if (scanQuery.isError) return <ScanProblem title="We konden deze scan niet ophalen." message={getErrorMessage(scanQuery.error)} />;
  if (!scanQuery.data) return <ScanProblem title="Geen resultaat gevonden." message="Voor dit scanadres is geen resultaat beschikbaar." />;

  const scan = scanQuery.data;
  if (scan.status === 'analyzing') return <LoadingResults />;
  if (scan.status === 'failed') return <ScanProblem title="Deze scan kon niet worden afgerond." message={scan.error || 'De scan heeft geen analyse kunnen opleveren.'} url={scan.url} />;
  if (!scan.analysis) return <ScanProblem title="Er is nog geen analyse beschikbaar." message="De scan is afgerond, maar de API heeft geen analyse meegestuurd. Probeer deze pagina later opnieuw." url={scan.url} />;

  return (
    <main className="site-shell results-shell">
      <nav className="nav-wrap results-nav"><div className="page-frame flex items-center justify-between"><Link href="/" className="brand-mark" data-testid="link-home-results"><span className="brand-symbol" aria-hidden="true"><LockKeyhole /></span><span className="brand-name">SiteCheck <span>AI</span></span></Link><span className="nav-note">Een rustige check voor ambitieuze ondernemers</span></div></nav>
      <ResultHeader scan={scan} analysis={scan.analysis} />
      <div className="page-frame results-body"><ResultsContent analysis={scan.analysis} /></div>
      <footer className="footer"><div className="page-frame footer-inner"><span>© {new Date().getFullYear()} SiteCheck AI</span><Link href="/" className="footer-link" data-testid="link-footer-new-scan">Nieuwe scan starten</Link></div></footer>
    </main>
  );
}