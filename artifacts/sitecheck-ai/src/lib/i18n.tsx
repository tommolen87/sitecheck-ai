import { cloneElement, createContext, isValidElement, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "nl" | "en";

const translations: Record<string, string> = {
  "Voor ondernemers met een helder verhaal": "For businesses with a clear story",
  "Een nuchtere blik op je website": "A clear-eyed look at your website",
  "Hoe goed presteert": "How well is",
  "jouw website?": "your website performing?",
  "SiteCheck AI analyseert je website en geeft praktische verbeteradviezen. Geen technisch rapport waar je doorheen moet ploegen, maar duidelijke handvatten voor de volgende stap.": "SiteCheck AI analyzes your website and gives you practical improvement advice. No technical report to wade through, but clear guidance for what to do next.",
  "Eerlijk over wat we weten": "Honest about what we know",
  "Je gegevens blijven privé": "Your data stays private",
  "Start met je website": "Start with your website",
  "Gratis eerste scan": "Free first scan",
  "Website-adres": "Website address",
  "Vul het adres van je website in.": "Enter your website address.",
  "Gebruik een volledig webadres, bijvoorbeeld https://jouwbedrijf.nl": "Use a complete web address, for example https://yourcompany.com",
  "Start gratis scan": "Start free scan",
  "Volledig rapport — €29": "Full report — €29",
  "SiteCheck AI analyseert...": "SiteCheck AI is analyzing...",
  "Volledig rapport voorbereiden...": "Preparing full report...",
  "Gratis scan:": "Free scan:",
  "krijg inzicht in je website.": "get insight into your website.",
  "Volledig rapport:": "Full report:",
  "krijg alle verbeterpunten en concrete AI-voorstellen voor €29, eenmalig.": "get all improvement points and concrete AI suggestions for a one-time payment of €29.",
  "Er ging iets mis bij het aanmelden van je scan. Probeer het opnieuw.": "Something went wrong while starting your scan. Please try again.",
  "SiteCheck AI analyseert je website": "SiteCheck AI is analyzing your website",
  "Je scan staat klaar": "Your scan is ready",
  "We halen de homepage op en controleren alleen wat we daadwerkelijk kunnen meten.": "We fetch the homepage and only check what we can actually measure.",
  "We hebben je aanvraag ontvangen. De analyse wordt op de achtergrond voorbereid.": "We received your request. The analysis is being prepared in the background.",
  "Aanvragen worden verwerkt": "Requests are being processed",
  "recente aanvraag": "recent request",
  "recente aanvragen": "recent requests",
  "Alleen je URL is nodig": "Only your URL is needed",
  "Geen vakjargon.": "No technical jargon.",
  "Wel zicht op wat je website voor je bedrijf kan doen.": "Just a clear view of what your website can do for your business.",
  "Zo werkt het": "How it works",
  "Van twijfel naar een volgende stap.": "From uncertainty to a clear next step.",
  "Een website hoeft niet perfect te zijn. Je wilt vooral weten waar een kleine verbetering het meeste oplevert.": "A website does not have to be perfect. You mainly want to know where a small improvement can make the biggest difference.",
  "Je deelt je URL": "You share your URL",
  "Geen account, vragenlijst of technische voorbereiding. Alleen het adres van je website.": "No account, questionnaire or technical preparation. Just your website address.",
  "Wij nemen rustig de tijd": "We take the time to look properly",
  "De scan wordt ingepland. We doen niet alsof een snelle blik hetzelfde is als goed kijken.": "The scan is queued. We do not pretend that a quick glance is the same as taking a proper look.",
  "Je krijgt richting": "You get direction",
  "Praktische aanbevelingen waarmee je zelf, of samen met je webbouwer, verder kunt.": "Practical recommendations you can use yourself or work through with your web developer.",
  "Waar we op letten": "What we look at",
  "Helder.": "Clear.",
  "De beste aanbeveling is er één die je morgen begrijpt én kunt uitvoeren.": "The best recommendation is one you understand tomorrow and can actually put into practice.",
  "Een brede blik": "A broad view",
  "Niet alleen de buitenkant.": "Not just the surface.",
  "Een goede website voelt vanzelfsprekend voor je bezoeker. Daarom kijken we naar de samenhang, niet naar één los vinkje.": "A good website should feel natural to your visitor. That is why we look at the bigger picture, not one isolated checkbox.",
  "De eerste indruk": "First impression",
  "Is in één oogopslag duidelijk wat je doet, voor wie en waarom iemand verder zou kijken?": "Is it immediately clear what you do, who it is for, and why someone should keep looking?",
  "De route naar contact": "The path to contact",
  "Kan een geïnteresseerde zonder zoeken de juiste volgende stap zetten?": "Can an interested visitor take the right next step without having to search?",
  "Vertrouwen in details": "Trust in the details",
  "Klopt het verhaal ook in de kleine dingen die bepalen of een bezoeker blijft?": "Does the story also hold up in the small details that determine whether a visitor stays?",
  "Maak van je website een betere eerste kennismaking.": "Turn your website into a better first impression.",
  "Begin met wat je al hebt. SiteCheck AI helpt je kiezen wat daarna de moeite waard is.": "Start with what you already have. SiteCheck AI helps you decide what is worth improving next.",
  "Een rustige check voor ambitieuze ondernemers": "A calm check for ambitious businesses",
  "Volledig verbeterplan": "Full improvement plan",
  "Van inzicht naar": "From insight to",
  " concrete actie.": " concrete action.",
  "Je gratis scan laat zien waar de belangrijkste problemen en kansen op je website zitten. Met het volledige rapport krijg je per gevonden punt een concrete aanpak, zodat je weet wat je als eerste kunt verbeteren.": "Your free scan shows where the main problems and opportunities are on your website. With the full report, you get a concrete approach for every finding, so you know what to improve first.",
  "eenmalig · geen abonnement": "one-time payment · no subscription",
  "Alle gevonden verbeterpunten": "All identified improvement points",
  "Concrete AI-voorstellen per punt": "Concrete AI suggestions for each point",
  "Impact en moeilijkheid per punt": "Impact and difficulty for each point",
  "Een praktisch actieplan op volgorde": "A practical prioritized action plan",
  "Betaling kon niet worden gestart.": "Payment could not be started.",
  "Bekijk mijn verbeterplan — €29": "View my improvement plan — €29",
  "Terug naar mijn scan": "Back to my scan",
  "Nieuwe scan": "New scan",
  "Scan afgerond": "Scan complete",
  "Een helder beeld van": "A clear picture of",
  "je website.": "your website.",
  "Gescand op": "Scanned on",
  "Totale score": "Overall score",
  "Een stevige basis": "A solid foundation",
  "Ruimte om te groeien": "Room to improve",
  "Tijd voor aandacht": "Needs attention",
  "Gemeten kwaliteit": "Measured quality",
  "Totale meetdekking": "Overall coverage",
  "onderdelen zijn gecontroleerd.": "areas were checked.",
  "Niet-gemeten onderdelen tellen niet positief mee; een volledige score is pas mogelijk wanneer alle onderdelen meetbaar zijn.": "Unmeasured areas do not count positively; a full score is only possible when all areas can be measured.",
  "Waar staat je website?": "How is your website doing?",
  "De zeven invalshoeken": "The seven areas",
  "Alleen onderdelen die de scan daadwerkelijk heeft beoordeeld krijgen een score.": "Only areas the scan actually assessed receive a score.",
  "Kwaliteit gemeten:": "Measured quality:",
  "Uitgevoerd:": "Executed:",
  "Meetdekking:": "Coverage:",
  "Gewicht totaal:": "Total weight:",
  "belangrijke": "important",
  "check kon": "check could not be",
  "checks konden": "checks could not be",
  "we niet betrouwbaar beoordelen.": "reliably assessed.",
  "niet gecheckt": "not checked",
  "Bekijk score-opbouw": "View score breakdown",
  "scoremeting": "score measurement",
  "scoremetingen": "score measurements",
  "uitgevoerd": "executed",
  "geslaagd": "passed",
  "niet geslaagd": "not passed",
  "onbekend": "unknown",
  "Weging hoog": "Weight high",
  "Weging middel": "Weight medium",
  "Weging laag": "Weight low",
  "Uitstekend": "Excellent",
  "Goed": "Good",
  "Redelijk": "Fair",
  "Verbetering nodig": "Needs improvement",
  "Veel verbetering nodig": "Significant improvement needed",
  "Sterke punten": "Strengths",
  "Wat gaat er al goed?": "What is already working well?",
  "Deze onderdelen van je website kwamen goed uit de scan.": "These areas of your website performed well in the scan.",
  "Volledig rapport": "Full report",
  "Download je volledige rapport": "Download your full report",
  "Alle scores, sterke punten, verbeterpunten en het actieplan gebundeld in één PDF.": "All scores, strengths, improvement points and the action plan bundled into one PDF.",
  "PDF downloaden": "Download PDF",
  "Van inzicht naar actie": "From insight to action",
  "AI-analyse op basis van de gevonden websitegegevens": "AI analysis based on the website data we found",
  "De belangrijkste aandachtspunten.": "The key areas to address.",
  "De AI interpreteert uitsluitend gegevens die onze scanner heeft verzameld. AI-beoordelingen vervangen geen menselijke website-audit.": "The AI interprets only data collected by our scanner. AI assessments do not replace a human website audit.",
  "De aanbevelingen hieronder volgen direct uit de bevindingen van deze scan.": "The recommendations below follow directly from the findings of this scan.",
  "Deze scan rapporteerde geen aandachtspunten.": "This scan reported no issues.",
  "Praktisch actieplan": "Practical action plan",
  "Dit zou ik als eerste aanpakken.": "This is what I would tackle first.",
  "We hebben de belangrijkste bevindingen van deze scan op volgorde gezet, zodat je direct weet waar je kunt beginnen.": "We have put the most important findings from this scan in order, so you know where to start.",
  "Makkelijk": "Easy",
  "Gemiddeld": "Medium",
  "Moeilijk": "Hard",
  "Hoog": "High",
  "Middel": "Medium",
  "Laag": "Low",
  "Impact": "Impact",
  "Moeilijkheid": "Difficulty",
  "Vertrouwen": "Confidence",
  "Gebaseerd op:": "Based on:",
  "We laten je niet achter met alleen een score.": "We do not leave you with just a score.",
  "Ontdek alle gevonden verbeterpunten op je website, inclusief concrete AI-voorstellen, impact, moeilijkheid en een praktisch actieplan op volgorde.": "Discover all identified improvement points, including concrete AI suggestions, impact, difficulty and a practical prioritized action plan.",
  "Bekijk alle verbeterpunten — €29": "View all improvement points — €29",
  "De meting achter de score": "The measurement behind the score",
  "Wat de scan zag": "What the scan saw",
  "Dit zijn meetbare signalen uit de opgehaalde pagina. Ze zijn geen interpretatie of belofte.": "These are measurable signals from the fetched page. They are not an interpretation or promise.",
  "Contactsignalen": "Contact signals",
  "Geen contactsignalen gerapporteerd.": "No contact signals reported.",
  "Technische signalen": "Technical signals",
  "Geen technische signalen gerapporteerd.": "No technical signals reported.",
  "Geen technische voorkennis nodig": "No technical knowledge required",
  "Begrippen eenvoudig uitgelegd": "Key terms explained simply",
  "Kom je een term tegen die je niet kent? Hier leggen we de belangrijkste begrippen uit.": "Come across a term you do not know? Here we explain the most important terms.",
  "Transparant over de grenzen": "Transparent about the limits",
  "Dit konden we niet controleren.": "What we could not check",
  "Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.": "No unchecked areas were reported for this scan.",
  "Scan niet beschikbaar": "Scan unavailable",
  "Deze scan kon niet worden afgerond.": "This scan could not be completed.",
  "Geen resultaat gevonden.": "No result found.",
  "Er is nog geen analyse beschikbaar.": "No analysis is available yet.",
  "Dit scanadres klopt niet.": "This scan address is invalid.",
  "We kunnen zonder een geldig scan-ID geen resultaat ophalen.": "We cannot retrieve a result without a valid scan ID.",
  "We konden deze scan niet ophalen.": "We could not retrieve this scan.",
  "De scan kon niet worden opgehaald. Probeer het opnieuw.": "The scan could not be retrieved. Please try again.",
  "De scan is afgerond, maar de API heeft geen analyse meegestuurd. Probeer deze pagina later opnieuw.": "The scan is complete, but the API did not return an analysis. Please try this page again later.",
  "Even geduld": "Please wait",
  "SiteCheck AI analyseert": "SiteCheck AI is analyzing",
  "de website.": "the website.",
  "We halen de pagina op en kijken rustig naar wat er daadwerkelijk te controleren is. Deze pagina ververst automatisch.": "We fetch the page and carefully check what can actually be measured. This page refreshes automatically.",
  "Terug naar een nieuwe scan": "Back to a new scan",
  "Sterk punt": "Strength",
  "Wat we zagen": "What we found",
  "Waarom dit belangrijk is": "Why this matters",
  "Wat je concreet kunt verbeteren": "What you can improve",
  "Concreet voorstel": "Concrete suggestion",
  "Aanbeveling": "Recommendation",
  "Verbeterpunt": "Improvement point",
  "Geen technische vaktaal.": "No technical jargon.",
  "Vindbaarheid in Google": "Visibility in Google",
  "Conversie": "Conversion",
  "Mobiel": "Mobile",
  "Techniek & snelheid": "Technology & speed",
  "Content": "Content",
  "Vertrouwen": "Trust",
  "Lokale vindbaarheid": "Local visibility",
  "Paginatitel": "Page title",
  "Lengte paginatitel": "Page title length",
  "Korte omschrijving voor Google": "Short description for Google",
  "Lengte omschrijving voor Google": "Description length for Google",
  "Hoofdtitels van de pagina": "Main page headings",
  "Alle koppen": "All headings",
  "Zichtbare tekens": "Visible characters",
  "Interne links": "Internal links",
  "Externe links": "External links",
  "Afbeeldingen": "Images",
  "Afbeeldingen met alt-tekst": "Images with alt text",
  "Actieknoppen": "Action buttons",
  "Belangrijkste actieknop": "Primary action button",
  "Voorkeursadres van de pagina": "Preferred page address",
  "Instructies voor zoekmachines": "Search engine instructions",
  "Pagina-overzicht voor zoekmachines": "Page overview for search engines",
  "Voorvertoning bij delen": "Sharing preview",
  "Serverantwoord": "Server response",
  "Responstijd": "Response time",
  "Paginagrootte": "Page size",
  "Gegevenscompressie": "Data compression",
  "Niet aangetroffen": "Not found",
  "Aangetroffen": "Found",
  "Bereikbaar": "Available",
  "Niet gevonden": "Not found",
  "Ja": "Yes",
  "Nee": "No",
  "Niet vastgesteld": "Not determined",
  "Begrippen eenvoudig uitgelegd": "Key terms explained simply",
  "Alt-tekst": "Alt text",
  "Google-meting voor snelheid en prestaties": "Google speed and performance measurement",
  "Een automatische meting van Google die onder andere kijkt naar de prestaties van een pagina op een mobiel apparaat.": "An automated Google measurement that looks at how a page performs on a mobile device, among other things.",
  "E-mailadres gevonden": "Email address found",
  "Telefoonnummer gevonden": "Phone number found",
  "Adres gevonden": "Address found",
  "Reviews of testimonials gevonden": "Reviews or testimonials found",
};

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function translateText(value: string, locale: Locale): string {
  if (locale === "nl") return value;
  const exact = translations[normalize(value)];
  if (exact) {
    if (value.trim() === value) return exact;
    return value.replace(normalize(value), exact);
  }

  return value
    .replace(/\bGeslaagd\b/g, "Passed")
    .replace(/\bNiet geslaagd\b/g, "Not passed")
    .replace(/\bOnbekend\b/g, "Unknown")
    .replace(/\bHoog\b/g, "High")
    .replace(/\bMiddel\b/g, "Medium")
    .replace(/\bLaag\b/g, "Low")
    .replace(/\bMakkelijk\b/g, "Easy")
    .replace(/\bGemiddeld\b/g, "Medium")
    .replace(/\bMoeilijk\b/g, "Hard")
    .replace(/\bImpact\b/g, "Impact")
    .replace(/\bMoeilijkheid\b/g, "Difficulty")
    .replace(/\bVertrouwen\b/g, "Confidence")
    .replace(/\bWeging\b/g, "Weight")
    .replace(/\bvan\b/g, "of")
    .replace(/\buitgevoerd\b/g, "executed")
    .replace(/\bscoremeting(en)?\b/g, "score measurement$1")
    .replace(/\bNiet gemeten\b/g, "Not measured")
    .replace(/\bniet gecheckt\b/g, "not checked")
    .replace(/\bSterke punten\b/g, "Strengths")
    .replace(/\bVerbeterpunt\b/g, "Improvement point")
    .replace(/\bGebaseerd op:\b/g, "Based on:")
    .replace(/\bGescand op\b/g, "Scanned on");
}

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "nl";

  // Language-specific URLs must always determine the locale.
  // This prevents localStorage/browser language from making /nl pages render in English
  // (or /en pages render in Dutch), which is especially important for SEO crawlers.
  const pathname = window.location.pathname;
  if (pathname === "/nl" || pathname.startsWith("/nl/")) return "nl";
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";

  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (queryLocale === "nl" || queryLocale === "en") {
    window.localStorage.setItem("sitecheck-language", queryLocale);
    return queryLocale;
  }

  const saved = window.localStorage.getItem("sitecheck-language");
  if (saved === "nl" || saved === "en") return saved;
  const browserLanguage = navigator.language.toLowerCase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (browserLanguage.startsWith("nl") || timezone === "Europe/Amsterdam" || timezone === "Europe/Brussels") {
    return "nl";
  }
  return "en";
}

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sitecheck-language", next);
      const path = window.location.pathname;
      if (path === "/" || path === "/nl" || path === "/en" || path === "/nl/" || path === "/en/") {
        window.history.pushState({}, "", next === "nl" ? "/nl" : "/en");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else if (path.startsWith("/nl/") || path.startsWith("/en/")) {
        const slug = path.split("/").filter(Boolean).slice(1).join("/");
        window.history.pushState({}, "", `/${next}/${slug}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="language-switcher" aria-label="Language">
      <button type="button" className={locale === "nl" ? "active" : ""} onClick={() => setLocale("nl")}>NL</button>
      <span aria-hidden="true">|</span>
      <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button>
    </div>
  );
}

function localizeNode(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === "string") return translateText(node, locale);
  if (Array.isArray(node)) return node.map((child) => localizeNode(child, locale));
  if (!isValidElement(node)) return node;
  const props = node.props as { children?: ReactNode };
  if (props.children === undefined) return node;
  return cloneElement(node, { children: localizeNode(props.children, locale) });
}

export function Localized({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  return <>{localizeNode(children, locale)}</>;
}

export function useLocalizedText(value: string): string {
  const { locale } = useLanguage();
  return translateText(value, locale);
}
