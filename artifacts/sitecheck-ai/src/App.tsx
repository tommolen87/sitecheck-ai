import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { LanguageProvider, LanguageSwitcher, Localized, useLanguage } from '@/lib/i18n';
import { getScanAccessToken, setScanAccessToken } from '@/lib/scan-access';
import ScanResults from '@/pages/scan-results';
import Upgrade from '@/pages/upgrade';
import { blogArticles, getBlogArticle } from '@/lib/blog-data';
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
const seoPages: Record<string, { nl: { title: string; description: string; heading: string; intro: string; points: string[]; questions: string[] }; en: { title: string; description: string; heading: string; intro: string; points: string[]; questions: string[] } }> = {
  'website-scan': {
    nl: { title: 'Website scan: controleer je website | SiteCheck AI', description: 'Doe een website scan en ontdek praktische verbeterpunten voor SEO, techniek, mobiel, content en conversie.', heading: 'Website scan voor een helder beeld van je website', intro: 'Een website scan geeft je snel inzicht in wat er op je website goed gaat en waar kansen liggen. SiteCheck AI kijkt naar concrete signalen en vertaalt die naar begrijpelijke verbeterpunten.', points: ['SEO en vindbaarheid', 'Techniek, snelheid en mobiele ervaring', 'Content, vertrouwen en conversie'], questions: ['Wat controleert een website scan?', 'Krijg ik alleen een score?', 'Kan ik de scan gratis starten?'] },
    en: { title: 'Website Scan & Checker | SiteCheck AI', description: 'Run a website scan and find practical SEO, technical, mobile, content and conversion improvements.', heading: 'Website scan for a clear view of your website', intro: 'A website scan gives you a practical overview of what works and where your website can improve. SiteCheck AI checks measurable signals and turns them into clear next steps.', points: ['SEO and search visibility', 'Technical, speed and mobile experience', 'Content, trust and conversion'], questions: ['What does a website scan check?', 'Do I only get a score?', 'Can I start the scan for free?'] },
  },
  'seo-check': {
    nl: { title: 'SEO check website | SiteCheck AI', description: 'Controleer de belangrijkste SEO-signalen van je website en ontdek concrete verbeterpunten voor Google.', heading: 'SEO check voor je website', intro: 'Een goede SEO-basis begint met weten wat zoekmachines en bezoekers daadwerkelijk op je pagina aantreffen. SiteCheck AI controleert onder andere titels, omschrijvingen, koppen, links en andere zichtbare SEO-signalen.', points: ['Paginatitels en metabeschrijvingen', 'Koppen en inhoudelijke structuur', 'Interne en externe links'], questions: ['Is dit een volledige SEO-audit?', 'Kijkt SiteCheck AI naar mijn hele website?', 'Wat kan ik na de SEO check verbeteren?'] },
    en: { title: 'SEO Website Check | SiteCheck AI', description: 'Check the key SEO signals on your website and find practical improvements for search visibility.', heading: 'SEO check for your website', intro: 'A strong SEO foundation starts with understanding what search engines and visitors can actually find on a page. SiteCheck AI checks titles, descriptions, headings, links and other visible SEO signals.', points: ['Page titles and meta descriptions', 'Headings and content structure', 'Internal and external links'], questions: ['Is this a complete SEO audit?', 'Does SiteCheck AI crawl my entire website?', 'What can I improve after the SEO check?'] },
  },
  'website-analyse': {
    nl: { title: 'Website analyse | SiteCheck AI', description: 'Laat je website analyseren op SEO, techniek, content, mobiel en conversie en krijg praktische verbeteradviezen.', heading: 'Website analyse zonder technisch rapport', intro: 'Een website analyse moet je helpen beslissen wat je als eerste aanpakt. Daarom combineert SiteCheck AI meetbare websitegegevens met duidelijke uitleg en concrete aanbevelingen.', points: ['Wat bezoekers als eerste zien', 'Technische signalen en prestaties', 'Conversie, vertrouwen en contactmogelijkheden'], questions: ['Welke onderdelen worden geanalyseerd?', 'Zijn de adviezen begrijpelijk voor ondernemers?', 'Kan ik een volledig rapport kopen?'] },
    en: { title: 'Website Analysis | SiteCheck AI', description: 'Analyze your website for SEO, technical, content, mobile and conversion issues with practical advice.', heading: 'Website analysis without a technical report', intro: 'A website analysis should help you decide what to improve first. SiteCheck AI combines measurable website data with clear explanations and practical recommendations.', points: ['What visitors see first', 'Technical signals and performance', 'Conversion, trust and contact paths'], questions: ['What areas are analyzed?', 'Are the recommendations written for business owners?', 'Can I purchase a full report?'] },
  },
  'website-audit': {
    nl: { title: 'Website audit | SiteCheck AI', description: 'Website audit voor ondernemers: ontdek SEO-, techniek-, content-, mobiel- en conversiepunten.', heading: 'Website audit voor ondernemers', intro: 'Met een website audit krijg je een gestructureerde blik op de belangrijkste onderdelen van je website. SiteCheck AI maakt technische signalen begrijpelijk en koppelt ze aan praktische verbeterstappen.', points: ['SEO en technische basis', 'Mobiele gebruikservaring', 'Conversie en vertrouwen'], questions: ['Wat is het verschil tussen een scan en audit?', 'Welke gegevens worden gemeten?', 'Kan ik het volledige rapport downloaden?'] },
    en: { title: 'Website Audit | SiteCheck AI', description: 'Website audit for businesses covering SEO, technical, content, mobile and conversion signals.', heading: 'Website audit for businesses', intro: 'A website audit gives you a structured view of the most important parts of your website. SiteCheck AI makes technical signals easier to understand and connects them to practical next steps.', points: ['SEO and technical foundations', 'Mobile user experience', 'Conversion and trust'], questions: ['What is the difference between a scan and an audit?', 'What data is measured?', 'Can I download the full report?'] },
  },
  'website-analyzer': {
    nl: { title: 'Website analyzer | SiteCheck AI', description: 'Gebruik een website analyzer om je website te controleren op SEO, techniek, mobiel en conversie.', heading: 'Website analyzer voor praktische verbeterpunten', intro: 'Een website analyzer helpt je om snel patronen en aandachtspunten te vinden. SiteCheck AI controleert je website op verschillende invalshoeken en legt de uitkomsten uit zonder onnodig jargon.', points: ['Vindbaarheid en SEO-signalen', 'Techniek en snelheid', 'Content, vertrouwen en conversie'], questions: ['Welke signalen kan de analyzer zien?', 'Is technische kennis nodig?', 'Hoe start ik een analyse?'] },
    en: { title: 'Website Analyzer | SiteCheck AI', description: 'Use a website analyzer to check SEO, technical, mobile and conversion signals and find practical improvements.', heading: 'Website analyzer for practical improvements', intro: 'A website analyzer helps you quickly find patterns and areas that need attention. SiteCheck AI checks multiple aspects of your website and explains the results without unnecessary jargon.', points: ['Search visibility and SEO signals', 'Technical performance and speed', 'Content, trust and conversion'], questions: ['What can the analyzer detect?', 'Do I need technical knowledge?', 'How do I start an analysis?'] },
  },
  'gratis-website-scan': {
    nl: { title: 'Gratis website scan | SiteCheck AI', description: 'Doe een gratis website scan en ontdek waar je website beter kan op SEO, techniek, mobiel, content en conversie.', heading: 'Gratis website scan', intro: 'Wil je snel weten waar je website kansen laat liggen? Met de gratis website scan van SiteCheck AI krijg je een helder eerste beeld van meetbare verbeterpunten.', points: ['SEO en vindbaarheid', 'Techniek, snelheid en mobiel', 'Content, vertrouwen en conversie'], questions: ['Is de website scan echt gratis?', 'Wat krijg ik na de gratis scan?', 'Kan ik daarna een volledig rapport kopen?'] },
    en: { title: 'Free Website Scan | SiteCheck AI', description: 'Run a free website scan and discover SEO, technical, mobile, content and conversion improvements.', heading: 'Free website scan', intro: 'Want to quickly see where your website can improve? SiteCheck AI gives you a clear first view of measurable opportunities with a free website scan.', points: ['SEO and search visibility', 'Technical, speed and mobile checks', 'Content, trust and conversion'], questions: ['Is the website scan really free?', 'What do I get from the free scan?', 'Can I purchase a full report afterwards?'] },
  },
  'website-check': {
    nl: { title: 'Website check | SiteCheck AI', description: 'Doe een website check en ontdek praktische verbeterpunten voor SEO, techniek, content, mobiel en conversie.', heading: 'Website check voor je bedrijf', intro: 'Een website check geeft je snel overzicht van de belangrijkste signalen op je website. SiteCheck AI vertaalt de metingen naar duidelijke aandachtspunten.', points: ['Vindbaarheid en SEO', 'Technische kwaliteit', 'Gebruikservaring en conversie'], questions: ['Wat controleert een website check?', 'Heb ik technische kennis nodig?', 'Hoe start ik de check?'] },
    en: { title: 'Website Checker | SiteCheck AI', description: 'Check your website for SEO, technical, content, mobile and conversion signals with practical recommendations.', heading: 'Website check for your business', intro: 'A website check gives you a quick overview of important signals on your website. SiteCheck AI turns measurable data into clear areas to improve.', points: ['Search visibility and SEO', 'Technical quality', 'User experience and conversion'], questions: ['What does the website checker check?', 'Do I need technical knowledge?', 'How do I start the check?'] },
  },
  'website-snelheid-test': {
    nl: { title: 'Website snelheid testen | SiteCheck AI', description: 'Test de snelheid en technische prestaties van je website en ontdek waar verbeteringen mogelijk zijn.', heading: 'Website snelheid testen', intro: 'Een trage website kan de gebruikerservaring beïnvloeden. SiteCheck AI controleert meetbare technische signalen en maakt duidelijk welke aandacht verdienen.', points: ['Responstijd van de server', 'Paginagrootte en compressie', 'Mobiele en technische signalen'], questions: ['Meet SiteCheck AI mijn website snelheid?', 'Welke technische signalen worden gecontroleerd?', 'Wat kan ik verbeteren als mijn website traag is?'] },
    en: { title: 'Website Speed Test | SiteCheck AI', description: 'Test website speed and technical performance and find practical areas for improvement.', heading: 'Website speed test', intro: 'A slow website can affect the user experience. SiteCheck AI checks measurable technical signals and explains which areas deserve attention.', points: ['Server response time', 'Page size and compression', 'Mobile and technical signals'], questions: ['Does SiteCheck AI measure website speed?', 'Which technical signals are checked?', 'What can I improve if my website is slow?'] },
  },
  'website-conversie-check': {
    nl: { title: 'Website conversie check | SiteCheck AI', description: 'Controleer je website op conversie, contactmogelijkheden, actieknoppen en vertrouwen.', heading: 'Website conversie check', intro: 'Een bezoeker moet makkelijk begrijpen wat de volgende stap is. SiteCheck AI kijkt naar zichtbare conversiesignalen en contactmogelijkheden.', points: ['Duidelijke actieknoppen', 'Contactmogelijkheden', 'Vertrouwen en eerste indruk'], questions: ['Wat is een conversie check?', 'Kijkt de scan naar contactmogelijkheden?', 'Welke verbeteringen kunnen meer actie opleveren?'] },
    en: { title: 'Website Conversion Audit | SiteCheck AI', description: 'Check your website for conversion signals, contact paths, calls to action and trust.', heading: 'Website conversion check', intro: 'Visitors should understand the next step without having to search for it. SiteCheck AI checks visible conversion and contact signals.', points: ['Clear calls to action', 'Contact paths', 'Trust and first impression'], questions: ['What is a conversion check?', 'Does the scan check contact paths?', 'What improvements can encourage more action?'] },
  },
  'seo-website-check': {
    nl: { title: 'SEO website check | SiteCheck AI', description: 'Controleer je website op belangrijke SEO-signalen zoals titels, omschrijvingen, koppen en links.', heading: 'SEO website check', intro: 'Wil je weten of de basis van je website goed staat voor zoekmachines? SiteCheck AI controleert zichtbare SEO-signalen en geeft praktische verbeterpunten.', points: ['Paginatitels en metabeschrijvingen', 'Koppen en contentstructuur', 'Interne en externe links'], questions: ['Welke SEO-signalen worden gecontroleerd?', 'Is dit hetzelfde als een volledige SEO-audit?', 'Krijg ik concrete verbeteradviezen?'] },
    en: { title: 'SEO Website Checker | SiteCheck AI', description: 'Check important SEO signals including titles, descriptions, headings and links on your website.', heading: 'SEO website check', intro: 'Want to know whether your website has a solid SEO foundation? SiteCheck AI checks visible SEO signals and turns them into practical improvements.', points: ['Page titles and meta descriptions', 'Headings and content structure', 'Internal and external links'], questions: ['Which SEO signals are checked?', 'Is this the same as a full SEO audit?', 'Do I get practical recommendations?'] },
  },
  'seo-audit': {
    nl: { title: 'SEO audit website | SiteCheck AI', description: 'SEO audit voor je website met concrete aandachtspunten voor titels, content, links en technische SEO-signalen.', heading: 'SEO audit met concrete verbeterpunten', intro: 'Een SEO audit helpt je begrijpen welke signalen op je pagina bijdragen aan vindbaarheid en welke onderdelen aandacht verdienen. SiteCheck AI zet de meetbare bevindingen overzichtelijk voor je op een rij.', points: ['Titels, omschrijvingen en koppen', 'Links en crawlbare signalen', 'Technische basis voor zoekmachines'], questions: ['Wat controleert een SEO audit?', 'Krijg ik concrete aanbevelingen?', 'Kan ik de audit als PDF ontvangen?'] },
    en: { title: 'SEO Website Audit | SiteCheck AI', description: 'SEO website audit with practical findings for titles, content, links and technical SEO signals.', heading: 'SEO audit with practical improvement points', intro: 'An SEO audit helps you understand which signals support search visibility and which areas need attention. SiteCheck AI organizes measurable findings into clear next steps.', points: ['Titles, descriptions and headings', 'Links and crawlable signals', 'Technical foundations for search engines'], questions: ['What does an SEO audit check?', 'Do I get practical recommendations?', 'Can I receive the audit as a PDF?'] },
  },
};

