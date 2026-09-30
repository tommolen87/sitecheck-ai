import { ArrowLeft, Check, CheckCircle2, CircleAlert, CircleHelp, Clock3, ExternalLink, FileWarning, Gauge, LockKeyhole, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { getGetScanQueryKey, useGetScan, type AiRecommendation, type ScanAnalysis, type ScanIssue } from '@workspace/api-client-react';
import { LanguageSwitcher, Localized, useLanguage } from '@/lib/i18n';
import { getScanAccessToken } from '@/lib/scan-access';

const categoryOrder = [
  { key: 'conversie', label: 'Conversie' },
  { key: 'seo', label: 'Vindbaarheid in Google' },
  { key: 'mobiel', label: 'Mobiel' },
  { key: 'techniek', label: 'Techniek & snelheid' },
  { key: 'content', label: 'Content' },
  { key: 'vertrouwen', label: 'Vertrouwen' },
  { key: 'lokaal', label: 'Lokale vindbaarheid' },
] as const;

const factLabels: Array<{ key: keyof ScanAnalysis['detectedFacts']; label: string; format?: (value: unknown) => string }> = [
  { key: 'pageTitle', label: 'Paginatitel', format: (value) => value ? String(value) : 'Niet aangetroffen' },
  { key: 'pageTitleLength', label: 'Lengte paginatitel', format: (value) => `${Number(value).toLocaleString('nl-NL')} tekens` },
  { key: 'metaDescription', label: 'Korte omschrijving voor Google', format: (value) => value ? String(value) : 'Niet aangetroffen' },
  { key: 'metaDescriptionLength', label: 'Lengte omschrijving voor Google', format: (value) => `${Number(value).toLocaleString('nl-NL')} tekens` },
  { key: 'h1Count', label: 'Hoofdtitels van de pagina' },
  { key: 'headingCount', label: 'Alle koppen' },
  { key: 'visibleTextLength', label: 'Zichtbare tekens', format: (value) => `${Number(value).toLocaleString('nl-NL')}` },
  { key: 'internalLinkCount', label: 'Interne links' },
  { key: 'externalLinkCount', label: 'Externe links' },
  { key: 'imageCount', label: 'Afbeeldingen' },
  { key: 'imagesWithAlt', label: 'Afbeeldingen met alt-tekst' },
  { key: 'ctaCount', label: 'Actieknoppen' },
  { key: 'primaryCta', label: 'Belangrijkste actieknop', format: (value) => value ? String(value) : 'Niet aangetroffen' },
  { key: 'canonical', label: 'Voorkeursadres van de pagina', format: (value) => value ? 'Aangetroffen' : 'Niet aangetroffen' },
  { key: 'hasRobotsTxt', label: 'Instructies voor zoekmachines', format: (value) => value ? 'Bereikbaar' : 'Niet gevonden' },
  { key: 'hasSitemap', label: 'Pagina-overzicht voor zoekmachines', format: (value) => value ? 'Bereikbaar' : 'Niet gevonden' },
  { key: 'openGraphSignals', label: 'Voorvertoning bij delen', format: (value) => `${Array.isArray(value) ? value.length : 0}` },
  { key: 'httpStatus', label: 'HTTP-status' },
  { key: 'responseTimeMs', label: 'Responstijd', format: (value) => `${Number(value).toLocaleString('nl-NL')} ms` },
  { key: 'pageSizeKb', label: 'Paginagrootte', format: (value) => `${Number(value).toLocaleString('nl-NL')} KB` },
  { key: 'https', label: 'HTTPS', format: (value) => value ? 'Ja' : 'Nee' },
  { key: 'compressed', label: 'Gegevenscompressie', format: (value) => value === null ? 'Niet vastgesteld' : value ? 'Ja' : 'Nee' },
];

function plainLanguage(value: string): string {
  return value
    .replace(/\bCTA('s|’s|s)?\b/gi, (_match, suffix = "") => {
      const normalized = suffix.toLowerCase().includes("s") ? "actieknoppen" : "actieknop";
      return normalized;
    })
    .replace(/\bH1-koppen?\b/gi, "hoofdtitels")
    .replace(/\bH1-kop\b/gi, "hoofdtitel")
    .replace(/\bH1\b/gi, "hoofdtitel")
    .replace(/\bSEO\b/gi, "vindbaarheid in Google")
    .replace(/meta description/gi, "korte omschrijving voor Google")
    .replace(/Open Graph/gi, "voorvertoning bij delen")
    .replace(/LocalBusiness structured data/gi, "gestructureerde bedrijfsinformatie voor zoekmachines")
    .replace(/structured data/gi, "gestructureerde informatie voor zoekmachines")
    .replace(/Core Web Vitals/gi, "belangrijke metingen voor snelheid en gebruiksgemak")
    .replace(/PageSpeed Insights/gi, "Google-meting voor snelheid en prestaties")
    .replace(/robots\.txt/gi, "instructies voor zoekmachines (robots.txt)")
    .replace(/sitemap\.xml/gi, "pagina-overzicht voor zoekmachines (sitemap)")
    .replace(/\bCanonical-link\b/gi, "voorkeursadres van de pagina")
    .replace(/\bCanonical URL\b/gi, "voorkeursadres van de pagina")
    .replace(/\bCanonical\b/gi, "voorkeursadres van de pagina")
    .replace(/\bHTTP-status\b/gi, "serverantwoord")
    .replace(/\bViewport-instelling\b/gi, "instelling voor mobiele weergave")
    .replace(/\bcontent encoding\b/gi, "compressiemethode")
    .replace(/\bRobots-directives\b/gi, "instructies voor zoekmachines");
}

function formatDate(value: string, locale: 'nl' | 'en' = 'nl') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'nl-NL', { dateStyle: 'long', timeStyle: 'short' }).format(date);
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
    <Localized>
      <div className="score-ring" style={{ background: `conic-gradient(hsl(var(--primary)) ${score}%, hsl(var(--border)) 0)` }} data-testid="score-overall">
        <div className="score-ring-inner">
          <strong>{score}</strong>
          <span>van 100</span>
        </div>
      </div>
    </Localized>
  );
}