function SeoHead() {
  const { locale } = useLanguage();
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts[1] || '';
  const blogSlug = (pathParts[0] === 'nl' || pathParts[0] === 'en') && pathParts[1] === 'blog' ? pathParts[2] : undefined;
  const blogArticle = blogSlug ? getBlogArticle(blogSlug)?.[locale] : undefined;
  const page = seoPages[slug]?.[locale];
  const isBlogIndex = pathParts[1] === 'blog' && !blogSlug;
  const title = blogArticle
    ? blogArticle.title + ' | SiteCheck AI'
    : isBlogIndex
      ? (locale === 'nl' ? 'Website tips en SEO kennis | SiteCheck AI' : 'Website & SEO Guides | SiteCheck AI')
      : page?.title ?? (locale === 'nl'
        ? 'Website laten controleren? | SiteCheck AI'
        : 'Website Audit & Website Checker | SiteCheck AI');
  const description = blogArticle?.description
    ?? (isBlogIndex
      ? (locale === 'nl'
        ? 'Praktische artikelen over SEO, websites, snelheid, conversie en online vindbaarheid voor ondernemers.'
        : 'Practical guides about SEO, websites, speed, conversion and search visibility for business owners.')
      : page?.description ?? (locale === 'nl'
        ? 'Laat je website controleren met SiteCheck AI. Ontdek SEO-, content-, techniek-, mobiel- en conversieproblemen en krijg praktische verbeteradviezen.'
        : 'Check your website with SiteCheck AI. Find SEO, content, technical, mobile and conversion issues with practical improvement advice.'));
  const pathname = window.location.pathname;
  const basePath = pathname === '/' || pathname === '/nl' || pathname === '/nl/' || pathname === '/en' || pathname === '/en/'
    ? (locale === 'nl' ? '/nl' : '/en')
    : pathname;
  const canonical = new URL(basePath, window.location.origin).href;
  const seoSlug = seoPages[slug] ? slug : '';
  const nlUrl = new URL(seoSlug ? `/nl/${seoSlug}` : '/nl', window.location.origin).href;
  const enUrl = new URL(seoSlug ? `/en/${seoSlug}` : '/en', window.location.origin).href;

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = locale;
    const upsertMeta = (selector: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        const match = selector.match(/\[name="([^"]+)"\]/) || selector.match(/\[property="([^"]+)"\]/);
        if (match) element.setAttribute(selector.includes('property') ? 'property' : 'name', match[1]);
        document.head.appendChild(element);
      }
      element.content = content;
    };
    upsertMeta('meta[name="description"]', description);
    upsertMeta('meta[property="og:title"]', title);
    upsertMeta('meta[property="og:description"]', description);
    upsertMeta('meta[property="og:type"]', 'website');
    upsertMeta('meta[name="twitter:title"]', title);
    upsertMeta('meta[name="twitter:description"]', description);

    const setLink = (rel: string, href: string, attrs: Record<string, string> = {}) => {
      const attrSelector = Object.entries(attrs).map(([key, value]) => `[${key}="${value}"]`).join('');
      let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]${attrSelector}`);
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
        document.head.appendChild(element);
      }
      element.href = href;
    };
    setLink('canonical', canonical);
    setLink('alternate', nlUrl, { hreflang: 'nl' });
    setLink('alternate', enUrl, { hreflang: 'en' });
    setLink('alternate', nlUrl, { hreflang: 'x-default' });

    const structuredData = blogArticle
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: blogArticle.title,
          description: blogArticle.description,
          mainEntityOfPage: canonical,
          url: canonical,
          inLanguage: locale,
          author: { '@type': 'Organization', name: 'SiteCheck AI', url: window.location.origin },
          publisher: { '@type': 'Organization', name: 'SiteCheck AI', url: window.location.origin },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'SiteCheck AI',
          url: new URL(locale === 'nl' ? '/nl' : '/en', window.location.origin).href,
          description,
          inLanguage: locale,
        };
    let script = document.head.querySelector<HTMLScriptElement>('script[data-sitecheck-schema]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.sitecheckSchema = 'true';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [canonical, description, enUrl, locale, nlUrl, title]);

  return null;
}


function Home() {
  const [url, setUrl] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [activeScanId, setActiveScanId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [paidScanPending, setPaidScanPending] = useState(false);
  const { locale } = useLanguage();
  const createScan = useCreateScan({ request: { headers: { 'x-sitecheck-language': locale } } });
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const recentScans = useListScans({
    query: {
      queryKey: getListScansQueryKey(),
      staleTime: 15_000,
    },
  });
  const activeScan = useGetScan(activeScanId ?? 0, {
    request: activeScanId !== null && getScanAccessToken(activeScanId) ? { headers: { 'x-scan-access-token': getScanAccessToken(activeScanId)! } } : undefined,
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
          const accessToken = (scan as typeof scan & { accessToken?: string }).accessToken;
          if (!accessToken) {
            setSubmitError('Er kon geen beveiligde toegang voor deze scan worden aangemaakt. Probeer het opnieuw.');
            return;
          }
          setScanAccessToken(scan.id, accessToken);
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
        onSuccess: (scan) => {
          const accessToken = (scan as typeof scan & { accessToken?: string }).accessToken;
          if (!accessToken) {
            setPaidScanPending(false);
            setSubmitError('Er kon geen beveiligde toegang voor deze scan worden aangemaakt. Probeer het opnieuw.');
            return;
          }
          setScanAccessToken(scan.id, accessToken);
          void queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
          setPaidScanPending(false);
          setLocation(`/scans/${scan.id}/upgrade`);
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
    <Localized><main className="site-shell min-h-[100dvh]">
      <nav className="nav-wrap">
        <div className="page-frame flex items-center justify-between">
          <a className="brand-mark" href={locale === 'nl' ? '/nl' : '/en'} data-testid="link-home">
            <span className="brand-symbol" aria-hidden="true"><Radar /></span>
            <span className="brand-name">SiteCheck <span>AI</span></span>
          </a>
          <div className="nav-actions"><span className="nav-note">Voor ondernemers met een helder verhaal</span><LanguageSwitcher /></div>
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
    </main></Localized>
  );
}


function faqAnswer(question: string, locale: 'nl' | 'en'): string {
  if (locale === 'nl') {
    if (question.includes('echt gratis')) return 'Ja. De eerste scan is gratis en laat meetbare signalen en belangrijke aandachtspunten van je website zien.';
    if (question.includes('Wat krijg ik na de gratis scan')) return 'Je krijgt een overzicht van de onderdelen die de scan daadwerkelijk kon beoordelen, inclusief de belangrijkste bevindingen.';
    if (question.includes('volledig rapport kopen')) return 'Ja. Na de gratis scan kun je het volledige rapport voor €29 eenmalig aanschaffen.';
    if (question.includes('Wat controleert')) return 'De scan controleert meetbare signalen rond SEO, techniek, mobiel, content, vertrouwen en conversie.';
    if (question.includes('alleen een score')) return 'Nee. Naast scores krijg je uitleg over de gemeten onderdelen en concrete aandachtspunten.';
    if (question.includes('gratis starten')) return 'Ja. Je hebt alleen het webadres van je website nodig om de gratis scan te starten.';
    if (question.includes('volledige SEO-audit')) return 'Nee. SiteCheck AI richt zich op meetbare signalen van de opgehaalde pagina en is geen vervanging voor een volledige menselijke SEO-audit.';
    if (question.includes('hele website')) return 'De scan analyseert de pagina die je opgeeft en doet geen alsof hij pagina’s heeft gecontroleerd die niet daadwerkelijk zijn opgehaald.';
    if (question.includes('verbeteren')) return 'Je krijgt concrete aandachtspunten op basis van de signalen die tijdens de scan zijn gevonden.';
    if (question.includes('Welke onderdelen')) return 'De analyse kijkt onder andere naar zichtbare content, SEO-signalen, technische signalen, mobiel, contactmogelijkheden en conversie.';
    if (question.includes('begrijpelijk')) return 'Ja. De uitkomsten zijn bedoeld om zonder onnodig technisch jargon te begrijpen en toe te passen.';
    if (question.includes('downloaden')) return 'Ja. Na aankoop kun je het volledige rapport als PDF downloaden.';
    if (question.includes('Welke gegevens')) return 'De scan gebruikt alleen gegevens die tijdens het ophalen en controleren van de opgegeven pagina daadwerkelijk beschikbaar zijn.';
    if (question.includes('verschil tussen een scan en audit')) return 'Een scan geeft een meetbaar eerste overzicht; een uitgebreide audit gaat doorgaans dieper en kan ook menselijke beoordeling bevatten.';
    if (question.includes('Welke signalen')) return 'Onder andere paginatitels, metabeschrijvingen, koppen, links, technische signalen, snelheidssignalen en zichtbare conversiesignalen.';
    if (question.includes('technische kennis')) return 'Nee. De resultaten zijn juist bedoeld om technische signalen begrijpelijk uit te leggen.';
    if (question.includes('Hoe start')) return 'Vul het webadres van je website in en start de gratis scan.';
    if (question.includes('snelheid')) return 'De scan controleert meetbare technische signalen zoals responstijd, paginagrootte en compressie. Het is geen vervanging voor een volledige Lighthouse- of Core Web Vitals-test.';
    if (question.includes('contactmogelijkheden')) return 'Ja. De scan kijkt naar zichtbare contactsignalen en actieknoppen die op de opgehaalde pagina aanwezig zijn.';
    if (question.includes('meer actie')) return 'De scan kan aandachtspunten rond duidelijke actieknoppen, contactmogelijkheden en vertrouwen signaleren, maar kan geen conversiestijging garanderen.';
    return 'De scan is bedoeld om meetbare website-signalen begrijpelijk te maken en ze te vertalen naar praktische verbeterpunten.';
  }

  if (question.includes('really free')) return 'Yes. The first scan is free and shows measurable signals and important areas to improve on your website.';
  if (question.includes('What do I get from the free scan')) return 'You get an overview of the areas the scan could actually assess, including the most important findings.';
  if (question.includes('purchase a full report')) return 'Yes. After the free scan, you can purchase the full report for a one-time €29 payment.';
  if (question.includes('What does a website scan check')) return 'The scan checks measurable signals around SEO, technical quality, mobile, content, trust and conversion.';
  if (question.includes('only get a score')) return 'No. You also get context about the measured areas and practical points to address.';
  if (question.includes('start the scan for free')) return 'Yes. You only need the web address of your website to start the free scan.';
  if (question.includes('complete SEO audit')) return 'No. SiteCheck AI focuses on measurable signals from the fetched page and is not a replacement for a full human SEO audit.';
  if (question.includes('entire website')) return 'The scan analyzes the page you provide and does not claim to have checked pages it did not actually fetch.';
  if (question.includes('What can I improve')) return 'You get practical improvement points based on the signals found during the scan.';
  if (question.includes('What areas are analyzed')) return 'The analysis covers visible content, SEO signals, technical signals, mobile, contact paths and conversion signals, among other measurable areas.';
  if (question.includes('written for business owners')) return 'Yes. The results are designed to be understandable and actionable without unnecessary technical jargon.';
  if (question.includes('download the full report')) return 'Yes. After purchase, you can download the full report as a PDF.';
  if (question.includes('What data is measured')) return 'The scan uses only data that is actually available while fetching and checking the page you provide.';
  if (question.includes('difference between a scan and an audit')) return 'A scan provides a measurable first overview; a broader audit usually goes deeper and may also include human review.';
  if (question.includes('Which signals')) return 'Signals can include page titles, meta descriptions, headings, links, technical signals, speed-related signals and visible conversion signals.';
  if (question.includes('technical knowledge')) return 'No. The results are designed to explain technical signals in plain language.';
  if (question.includes('How do I start')) return 'Enter your website address and start the free scan.';
  if (question.includes('Does SiteCheck AI measure website speed')) return 'The scan checks measurable technical signals such as response time, page size and compression. It is not a replacement for a full Lighthouse or Core Web Vitals test.';
  if (question.includes('contact paths')) return 'Yes. The scan checks for visible contact signals and calls to action present on the fetched page.';
  if (question.includes('encourage more action')) return 'The scan can flag issues around calls to action, contact paths and trust, but it cannot guarantee a conversion increase.';
  return 'The scan is designed to make measurable website signals easier to understand and turn them into practical improvements.';
}

function SeoLandingPage() {
  const { locale } = useLanguage();
  const [location] = useLocation();
  const slug = location.split('/').filter(Boolean)[1] || '';
  const page = seoPages[slug]?.[locale] ?? seoPages['website-scan'][locale];

  return (
    <Localized>
      <main className="site-shell min-h-[100dvh]">
        <nav className="nav-wrap">
          <div className="page-frame flex items-center justify-between">
            <a className="brand-mark" href={locale === 'nl' ? '/nl' : '/en'}>
              <span className="brand-name">SiteCheck <span>AI</span></span>
            </a>
            <LanguageSwitcher />
          </div>
        </nav>
        <section className="hero">
          <div className="page-frame">
            <div className="reveal" style={{ maxWidth: '820px' }}>
              <div className="eyebrow">SiteCheck AI</div>
              <h1>{page.heading}</h1>
              <p className="hero-lede">{page.intro}</p>
              <div className="scan-actions">
                <a className="scan-button" href={locale === 'nl' ? '/nl' : '/en'}>Start gratis scan <ArrowRight /></a>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="page-frame">
            <div className="check-grid">
              {page.points.map((point) => (
                <article className="check-card" key={point}>
                  <div className="check-icon"><ClipboardCheck /></div>
                  <h2>{point}</h2>
                  <p>{locale === 'nl' ? 'SiteCheck AI controleert dit onderdeel op concrete signalen en maakt duidelijk wat je ermee kunt doen.' : 'SiteCheck AI checks this area for concrete signals and explains what you can do with the result.'}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="page-frame" style={{ maxWidth: '900px' }}>
            <div className="section-kicker">{locale === 'nl' ? 'Veelgestelde vragen' : 'Frequently asked questions'}</div>
            {page.questions.map((question) => (
              <article key={question} style={{ padding: '22px 0', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
                <h2 style={{ marginBottom: '8px' }}>{question}</h2>
                <p>{faqAnswer(question, locale)}</p>
              </article>
            ))}
          </div>
        </section>
        <footer className="footer">
          <div className="page-frame footer-inner"><span>© {new Date().getFullYear()} SiteCheck AI</span></div>
        </footer>
      </main>
    </Localized>
  );
}

function BlogPage() {
  const { locale } = useLanguage();
  const [location] = useLocation();
  const parts = location.split('/').filter(Boolean);
  const slug = parts[1] === 'blog' ? parts[2] : undefined;
  const article = slug ? getBlogArticle(slug) : undefined;
  const isIndex = !slug;
  const homePath = locale === 'nl' ? '/nl' : '/en';
  const blogPath = homePath + '/blog';

  return (
    <Localized>
      <main className="site-shell min-h-[100dvh]">
        <nav className="nav-wrap">
          <div className="page-frame flex items-center justify-between">
            <a className="brand-mark" href={homePath}><span className="brand-name">SiteCheck <span>AI</span></span></a>
            <div className="nav-actions"><a className="nav-note" href={blogPath}>{locale === 'nl' ? 'Kennisbank' : 'Guides'}</a><LanguageSwitcher /></div>
          </div>
        </nav>
        {isIndex ? (
          <>
            <section className="hero"><div className="page-frame"><div className="reveal" style={{ maxWidth: '820px' }}>
              <div className="eyebrow">SiteCheck AI</div>
              <h1>{locale === 'nl' ? 'Praktische kennis over websites, SEO en conversie.' : 'Practical guides about websites, SEO and conversion.'}</h1>
              <p className="hero-lede">{locale === 'nl' ? 'Heldere artikelen voor ondernemers die willen weten wat hun website beter kan doen.' : 'Clear guides for business owners who want to understand what their website can do better.'}</p>
              <div className="scan-actions"><a className="scan-button" href={homePath}>{locale === 'nl' ? 'Start gratis website scan' : 'Start free website scan'} <ArrowRight /></a></div>
            </div></div></section>
            <section className="section"><div className="page-frame"><div className="check-grid">
              {blogArticles.map((item) => <article className="check-card" key={item.slug}><div className="check-icon"><ClipboardCheck /></div><h2>{item[locale].title}</h2><p>{item[locale].description}</p><a className="text-link" href={blogPath + '/' + item.slug}>{locale === 'nl' ? 'Lees artikel' : 'Read article'} <ArrowRight /></a></article>)}
            </div></div></section>
          </>
        ) : article ? (
          <article><section className="hero"><div className="page-frame"><div className="reveal" style={{ maxWidth: '850px' }}>
            <div className="eyebrow"><a href={blogPath}>{locale === 'nl' ? 'Kennisbank' : 'Guides'}</a></div>
            <h1>{article[locale].title}</h1><p className="hero-lede">{article[locale].intro}</p>
          </div></div></section>
          <section className="section"><div className="page-frame" style={{ maxWidth: '820px' }}>
            <div style={{ marginBottom: '32px', fontSize: '0.95rem', opacity: 0.72 }}><a href={homePath}>SiteCheck AI</a> / <a href={blogPath}>{locale === 'nl' ? 'Kennisbank' : 'Guides'}</a> / {article[locale].title}</div>
            {article[locale].sections.map((section) => <section key={section.heading} style={{ marginBottom: '38px' }}><h2 className="section-title" style={{ fontSize: '1.65rem', marginBottom: '14px' }}>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p className="section-intro" key={paragraph} style={{ marginBottom: '12px' }}>{paragraph}</p>)}</section>)}
            <div className="closing-box" style={{ marginTop: '48px' }}><h2>{article[locale].cta}</h2><p>{locale === 'nl' ? 'Bekijk direct welke signalen op jouw website aandacht verdienen.' : 'See which signals on your website deserve attention.'}</p><a className="scan-button" href={homePath}>{locale === 'nl' ? 'Start gratis scan' : 'Start free scan'} <ArrowRight /></a></div>
          </div></section></article>
        ) : <section className="hero"><div className="page-frame"><h1>{locale === 'nl' ? 'Artikel niet gevonden' : 'Article not found'}</h1></div></section>}
        <footer className="footer"><div className="page-frame footer-inner"><span>© {new Date().getFullYear()} SiteCheck AI</span><span>{locale === 'nl' ? 'Praktische kennis voor ondernemers' : 'Practical knowledge for business owners'}</span></div></footer>
      </main>
    </Localized>
  );
}
function Router() {
  const { locale } = useLanguage();
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/nl" component={Home} />
        <Route path="/en" component={Home} />
        <Route path="/nl/blog" component={BlogPage} />
        <Route path="/en/blog" component={BlogPage} />
        <Route path="/nl/blog/:slug" component={BlogPage} />
        <Route path="/en/blog/:slug" component={BlogPage} />
        <Route path="/nl/:slug" component={SeoLandingPage} />
        <Route path="/en/:slug" component={SeoLandingPage} />
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
    <LanguageProvider>
      <SeoHead />
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