function scoreLabel(score: number | null | undefined): string {
  if (typeof score !== 'number') return 'Niet gemeten';
  if (score >= 90) return 'Uitstekend';
  if (score >= 80) return 'Goed';
  if (score >= 60) return 'Redelijk';
  if (score >= 40) return 'Verbetering nodig';
  return 'Veel verbetering nodig';
}

function getScoreBasedCheckScore(check: ScanAnalysis['categoryScores'][number]['checks'][number]): number | null {
  if (check.key !== 'mobile-performance') return null;
  const score = Number(check.value);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
}

function CategoryScores({ analysis }: { analysis: ScanAnalysis }) {
  const scoresByKey = new Map(analysis.categoryScores.map((category) => [category.key, category]));
  const importantConversionChecks = new Set(['primary-cta-clear', 'value-proposition', 'target-audience']);

  return (
    <Localized><section className="results-section" aria-labelledby="category-scores-title">
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
                  <h3>{plainLanguage(result?.label || category.label)}</h3>
                  <p>{plainLanguage(result ? result.note : 'Niet beschikbaar in deze analyse.')}</p>
                  {result && (
                    <div className="category-coverage">
                      <span>Kwaliteit gemeten: <strong>{result.qualityScore ?? '—'}{result.qualityScore !== null ? '/100' : ''}</strong></span>
                      <span>Uitgevoerd: <strong>{result.executedCount} van {result.checks.length}</strong></span>
                      <span>Meetdekking: <strong>{result.coveragePercent}%</strong></span>
                      <span>Gewicht totaal: <strong>{result.weightPercent}%</strong></span>
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
                    <span>
                      {result.checks.some((check) => getScoreBasedCheckScore(check) !== null)
                        ? `${result.executedCount} scoremeting${result.executedCount === 1 ? '' : 'en'} uitgevoerd`
                        : `${result.passedCount} geslaagd · ${result.failedCount} niet geslaagd · ${result.unknownCount} onbekend · ${result.executedCount} uitgevoerd`}
                    </span>
                  </summary>
                  <div className="category-check-list">
                    {result.checks.map((check) => {
                      const scoreBasedValue = getScoreBasedCheckScore(check);
                      const scoreBased = scoreBasedValue !== null;
                      return (
                        <div className={`category-check ${scoreBased ? 'check-score' : `check-${check.status}`}`} key={check.key}>
                          <span className="check-status-icon" aria-hidden="true">
                            {scoreBased
                              ? scoreBasedValue >= 80
                                ? <CheckCircle2 />
                                : scoreBasedValue >= 60
                                  ? <CircleAlert />
                                  : <XCircle />
                              : check.status === 'passed'
                                ? <CheckCircle2 />
                                : check.status === 'failed'
                                  ? <XCircle />
                                  : <CircleHelp />}
                          </span>
                          <div>
                            <div className="check-title-row">
                              <strong>{plainLanguage(check.label)}</strong>
                              <span>Weging {check.weight === 3 ? 'hoog' : check.weight === 2 ? 'middel' : 'laag'}</span>
                            </div>
                            <p>{plainLanguage(check.evidence)}</p>
                          </div>
                          <span className="check-status-label">
                            {scoreBased
                              ? `${scoreBasedValue}/100 · ${scoreLabel(scoreBasedValue)}`
                              : check.status === 'passed'
                                ? 'Geslaagd'
                                : check.status === 'failed'
                                  ? 'Niet geslaagd'
                                  : 'Onbekend'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section></Localized>
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
    confidence: issue.confidence,
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
  const confidenceLabel = issue.confidence === 'high' ? 'Hoog' : issue.confidence === 'medium' ? 'Middel' : issue.confidence === 'low' ? 'Laag' : null;
  return (
    <Localized><article className={`issue-card issue-${issue.severity}`} data-testid={`issue-card-${issue.id}`}>
      <div className="issue-card-top">
        <span className="issue-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="severity-label">Impact: {impactLabel}</span>
      </div>
      <h3>{plainLanguage(issue.title)}</h3>
      <div className="issue-detail">
        <div className="issue-detail-label"><CircleAlert /> Waar we het vonden</div>
        <p>{plainLanguage(issue.fact)}</p>
      </div>
      <div className="issue-detail">
        <div className="issue-detail-label"><CircleHelp /> Waarom dit belangrijk is</div>
        <p>{plainLanguage(issue.whyItMatters)}</p>
      </div>
      <div className="issue-detail recommendation">
        <div className="issue-detail-label"><Check /> Wat je concreet kunt verbeteren</div>
        <p>{plainLanguage(issue.recommendation)}</p>
      </div>
      {issue.proposal && (
        <div className="issue-detail proposal">
          <div className="issue-detail-label"><FileWarning /> Concreet voorstel</div>
          <p>{plainLanguage(issue.proposal)}</p>
        </div>
      )}
      <div className="issue-meta" aria-label={`Impact ${impactLabel}, moeilijkheid ${difficultyLabel}${confidenceLabel ? `, vertrouwen ${confidenceLabel}` : ''}`}>
        <span>Impact <strong>{impactLabel}</strong></span>
        <span>Moeilijkheid <strong>{difficultyLabel}</strong></span>
        {confidenceLabel && <span>Vertrouwen <strong>{confidenceLabel}</strong></span>}
      </div>
      {issue.relatedChecks.length > 0 && (
        <p className="issue-related-checks">Gebaseerd op: {issue.relatedChecks.map((label) => plainLanguage(label)).join(' · ')}</p>
      )}
    </article>
  </Localized>
  );
}

function DetectedFacts({ analysis }: { analysis: ScanAnalysis }) {
  const { detectedFacts } = analysis;
  return (
    <Localized><section className="results-section facts-section" aria-labelledby="facts-title">
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
  </Localized>
  );
}

const glossaryTerms = [
  { term: 'Vindbaarheid in Google', explanation: 'Hoe goed zoekmachines kunnen begrijpen en vinden waar je pagina over gaat.' },
  { term: 'Actieknop', explanation: 'Een knop of link die een bezoeker uitnodigt om iets te doen, zoals contact opnemen, een offerte aanvragen of een product bekijken.' },
  { term: 'Hoofdtitel', explanation: 'De belangrijkste titel van een pagina. Deze helpt bezoekers en zoekmachines begrijpen waar de pagina over gaat.' },
  { term: 'Korte omschrijving voor Google', explanation: 'Een korte beschrijving van een pagina die zoekmachines kunnen gebruiken in zoekresultaten.' },
  { term: 'Voorkeursadres van de pagina', explanation: 'Het adres dat aan zoekmachines aangeeft welke versie van een pagina de hoofdversie is.' },
  { term: 'Voorvertoning bij delen', explanation: 'Informatie die bepaalt hoe een pagina eruitziet wanneer iemand de link deelt via sociale media of berichtenapps.' },
  { term: 'Instructies voor zoekmachines', explanation: 'Instellingen waarmee een website zoekmachines aanwijzingen kan geven over welke onderdelen ze mogen bezoeken.' },
  { term: 'Pagina-overzicht voor zoekmachines', explanation: 'Een overzicht van belangrijke pagina’s waarmee zoekmachines nieuwe of gewijzigde pagina’s kunnen ontdekken.' },
  { term: 'Alt-tekst', explanation: 'Een korte beschrijving van een afbeelding. Die helpt mensen die de afbeelding niet kunnen zien en kan ook zoekmachines extra context geven.' },
  { term: 'Google-meting voor snelheid en prestaties', explanation: 'Een automatische meting van Google die onder andere kijkt naar de prestaties van een pagina op een mobiel apparaat.' },
];
function Glossary() {
  return (
    <Localized><section className="results-section" aria-labelledby="glossary-title">
      <div className="results-section-heading">
        <div>
          <div className="section-kicker">Geen technische voorkennis nodig</div>
          <h2 className="results-title" id="glossary-title">Begrippen eenvoudig uitgelegd</h2>
        </div>
        <p className="results-section-note">Kom je een term tegen die je niet kent? Hier leggen we de belangrijkste begrippen uit.</p>
      </div>
      <div className="facts-grid">
        {glossaryTerms.map((item) => (
          <div className="fact-item" key={item.term}>
            <span>{item.term}</span>
            <strong>{item.explanation}</strong>
          </div>
        ))}
      </div>
    </section>
  </Localized>
  );
}

function ResultHeader({ scan, analysis }: { scan: { url: string; createdAt: string }; analysis: ScanAnalysis }) {
  const { locale } = useLanguage();
  const checkedCategoryCount = analysis.categoryScores.filter((category) => category.checked).length;
  const allCategoriesMeasured = checkedCategoryCount === analysis.categoryScores.length;
  return (
    <Localized><header className="results-hero">
      <div className="page-frame">
        <Link href="/" className="back-link" data-testid="link-back-home"><ArrowLeft /> Nieuwe scan</Link>
        <div className="results-hero-grid">
          <div className="reveal">
            <div className="eyebrow">Scan afgerond</div>
            <h1>Een helder beeld van <em>je website.</em></h1>
            <a className="scanned-url" href={scan.url} target="_blank" rel="noreferrer" data-testid="link-scanned-url">
              <span>{scan.url}</span><ExternalLink />
            </a>
            <p className="scan-date"><Clock3 /> Gescand op {formatDate(scan.createdAt, locale)}</p>
          </div>
          <div className="overall-score-card reveal reveal-delay-1">
            <div className="score-card-caption"><span>Totale score</span><span>SiteCheck AI</span></div>
            <div className="score-card-main">
              <ScoreRing score={analysis.overallScore} />
              <div>
                <strong className="score-verdict">{analysis.overallScore >= 70 ? 'Een stevige basis' : analysis.overallScore >= 40 ? 'Ruimte om te groeien' : 'Tijd voor aandacht'}</strong>
                <p>De totaalscore weegt Conversie en vindbaarheid in Google elk voor 20%, Mobiel en Techniek elk voor 15%, en de overige onderdelen elk voor 10%.</p>
                <div className="overall-coverage">
                  <strong>Gemeten kwaliteit: {analysis.overallQualityScore ?? '—'}{analysis.overallQualityScore !== null ? '/100' : ''}</strong>
                  <strong>Totale meetdekking: {analysis.overallCoveragePercent}%</strong>
                  {!allCategoriesMeasured && (
                    <span>
                      {checkedCategoryCount} van de {analysis.categoryScores.length} onderdelen zijn gecontroleerd.
                      Niet-gemeten onderdelen tellen niet positief mee; een volledige score is pas mogelijk wanneer alle onderdelen meetbaar zijn.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  </Localized>
  );
}

function Strengths({ analysis }: { analysis: ScanAnalysis }) {
  const strengths = analysis.categoryScores
    .flatMap((category) =>
      category.checks
        .filter((check) => check.status === 'passed')
        .map((check) => ({
          ...check,
          category: category.label,
        })),
    )
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  if (strengths.length === 0) return null;

  return (
    <Localized><section
      className="results-section strengths-section"
      aria-labelledby="strengths-title"
    >
      <div className="results-section-heading">
        <div>
          <div className="section-kicker">Sterke punten</div>
          <h2 className="results-title" id="strengths-title">
            Wat gaat er al goed?
          </h2>
        </div>

        <p className="results-section-note">
          Deze onderdelen van je website kwamen goed uit de scan.
        </p>
      </div>

      <div className="strengths-grid">
        {strengths.map((strength) => (
          <article
            className="strength-card"
            key={`${strength.category}-${strength.key}`}
          >
            <div className="strength-icon">
              <CheckCircle2 />
            </div>

            <div>
              <span className="strength-category">
                {strength.category}
              </span>

              <h3>{strength.label}</h3>

              <p>{strength.evidence}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  </Localized>
  );
}

function ResultsContent({
  analysis,
  scanId,
  isPaid,
}: {
  analysis: ScanAnalysis;
  scanId: number;
  isPaid: boolean;
}) {
  const [, setLocation] = useLocation();
  const { locale } = useLanguage();
  const aiRecommendations = analysis.aiRecommendations ?? null;
  console.log("AI COUNT", aiRecommendations?.length, aiRecommendations);
  console.log("PAID DEBUG", { isPaid, paymentStatus: analysis });
  const hasAiAnalysis = aiRecommendations !== null;
  const issueLimit = isPaid ? 20 : 3;

  const issues = aiRecommendations !== null
    ? aiRecommendations.slice(0, issueLimit).map(aiRecommendation)
    : analysis.issues.slice(0, issueLimit).map(deterministicRecommendation); 
  return (
  <Localized><div className="page-frame results-content-frame">
    <CategoryScores analysis={analysis} />

      {isPaid && <Strengths analysis={analysis} />}

      {isPaid && (
        <section className="results-section report-download-section">
          <div className="report-download-card">
            <div>
              <div className="section-kicker">Volledig rapport</div>
              <h2 className="results-title">
                Download je volledige rapport
              </h2>
              <p className="results-section-note">
                Alle scores, sterke punten, verbeterpunten en het actieplan
                gebundeld in één PDF.
              </p>
            </div>

            <button
              type="button"
              className="upgrade-button"
              onClick={async () => {
                const accessToken = getScanAccessToken(scanId);
                if (!accessToken) {
                  alert('Deze scan is niet meer beschikbaar in deze browser. Start een nieuwe scan.');
                  return;
                }
                try {
                  const response = await fetch(`/api/scans/${scanId}/report.pdf?lang=${locale}`, {
                    headers: { 'x-scan-access-token': accessToken },
                  });
                  if (!response.ok) throw new Error('Het rapport kon niet worden gedownload.');
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'sitecheck-ai-rapport.pdf';
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                } catch (error) {
                  alert(error instanceof Error ? error.message : 'Het rapport kon niet worden gedownload.');
                }
              }}
            >
              PDF downloaden
            </button>
          </div>
        </section>
      )}
      
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
        <div className="issues-grid">
          {issues.map((issue, index) => (
            <IssueCard issue={issue} index={index} key={issue.id} />
          ))}
        </div>
      ) : (
        <div className="results-empty" data-testid="empty-issues">
          Deze scan rapporteerde geen aandachtspunten.
        </div>
      )}

      {isPaid && issues.length > 0 && (
        <section className="action-plan" aria-labelledby="action-plan-title">
          <div className="results-section-heading">
            <div>
              <div className="section-kicker">Praktisch actieplan</div>
              <h2 className="results-title" id="action-plan-title">
                Dit zou ik als eerste aanpakken.
              </h2>
            </div>
            <p className="results-section-note">
              We hebben de belangrijkste bevindingen van deze scan op volgorde gezet,
              zodat je direct weet waar je kunt beginnen.
            </p>
          </div>

          <div className="action-plan-list">
            {issues.map((issue, index) => (
              <div className="action-plan-item" key={`action-${issue.id}`}>
                <div className="action-plan-number">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="action-plan-content">
                  <h3>{issue.title}</h3>
                  <p>{issue.proposal || issue.recommendation}</p>

                  <div className="action-plan-meta">
                    <span>
                      Impact <strong>
                        {issue.impact === 'high'
                          ? 'Hoog'
                          : issue.impact === 'medium'
                            ? 'Middel'
                            : 'Laag'}
                      </strong>
                    </span>

                    <span>
                      Moeilijkheid <strong>
                        {issue.difficulty === 'easy'
                          ? 'Makkelijk'
                          : issue.difficulty === 'medium'
                            ? 'Gemiddeld'
                            : 'Moeilijk'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <hr />
      {isPaid === false && (
        <div className="upgrade-card">
          <div>
            <div className="section-kicker">Volledig rapport</div>
            <h3>We laten je niet achter met alleen een score.</h3>
            <p>
              Ontdek alle gevonden verbeterpunten op je website, inclusief concrete
              AI-voorstellen, impact, moeilijkheid en een praktisch actieplan op volgorde.
            </p>
          </div>

          <button
            type="button"
            className="upgrade-button"
            style={{
              maxWidth: '100%',
              minWidth: 0,
              flexShrink: 1,
              whiteSpace: 'normal',
              textAlign: 'center',
            }}
            onClick={() => setLocation(`/scans/${scanId}/upgrade`)}
          >
            Bekijk alle verbeterpunten — €29
          </button>
        </div>
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
    </div>
  </Localized>
  );
}

function LoadingResults() {
  return (
    <Localized><main className="site-shell results-shell">
      <nav className="nav-wrap"><div className="page-frame"><Link href="/" className="brand-mark" data-testid="link-home-loading"><span className="brand-symbol" aria-hidden="true"><RefreshCw /></span><span className="brand-name">SiteCheck <span>AI</span></span></Link></div></nav>
      <div className="page-frame loading-results" role="status" data-testid="status-scan-loading">
        <div className="loading-orbit"><RefreshCw /></div>
        <div className="eyebrow">Even geduld</div>
        <h1>SiteCheck AI analyseert<br /><em>de website.</em></h1>
        <p>We halen de pagina op en kijken rustig naar wat er daadwerkelijk te controleren is. Deze pagina ververst automatisch.</p>
        <div className="loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </main></Localized>
  );
}

function ScanProblem({ title, message, url }: { title: string; message: string; url?: string }) {
  return (
    <Localized><main className="site-shell results-shell">
      <nav className="nav-wrap"><div className="page-frame"><Link href="/" className="brand-mark" data-testid="link-home-problem"><span className="brand-symbol" aria-hidden="true"><RadarIcon /></span><span className="brand-name">SiteCheck <span>AI</span></span></Link></div></nav>
      <div className="page-frame scan-problem" role="alert" data-testid="status-scan-problem">
        <div className="problem-icon"><CircleAlert /></div>
        <div className="eyebrow">Scan niet beschikbaar</div>
        <h1>{title}</h1>
        <p>{message}</p>
        {url && <span className="problem-url">{url}</span>}
        <Link href="/" className="scan-button problem-button" data-testid="link-start-new-scan"><ArrowLeft /> Terug naar een nieuwe scan</Link>
      </div>
    </main></Localized>
  );
}

function RadarIcon() {
  return <LockKeyhole />;
}

export default function ScanResults() {
  const params = useParams<{ scanId?: string }>();
  const scanId = Number(params.scanId);
  const { locale } = useLanguage();
  const validScanId = Number.isInteger(scanId) && scanId > 0;
  const accessToken = validScanId ? getScanAccessToken(scanId) : null;
  const scanQuery = useGetScan(validScanId ? scanId : 0, {
    request: accessToken ? { headers: { 'x-scan-access-token': accessToken } } : undefined,
    query: {
      enabled: validScanId,
      queryKey: [...getGetScanQueryKey(validScanId ? scanId : 0), accessToken ?? 'no-access-token'],
      refetchInterval: (query) => query.state.data?.status === 'analyzing' ? 4_000 : false,
    },
  });

  if (!validScanId) return <ScanProblem title="Dit scanadres klopt niet." message="We kunnen zonder een geldig scan-ID geen resultaat ophalen." />;
  if (validScanId && !accessToken) return <ScanProblem title="Deze scan is niet beschikbaar." message="Open deze scan in de browser waarin je hem hebt gestart, of start een nieuwe scan." />;
  if (scanQuery.isLoading) return <LoadingResults />;
  if (scanQuery.isError) return <ScanProblem title="We konden deze scan niet ophalen." message={getErrorMessage(scanQuery.error)} />;
  if (!scanQuery.data) return <ScanProblem title="Geen resultaat gevonden." message="Voor dit scanadres is geen resultaat beschikbaar." />;

  const scan = scanQuery.data;
  const isPaid = scan.paymentStatus === 'paid';
  if (scan.status === 'analyzing') return <LoadingResults />;
  if (scan.status === 'failed') return <ScanProblem title="Deze scan kon niet worden afgerond." message={scan.error || 'De scan heeft geen analyse kunnen opleveren.'} url={scan.url} />;
  if (!scan.analysis) return <ScanProblem title="Er is nog geen analyse beschikbaar." message="De scan is afgerond, maar de API heeft geen analyse meegestuurd. Probeer deze pagina later opnieuw." url={scan.url} />;

  return (
    <Localized><main className="site-shell results-shell">
      <nav className="nav-wrap results-nav"><div className="page-frame flex items-center justify-between"><Link href="/" className="brand-mark" data-testid="link-home-results"><span className="brand-symbol" aria-hidden="true"><LockKeyhole /></span><span className="brand-name">SiteCheck <span>AI</span></span></Link><div className="nav-actions"><span className="nav-note">Een rustige check voor ambitieuze ondernemers</span><LanguageSwitcher /></div></div></nav>
      <ResultHeader scan={scan} analysis={scan.analysis} />
      <ResultsContent
        analysis={scan.analysis}
        scanId={scanId}
        isPaid={isPaid}
      />
      <footer className="footer">
        <div className="page-frame footer-inner">
          <span>© {new Date().getFullYear()} SJOOM AI Services – SiteCheck AI</span>
          <a href="mailto:info@sjoomai.nl" className="footer-link">
            info@sjoomai.nl
          </a>
          <Link
            href="/"
            className="footer-link"
            data-testid="link-footer-new-scan"
          >
            Nieuwe scan starten
          </Link>
        </div>
      </footer>
   </main></Localized>
  );
}