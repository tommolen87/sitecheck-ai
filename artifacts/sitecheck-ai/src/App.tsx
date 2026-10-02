import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { LanguageProvider, LanguageSwitcher, Localized, useLanguage } from '@/lib/i18n';
import { getScanAccessToken, setScanAccessToken } from '@/lib/scan-access';
import ScanResults from '@/pages/scan-results';
import Upgrade from '@/pages/upgrade';
import LegalPage from '@/pages/legal';
import { blogArticles, getBlogArticle } from '@/lib/blog-data';
import {
  getGetScanQueryKey,
  useCreateScan,
  useGetScan,
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
  'website-vindbaarheid-google': {
    nl: { title: 'Website beter vindbaar in Google | SiteCheck AI', description: 'Ontdek waarom je website slecht vindbaar kan zijn in Google en welke SEO-, content- en technische signalen je kunt verbeteren.', heading: 'Website beter vindbaar maken in Google', intro: 'Wil je dat meer mensen je website via Google vinden? Controleer eerst de basis: indexatie, pagina-inhoud, titels, interne links en technische bereikbaarheid. SiteCheck AI helpt je om zichtbare aandachtspunten snel te vinden.', points: ['Indexatie en technische bereikbaarheid', 'Content, titels en zoekintentie', 'Interne links en belangrijke pagina’s'], questions: ['Waarom is mijn website slecht vindbaar in Google?', 'Hoe kan ik mijn website beter vindbaar maken?', 'Kan een website scan helpen bij SEO?'] },
    en: { title: 'How to make your website more visible on Google | SiteCheck AI', description: 'Find out why your website may have low Google visibility and which SEO, content and technical signals you can improve.', heading: 'Make your website more visible on Google', intro: 'Want more people to find your website through Google? Start with the basics: indexing, page content, titles, internal links and technical accessibility. SiteCheck AI helps you find visible areas that need attention.', points: ['Indexing and technical accessibility', 'Content, titles and search intent', 'Internal links and important pages'], questions: ['Why is my website hard to find on Google?', 'How can I improve my website visibility?', 'Can a website scan help with SEO?'] },
  },
  'website-seo-verbeteren': {
    nl: { title: 'Website SEO verbeteren: praktische aanpak | SiteCheck AI', description: 'Leer hoe je de SEO van je website stap voor stap verbetert met betere titels, content, interne links, techniek en zoekintentie.', heading: 'Website SEO verbeteren: begin met de basis', intro: 'SEO verbeteren hoeft niet te betekenen dat je alles tegelijk aanpast. Begin met de pagina’s die belangrijk zijn voor je bedrijf en werk van technische basis naar content en interne structuur.', points: ['Sterke titels, koppen en content', 'Technische SEO en indexatie', 'Interne links en duidelijke paginastructuur'], questions: ['Waar begin ik met SEO verbeteren?', 'Welke SEO-fouten kan een website scan vinden?', 'Moet ik iedere pagina optimaliseren?'] },
    en: { title: 'Improve website SEO: a practical approach | SiteCheck AI', description: 'Learn how to improve website SEO step by step with better titles, content, internal links, technical foundations and search intent.', heading: 'Improve website SEO: start with the basics', intro: 'Improving SEO does not mean changing everything at once. Start with the pages that matter most to your business and work from technical foundations to content and internal structure.', points: ['Strong titles, headings and content', 'Technical SEO and indexing', 'Internal links and clear site structure'], questions: ['Where should I start with SEO?', 'What SEO issues can a website scan find?', 'Do I need to optimize every page?'] },
  },
  'website-conversie-verbeteren': {
    nl: { title: 'Website conversie verbeteren | SiteCheck AI', description: 'Ontdek praktische manieren om websiteconversie te verbeteren met duidelijke CTA’s, vertrouwen, contactmogelijkheden en minder drempels.', heading: 'Website conversie verbeteren', intro: 'Meer bezoekers is niet het enige doel. Je website moet bezoekers ook helpen om contact op te nemen, een offerte aan te vragen, een afspraak te maken of een andere gewenste actie uit te voeren.', points: ['Duidelijke actieknoppen en vervolgstappen', 'Vertrouwen, bewijs en duidelijke waarde', 'Contact en formulieren zonder onnodige drempels'], questions: ['Waarom converteert mijn website slecht?', 'Wat kan ik direct verbeteren voor meer conversie?', 'Kan een scan conversieproblemen signaleren?'] },
    en: { title: 'Improve website conversion | SiteCheck AI', description: 'Discover practical ways to improve website conversion with clearer calls to action, trust signals, contact paths and fewer barriers.', heading: 'Improve website conversion', intro: 'More visitors are not the only goal. Your website should also help visitors contact you, request a quote, book an appointment or take another desired action.', points: ['Clear calls to action and next steps', 'Trust, proof and a clear value proposition', 'Contact paths and forms without unnecessary friction'], questions: ['Why is my website converting poorly?', 'What can I improve immediately?', 'Can a website scan flag conversion issues?'] },
  },
  'website-check-makelaar': {
    nl: { title: 'Website check voor makelaars | SiteCheck AI', description: 'Controleer de website van je makelaarskantoor op vindbaarheid, vertrouwen, contactmogelijkheden en conversie.', heading: 'Website check voor makelaars', intro: 'Een makelaarswebsite moet niet alleen woningen tonen, maar bezoekers ook snel vertrouwen geven en naar een bezichtiging, contactmoment of waardebepaling leiden. Deze check kijkt naar de belangrijkste signalen.', points: ['Vindbaarheid van woningen en diensten', 'Vertrouwen, bewijs en lokale informatie', 'Contact, bezichtiging en duidelijke actieknoppen'], questions: ['Waar moet een makelaarswebsite op letten?', 'Kan een scan de conversie van een makelaarswebsite controleren?', 'Hoe verbeter ik de vindbaarheid van mijn makelaarskantoor?'] },
    en: { title: 'Website check for real estate agents | SiteCheck AI', description: 'Check a real estate website for search visibility, trust, contact paths and conversion signals.', heading: 'Website check for real estate agents', intro: 'A real estate website should do more than display properties. It should quickly build trust and guide visitors toward a viewing, contact request or valuation.', points: ['Search visibility for properties and services', 'Trust, proof and local information', 'Contact, viewing and clear calls to action'], questions: ['What should a real estate website improve?', 'Can a scan check conversion signals?', 'How can a real estate agency improve search visibility?'] },
  },
  'website-check-hovenier': {
    nl: { title: 'Website check voor hoveniers | SiteCheck AI', description: 'Controleer de website van je hoveniersbedrijf op lokale vindbaarheid, vertrouwen, portfolio en contactmogelijkheden.', heading: 'Website check voor hoveniers', intro: 'Voor een hoveniersbedrijf begint een nieuwe aanvraag vaak met een lokale Google-zoekopdracht. Je website moet vervolgens direct laten zien wat je doet, waar je werkt en hoe iemand een offerte kan aanvragen.', points: ['Lokale vindbaarheid en diensten', 'Portfolio, reviews en vertrouwen', 'Offerte aanvragen en contact'], questions: ['Wat moet een hovenierswebsite duidelijk maken?', 'Hoe belangrijk is lokale vindbaarheid?', 'Hoe kan ik meer offerteaanvragen uit mijn website halen?'] },
    en: { title: 'Website check for landscapers | SiteCheck AI', description: 'Check a landscaping business website for local visibility, trust, portfolio and contact signals.', heading: 'Website check for landscapers', intro: 'For a landscaping business, a new enquiry often starts with a local Google search. Your website should immediately explain what you do, where you work and how visitors can request a quote.', points: ['Local visibility and services', 'Portfolio, reviews and trust', 'Quote requests and contact'], questions: ['What should a landscaping website explain?', 'How important is local search visibility?', 'How can a website generate more quote requests?'] },
  },
  'website-check-installatiebedrijf': {
    nl: { title: 'Website check voor installatiebedrijven | SiteCheck AI', description: 'Controleer de website van je installatiebedrijf op lokale SEO, diensten, vertrouwen, offerteaanvragen en techniek.', heading: 'Website check voor installatiebedrijven', intro: 'Bij installatiebedrijven zoeken potentiële klanten vaak gericht naar een dienst en een bedrijf in de buurt. Een goede website maakt snel duidelijk welke werkzaamheden je uitvoert, in welke regio en hoe iemand contact opneemt.', points: ['Diensten, regio en lokale vindbaarheid', 'Certificaten, projecten en vertrouwen', 'Offerteaanvraag en contactmogelijkheden'], questions: ['Hoe maak ik een installatiebedrijf beter vindbaar?', 'Welke informatie moet op de website staan?', 'Hoe maak ik van bezoekers meer offerteaanvragen?'] },
    en: { title: 'Website check for installation companies | SiteCheck AI', description: 'Check an installation company website for local SEO, services, trust, quote requests and technical signals.', heading: 'Website check for installation companies', intro: 'Potential customers often search specifically for a service and a nearby company. A strong website quickly explains what you do, where you work and how visitors can contact you.', points: ['Services, regions and local visibility', 'Certifications, projects and trust', 'Quote requests and contact paths'], questions: ['How can an installation company improve visibility?', 'What information should the website contain?', 'How can the website generate more quote requests?'] },
  },
  'website-check-restaurant': {
    nl: { title: 'Website check voor restaurants | SiteCheck AI', description: 'Controleer je restaurantwebsite op lokale vindbaarheid, menu, reserveren, mobiel gebruik en conversie.', heading: 'Website check voor restaurants', intro: 'Restaurantbezoekers willen snel weten waar je zit, wat er op het menu staat en hoe ze kunnen reserveren. Op mobiel moet die informatie zonder zoeken beschikbaar zijn.', points: ['Lokale vindbaarheid en locatie', 'Menu, openingstijden en vertrouwen', 'Reserveren en mobiel gebruik'], questions: ['Wat moet een restaurantwebsite direct tonen?', 'Hoe verbeter ik lokale vindbaarheid?', 'Hoe maak ik reserveren makkelijker via mijn website?'] },
    en: { title: 'Website check for restaurants | SiteCheck AI', description: 'Check a restaurant website for local visibility, menu, reservations, mobile usability and conversion.', heading: 'Website check for restaurants', intro: 'Restaurant visitors want to quickly find your location, menu and reservation options. On mobile, this information should be easy to access without searching.', points: ['Local visibility and location', 'Menu, opening hours and trust', 'Reservations and mobile experience'], questions: ['What should a restaurant website show first?', 'How can local visibility improve?', 'How can I make reservations easier?'] },
  },
  'free-website-audit': {
    nl: { title: 'Gratis website audit | SiteCheck AI', description: 'Doe een gratis website audit en ontdek SEO-, technische, mobiele en conversiepunten op je website.', heading: 'Gratis website audit', intro: 'Een website audit geeft je een overzicht van belangrijke signalen die invloed hebben op vindbaarheid, gebruikservaring en conversie. SiteCheck AI maakt de eerste controle begrijpelijk en praktisch.', points: ["SEO en technische basis","Mobiele gebruikservaring","Content, vertrouwen en conversie"], questions: ["Wat is een gratis website audit?","Wat controleert een website audit?","Kan ik de audit gratis starten?"] },
    en: { title: 'Free Website Audit | SiteCheck AI', description: 'Run a free website audit and find SEO, technical, mobile and conversion issues on your website.', heading: 'Free website audit', intro: 'A website audit gives you a practical overview of signals that can affect search visibility, user experience and conversion. SiteCheck AI turns the first check into clear, actionable findings.', points: ["SEO and technical foundations","Mobile user experience","Content, trust and conversion"], questions: ["What is a free website audit?","What does a website audit check?","Can I start the audit for free?"] },
  },
  'ai-website-audit': {
    nl: { title: 'AI website audit | SiteCheck AI', description: 'Gebruik AI om je website te analyseren en ontdek concrete verbeterpunten voor SEO, content, techniek en conversie.', heading: 'AI website audit', intro: 'SiteCheck AI combineert meetbare websitegegevens met AI om gevonden aandachtspunten te vertalen naar begrijpelijke verbeteradviezen.', points: ["AI-analyse op echte websitegegevens","SEO, content en techniek","Concrete verbeteradviezen"], questions: ["Wat is een AI website audit?","Gebruikt de AI echte websitegegevens?","Krijg ik concrete verbeterpunten?"] },
    en: { title: 'AI Website Audit | SiteCheck AI', description: 'Use AI to analyze your website and find practical improvements for SEO, content, technical quality and conversion.', heading: 'AI website audit', intro: 'SiteCheck AI combines measurable website data with AI to turn real findings into clear, practical improvement recommendations.', points: ["AI analysis based on website data","SEO, content and technical signals","Practical improvement recommendations"], questions: ["What is an AI website audit?","Does the AI use real website data?","Do I get practical improvement points?"] },
  },
  'website-seo-checker': {
    nl: { title: 'Website SEO checker | SiteCheck AI', description: 'Controleer je website op belangrijke SEO-signalen en ontdek wat je kunt verbeteren voor zoekmachines.', heading: 'Website SEO checker', intro: 'Een SEO checker helpt je snel zien welke zichtbare onderdelen van je pagina aandacht verdienen. SiteCheck AI vertaalt de controle naar praktische verbeterpunten.', points: ["Titels en metabeschrijvingen","Koppen en contentstructuur","Links en technische signalen"], questions: ["Wat controleert een website SEO checker?","Is de SEO checker gratis?","Krijg ik verbeteradviezen?"] },
    en: { title: 'Website SEO Checker | SiteCheck AI', description: 'Check important SEO signals on your website and find practical improvements for search visibility.', heading: 'Website SEO checker', intro: 'An SEO checker helps you quickly identify visible areas of a page that deserve attention. SiteCheck AI turns the findings into practical improvement points.', points: ["Titles and meta descriptions","Headings and content structure","Links and technical signals"], questions: ["What does a website SEO checker check?","Is the SEO checker free?","Do I get improvement recommendations?"] },
  },
  'website-performance-check': {
    nl: { title: 'Website performance check | SiteCheck AI', description: 'Controleer technische prestaties van je website en ontdek signalen rond snelheid, paginagrootte en mobiele ervaring.', heading: 'Website performance check', intro: 'Een performance check laat zien welke technische signalen aandacht verdienen. SiteCheck AI kijkt naar meetbare gegevens die tijdens de scan beschikbaar zijn.', points: ["Responstijd en paginagrootte","Compressie en technische signalen","Mobiele ervaring"], questions: ["Wat is een website performance check?","Meet SiteCheck AI website snelheid?","Welke prestatiesignalen worden gecontroleerd?"] },
    en: { title: 'Website Performance Check | SiteCheck AI', description: 'Check website performance and find measurable signals around speed, page size and mobile experience.', heading: 'Website performance check', intro: 'A performance check helps identify technical signals that deserve attention. SiteCheck AI focuses on measurable data available during the scan.', points: ["Response time and page size","Compression and technical signals","Mobile experience"], questions: ["What is a website performance check?","Does SiteCheck AI measure website speed?","Which performance signals are checked?"] },
  },
  'website-ux-check': {
    nl: { title: 'Website UX check | SiteCheck AI', description: 'Controleer je website op gebruikservaring, duidelijkheid, navigatie, contact en de route naar actie.', heading: 'Website UX check', intro: 'Een goede website maakt de volgende stap vanzelfsprekend. SiteCheck AI controleert zichtbare signalen die de gebruikservaring en duidelijkheid beïnvloeden.', points: ["Duidelijke eerste indruk","Navigatie en contact","Actie en gebruiksgemak"], questions: ["Wat controleert een UX check?","Kan een scan gebruikservaring beoordelen?","Krijg ik concrete verbeterpunten?"] },
    en: { title: 'Website UX Check | SiteCheck AI', description: 'Check your website for user experience, clarity, navigation, contact paths and calls to action.', heading: 'Website UX check', intro: 'A good website makes the next step feel natural. SiteCheck AI checks visible signals that affect clarity and the user journey.', points: ["Clear first impression","Navigation and contact paths","Calls to action and usability"], questions: ["What does a UX check cover?","Can a scan assess user experience?","Do I get practical improvements?"] },
  },
  'website-mobile-check': {
    nl: { title: 'Website mobile check | SiteCheck AI', description: 'Controleer hoe je website op mobiel presteert en ontdek belangrijke verbeterpunten voor mobiele bezoekers.', heading: 'Website mobile check', intro: 'Omdat veel bezoekers een website op hun telefoon bekijken, is een duidelijke mobiele ervaring belangrijk. SiteCheck AI controleert beschikbare mobiele en technische signalen.', points: ["Mobiele structuur","Leesbaarheid en content","Technische mobiele signalen"], questions: ["Wat controleert een mobile website check?","Is mobiel belangrijk voor een website?","Kan ik mijn mobiele website gratis controleren?"] },
    en: { title: 'Mobile Website Check | SiteCheck AI', description: 'Check your website for mobile usability and find practical improvements for visitors on phones.', heading: 'Mobile website check', intro: 'Because many visitors use a phone, a clear mobile experience matters. SiteCheck AI checks available mobile and technical signals.', points: ["Mobile structure","Readability and content","Technical mobile signals"], questions: ["What does a mobile website check cover?","Why does mobile usability matter?","Can I check my mobile website for free?"] },
  },
  'website-accessibility-check': {
    nl: { title: 'Website toegankelijkheid check | SiteCheck AI', description: 'Controleer zichtbare toegankelijkheidssignalen op je website en ontdek waar bezoekers mogelijk drempels ervaren.', heading: 'Website toegankelijkheid check', intro: 'Toegankelijkheid gaat over websites die voor zoveel mogelijk mensen bruikbaar zijn. SiteCheck AI kan zichtbare signalen controleren, maar vervangt geen volledige WCAG-audit.', points: ["Semantische structuur","Leesbaarheid en bediening","Zichtbare toegankelijkheidssignalen"], questions: ["Wat is een website toegankelijkheid check?","Controleert SiteCheck AI WCAG volledig?","Welke toegankelijkheidssignalen worden bekeken?"] },
    en: { title: 'Website Accessibility Check | SiteCheck AI', description: 'Check visible accessibility signals on your website and find areas where visitors may face barriers.', heading: 'Website accessibility check', intro: 'Accessibility is about making websites usable for as many people as possible. SiteCheck AI can check visible signals but does not replace a full WCAG audit.', points: ["Semantic structure","Readability and interaction","Visible accessibility signals"], questions: ["What is a website accessibility check?","Does SiteCheck AI perform a full WCAG audit?","Which accessibility signals are checked?"] },
  },
  'website-trust-check': {
    nl: { title: 'Website vertrouwen check | SiteCheck AI', description: 'Controleer of je website snel vertrouwen opbouwt met duidelijke informatie, bewijs, contactmogelijkheden en een professionele eerste indruk.', heading: 'Website vertrouwen check', intro: 'Bezoekers beslissen snel of een website betrouwbaar aanvoelt. SiteCheck AI kijkt naar zichtbare signalen die bijdragen aan duidelijkheid en vertrouwen.', points: ["Duidelijke waardepropositie","Bewijs en contactinformatie","Professionele eerste indruk"], questions: ["Hoe controleer je vertrouwen op een website?","Welke vertrouwenssignalen worden bekeken?","Kan een website scan vertrouwen beoordelen?"] },
    en: { title: 'Website Trust Check | SiteCheck AI', description: 'Check whether your website builds trust with clear information, proof, contact details and a professional first impression.', heading: 'Website trust check', intro: 'Visitors quickly decide whether a website feels credible. SiteCheck AI checks visible signals that support clarity and trust.', points: ["Clear value proposition","Proof and contact information","Professional first impression"], questions: ["How do you check website trust?","Which trust signals are checked?","Can a website scan assess trust signals?"] },
  },
  'website-conversion-audit': {
    nl: { title: 'Website conversion audit | SiteCheck AI', description: 'Ontdek welke zichtbare onderdelen van je website conversie kunnen ondersteunen: CTA\'s, contact, vertrouwen en vervolgstappen.', heading: 'Website conversion audit', intro: 'Een conversie-audit kijkt niet alleen naar bezoekersaantallen, maar naar de route die een bezoeker kan volgen naar contact, aankoop of een andere gewenste actie.', points: ["CTA's en vervolgstappen","Contact en formulieren","Vertrouwen en waarde"], questions: ["Wat is een website conversion audit?","Welke conversiesignalen controleert de scan?","Kan een scan meer conversie garanderen?"] },
    en: { title: 'Website Conversion Audit | SiteCheck AI', description: 'Find visible website elements that can support conversion, including calls to action, contact paths, trust and next steps.', heading: 'Website conversion audit', intro: 'A conversion audit looks beyond traffic at the path visitors can take toward contact, purchase or another desired action.', points: ["Calls to action and next steps","Contact and forms","Trust and value proposition"], questions: ["What is a website conversion audit?","Which conversion signals are checked?","Can an audit guarantee higher conversion?"] },
  },
  'small-business-website-audit': {
    nl: { title: 'Website audit voor kleine bedrijven | SiteCheck AI', description: 'Een praktische website audit voor kleine bedrijven: controleer SEO, techniek, vertrouwen, contact en conversie.', heading: 'Website audit voor kleine bedrijven', intro: 'Kleine bedrijven hebben vaak geen apart SEO-team. SiteCheck AI maakt websiteproblemen begrijpelijk en geeft een praktische volgorde voor verbetering.', points: ["Vindbaarheid en lokale signalen","Vertrouwen en contact","Techniek en conversie"], questions: ["Wat moet een kleine bedrijfswebsite controleren?","Is technische kennis nodig?","Kan ik een kleine bedrijfswebsite gratis scannen?"] },
    en: { title: 'Small Business Website Audit | SiteCheck AI', description: 'A practical website audit for small businesses covering SEO, technical quality, trust, contact and conversion.', heading: 'Small business website audit', intro: 'Small businesses often do not have a dedicated SEO team. SiteCheck AI makes website issues understandable and turns them into a practical improvement order.', points: ["Search visibility and local signals","Trust and contact","Technical quality and conversion"], questions: ["What should a small business website audit check?","Do I need technical knowledge?","Can I scan a small business website for free?"] },
  },
  'ecommerce-website-audit': {
    nl: { title: 'Ecommerce website audit | SiteCheck AI', description: 'Controleer een webshop op zichtbare SEO-, content-, mobiel-, vertrouwen- en conversiesignalen.', heading: 'Ecommerce website audit', intro: 'Een webshop moet producten vindbaar maken en bezoekers helpen om met vertrouwen verder te gaan. SiteCheck AI controleert signalen die op de opgegeven pagina meetbaar zijn.', points: ["Productinformatie en SEO","Mobiel en gebruikservaring","Vertrouwen en conversie"], questions: ["Wat controleert een ecommerce website audit?","Kan SiteCheck AI een webshop controleren?","Krijg ik concrete verbeterpunten?"] },
    en: { title: 'Ecommerce Website Audit | SiteCheck AI', description: 'Check an ecommerce website for visible SEO, content, mobile, trust and conversion signals.', heading: 'Ecommerce website audit', intro: 'An ecommerce site needs to make products discoverable and help visitors move forward with confidence. SiteCheck AI checks measurable signals on the submitted page.', points: ["Product information and SEO","Mobile experience and usability","Trust and conversion"], questions: ["What does an ecommerce website audit check?","Can SiteCheck AI audit an online store?","Do I get practical improvement points?"] },
  },
  'website-health-check': {
    nl: { title: 'Website health check | SiteCheck AI', description: 'Doe een website health check en krijg inzicht in SEO, techniek, mobiel, content, vertrouwen en conversie.', heading: 'Website health check', intro: 'Een website health check combineert meerdere invalshoeken in één praktische eerste controle. Zo zie je sneller waar je aandacht het beste naartoe kan.', points: ["SEO en vindbaarheid","Techniek en mobiele ervaring","Content, vertrouwen en conversie"], questions: ["Wat is een website health check?","Wat controleert SiteCheck AI?","Kan ik mijn website gratis controleren?"] },
    en: { title: 'Website Health Check | SiteCheck AI', description: 'Run a website health check covering SEO, technical quality, mobile, content, trust and conversion.', heading: 'Website health check', intro: 'A website health check combines multiple areas into one practical first review, helping you see where attention may be most useful.', points: ["SEO and search visibility","Technical and mobile experience","Content, trust and conversion"], questions: ["What is a website health check?","What does SiteCheck AI check?","Can I check my website for free?"] },
  },

};


// International SEO pages (DE / FR / ES). These are intentionally focused on high-intent search queries.
type SeoPageContent = { title: string; description: string; heading: string; intro: string; points: string[]; questions: string[] };
type GlobalLocale = "de" | "fr" | "es";
const internationalSeoPages: Record<string, Record<GlobalLocale, SeoPageContent>> = {
  "free-website-audit": {
    de: { title:"Kostenloser Website-Audit | SiteCheck AI", description:"Kostenlosen Website-Audit durchführen und SEO, Technik, Mobile, Inhalte und Conversion prüfen.", heading:"Kostenloser Website-Audit", intro:"Prüfe deine Website kostenlos und entdecke konkrete Bereiche, in denen du SEO, Technik, Inhalte und Conversion verbessern kannst.", points:["SEO und Sichtbarkeit","Technik und Geschwindigkeit","Inhalte, Vertrauen und Conversion"], questions:["Ist der Website-Audit wirklich kostenlos?","Was wird geprüft?","Kann ich danach einen vollständigen Bericht kaufen?"] },
    fr: { title:"Audit de site web gratuit | SiteCheck AI", description:"Effectuez un audit gratuit de votre site et identifiez les améliorations SEO, techniques, mobiles et de conversion.", heading:"Audit de site web gratuit", intro:"Analysez gratuitement votre site et découvrez les points concrets à améliorer en SEO, technique, contenu et conversion.", points:["SEO et visibilité","Technique et performance","Contenu, confiance et conversion"], questions:["L’audit est-il vraiment gratuit ?","Que vérifiez-vous ?","Puis-je acheter un rapport complet ensuite ?"] },
    es: { title:"Auditoría web gratuita | SiteCheck AI", description:"Haz una auditoría web gratuita y descubre mejoras de SEO, técnica, móvil, contenido y conversión.", heading:"Auditoría web gratuita", intro:"Analiza tu sitio gratis y descubre áreas concretas para mejorar SEO, tecnología, contenido y conversión.", points:["SEO y visibilidad","Tecnología y velocidad","Contenido, confianza y conversión"], questions:["¿La auditoría es realmente gratuita?","¿Qué se comprueba?","¿Puedo comprar después un informe completo?"] }
  },
  "ai-website-audit": {
    de: { title:"KI-Website-Audit | SiteCheck AI", description:"Website mit KI analysieren und konkrete Verbesserungen für SEO, Technik und Conversion finden.", heading:"KI-Website-Audit", intro:"SiteCheck AI verbindet messbare Website-Daten mit KI-Empfehlungen, damit du weißt, was du als Nächstes verbessern kannst.", points:["KI-gestützte Empfehlungen","SEO und technische Signale","Conversion und Vertrauen"], questions:["Was analysiert der KI-Audit?","Sind die Empfehlungen konkret?","Ersetzt das eine menschliche Prüfung?"] },
    fr: { title:"Audit de site par IA | SiteCheck AI", description:"Analysez votre site avec l’IA et trouvez des améliorations concrètes pour le SEO, la technique et la conversion.", heading:"Audit de site par IA", intro:"SiteCheck AI combine des données mesurables avec des recommandations IA pour vous aider à choisir les prochaines améliorations.", points:["Recommandations par IA","SEO et signaux techniques","Conversion et confiance"], questions:["Que vérifie l’audit IA ?","Les recommandations sont-elles concrètes ?","L’IA remplace-t-elle un audit humain ?"] },
    es: { title:"Auditoría web con IA | SiteCheck AI", description:"Analiza tu sitio con IA y encuentra mejoras concretas de SEO, tecnología y conversión.", heading:"Auditoría web con IA", intro:"SiteCheck AI combina datos medibles con recomendaciones de IA para ayudarte a decidir qué mejorar después.", points:["Recomendaciones con IA","SEO y señales técnicas","Conversión y confianza"], questions:["¿Qué analiza la auditoría con IA?","¿Las recomendaciones son concretas?","¿Sustituye a una auditoría humana?"] }
  },
  "website-seo-checker": {
    de: { title:"SEO Website Checker | SiteCheck AI", description:"SEO deiner Website prüfen: Titel, Beschreibungen, Überschriften, Links und wichtige SEO-Signale.", heading:"SEO Website Checker", intro:"Prüfe die wichtigsten sichtbaren SEO-Signale deiner Website und erhalte verständliche Hinweise für bessere Auffindbarkeit.", points:["Seitentitel und Meta-Beschreibung","Überschriften und Inhalte","Interne und externe Links"], questions:["Welche SEO-Signale werden geprüft?","Ist das ein vollständiger SEO-Audit?","Bekomme ich konkrete Empfehlungen?"] },
    fr: { title:"SEO Website Checker | SiteCheck AI", description:"Vérifiez le SEO de votre site : titres, descriptions, balises, liens et signaux SEO essentiels.", heading:"SEO Website Checker", intro:"Vérifiez les principaux signaux SEO visibles de votre site et obtenez des pistes claires pour améliorer sa visibilité.", points:["Titres et méta-descriptions","Titres et contenu","Liens internes et externes"], questions:["Quels signaux SEO sont vérifiés ?","Est-ce un audit SEO complet ?","Recevrai-je des recommandations concrètes ?"] },
    es: { title:"SEO Website Checker | SiteCheck AI", description:"Comprueba el SEO de tu web: títulos, descripciones, encabezados, enlaces y señales SEO importantes.", heading:"SEO Website Checker", intro:"Comprueba las señales SEO visibles más importantes de tu web y recibe indicaciones claras para mejorar su visibilidad.", points:["Títulos y meta descripciones","Encabezados y contenido","Enlaces internos y externos"], questions:["¿Qué señales SEO se comprueban?","¿Es una auditoría SEO completa?","¿Recibiré recomendaciones concretas?"] }
  },
  "website-performance-check": {
    de: { title:"Website Performance Check | SiteCheck AI", description:"Website-Leistung prüfen und technische Signale wie Antwortzeit, Seitengröße und Kompression verstehen.", heading:"Website Performance Check", intro:"Prüfe messbare technische Signale deiner Website und erkenne Bereiche, die Geschwindigkeit und Nutzererlebnis beeinflussen können.", points:["Server-Antwortzeit","Seitengröße und Kompression","Mobile und technische Signale"], questions:["Wie wird die Performance geprüft?","Ist das ein vollständiger Lighthouse-Test?","Was kann ich bei einer langsamen Website verbessern?"] },
    fr: { title:"Test de performance du site | SiteCheck AI", description:"Testez les performances de votre site et identifiez les signaux techniques liés à la vitesse.", heading:"Test de performance du site", intro:"Vérifiez les signaux techniques mesurables de votre site et identifiez les points qui peuvent affecter la vitesse et l’expérience.", points:["Temps de réponse du serveur","Taille et compression des pages","Signaux mobiles et techniques"], questions:["Comment les performances sont-elles vérifiées ?","Est-ce un test Lighthouse complet ?","Que faire si mon site est lent ?"] },
    es: { title:"Comprobación del rendimiento web | SiteCheck AI", description:"Comprueba el rendimiento de tu web y detecta señales técnicas relacionadas con la velocidad.", heading:"Comprobación del rendimiento web", intro:"Comprueba señales técnicas medibles y detecta áreas que pueden afectar a la velocidad y la experiencia del usuario.", points:["Tiempo de respuesta del servidor","Tamaño y compresión","Señales móviles y técnicas"], questions:["¿Cómo se comprueba el rendimiento?","¿Es una prueba completa de Lighthouse?","¿Qué puedo mejorar si mi web es lenta?"] }
  },
  "website-ux-check": {
    de: { title:"Website UX Check | SiteCheck AI", description:"Nutzererlebnis deiner Website prüfen: Klarheit, Navigation, Kontakt und Conversion.", heading:"Website UX Check", intro:"Prüfe, ob Besucher schnell verstehen, was du anbietest und welchen nächsten Schritt sie machen können.", points:["Erster Eindruck","Navigation und nächste Schritte","Kontakt und Conversion"], questions:["Was wird beim UX-Check geprüft?","Brauche ich technisches Wissen?","Kann der Check Conversion-Probleme finden?"] },
    fr: { title:"Test UX de site web | SiteCheck AI", description:"Vérifiez l’expérience utilisateur de votre site : clarté, navigation, contact et conversion.", heading:"Test UX de site web", intro:"Vérifiez si vos visiteurs comprennent rapidement votre offre et savent quelle action effectuer ensuite.", points:["Première impression","Navigation et prochaines étapes","Contact et conversion"], questions:["Que vérifie le test UX ?","Faut-il des connaissances techniques ?","Le test peut-il détecter des problèmes de conversion ?"] },
    es: { title:"Comprobación UX de una web | SiteCheck AI", description:"Comprueba la experiencia de usuario de tu web: claridad, navegación, contacto y conversión.", heading:"Comprobación UX de una web", intro:"Comprueba si tus visitantes entienden rápidamente tu oferta y saben qué hacer a continuación.", points:["Primera impresión","Navegación y siguientes pasos","Contacto y conversión"], questions:["¿Qué comprueba el análisis UX?","¿Necesito conocimientos técnicos?","¿Puede detectar problemas de conversión?"] }
  },
  "website-mobile-check": {
    de: { title:"Mobile Website Check | SiteCheck AI", description:"Mobile Darstellung deiner Website prüfen und wichtige Signale für Nutzer auf Smartphones erkennen.", heading:"Mobile Website Check", intro:"Prüfe sichtbare mobile und technische Signale und erkenne Bereiche, die auf Smartphones verbessert werden können.", points:["Mobile Darstellung","Geschwindigkeit und Technik","Lesbarkeit und Interaktion"], questions:["Was wird auf Mobilgeräten geprüft?","Warum ist Mobile wichtig?","Welche Verbesserungen kann ich umsetzen?"] },
    fr: { title:"Test mobile de site web | SiteCheck AI", description:"Vérifiez votre site sur mobile et identifiez les signaux importants pour les utilisateurs de smartphone.", heading:"Test mobile de site web", intro:"Vérifiez les signaux mobiles et techniques visibles et identifiez les points à améliorer sur smartphone.", points:["Affichage mobile","Vitesse et technique","Lisibilité et interaction"], questions:["Que vérifiez-vous sur mobile ?","Pourquoi le mobile est-il important ?","Quelles améliorations puis-je mettre en place ?"] },
    es: { title:"Comprobación web móvil | SiteCheck AI", description:"Comprueba tu web en móvil y detecta señales importantes para usuarios de smartphones.", heading:"Comprobación web móvil", intro:"Comprueba señales móviles y técnicas visibles y detecta qué puedes mejorar en smartphones.", points:["Diseño móvil","Velocidad y tecnología","Legibilidad e interacción"], questions:["¿Qué se comprueba en móvil?","¿Por qué es importante el móvil?","¿Qué puedo mejorar?"] }
  },
  "website-accessibility-check": {
    de: { title:"Website Accessibility Check | SiteCheck AI", description:"Website auf sichtbare Zugänglichkeits- und Nutzerfreundlichkeitssignale prüfen.", heading:"Website Accessibility Check", intro:"Prüfe sichtbare Signale, die beeinflussen können, wie verständlich und nutzbar deine Website für Besucher ist.", points:["Struktur und Überschriften","Bilder und Alternativtexte","Mobile Nutzung und Klarheit"], questions:["Was prüft der Accessibility Check?","Ist das eine vollständige Barrierefreiheitsprüfung?","Was kann ich verbessern?"] },
    fr: { title:"Test d’accessibilité web | SiteCheck AI", description:"Vérifiez les signaux visibles d’accessibilité et d’utilisabilité de votre site.", heading:"Test d’accessibilité web", intro:"Vérifiez les signaux visibles qui peuvent influencer la compréhension et l’utilisation de votre site.", points:["Structure et titres","Images et textes alternatifs","Usage mobile et clarté"], questions:["Que vérifie le test d’accessibilité ?","Est-ce un audit complet d’accessibilité ?","Que puis-je améliorer ?"] },
    es: { title:"Comprobación de accesibilidad web | SiteCheck AI", description:"Comprueba señales visibles de accesibilidad y facilidad de uso de tu web.", heading:"Comprobación de accesibilidad web", intro:"Comprueba señales visibles que pueden influir en la comprensión y el uso de tu sitio web.", points:["Estructura y encabezados","Imágenes y textos alternativos","Uso móvil y claridad"], questions:["¿Qué comprueba la accesibilidad?","¿Es una auditoría completa de accesibilidad?","¿Qué puedo mejorar?"] }
  },
  "website-trust-check": {
    de: { title:"Website Trust Check | SiteCheck AI", description:"Vertrauenssignale deiner Website prüfen: Kontakt, Klarheit, Nachweise und erster Eindruck.", heading:"Website Trust Check", intro:"Prüfe, ob deine Website genügend sichtbare Signale vermittelt, damit Besucher deinem Unternehmen vertrauen können.", points:["Vertrauen und Glaubwürdigkeit","Kontaktmöglichkeiten","Erster Eindruck"], questions:["Welche Vertrauenssignale werden geprüft?","Warum ist Vertrauen wichtig?","Kann der Check fehlende Informationen erkennen?"] },
    fr: { title:"Test de confiance du site | SiteCheck AI", description:"Vérifiez les signaux de confiance de votre site : contact, clarté, preuves et première impression.", heading:"Test de confiance du site", intro:"Vérifiez si votre site présente suffisamment de signaux visibles pour rassurer les visiteurs.", points:["Confiance et crédibilité","Moyens de contact","Première impression"], questions:["Quels signaux de confiance sont vérifiés ?","Pourquoi la confiance est-elle importante ?","Le test peut-il détecter des informations manquantes ?"] },
    es: { title:"Comprobación de confianza web | SiteCheck AI", description:"Comprueba las señales de confianza de tu web: contacto, claridad, pruebas y primera impresión.", heading:"Comprobación de confianza web", intro:"Comprueba si tu web muestra suficientes señales visibles para generar confianza en los visitantes.", points:["Confianza y credibilidad","Formas de contacto","Primera impresión"], questions:["¿Qué señales de confianza se comprueban?","¿Por qué es importante la confianza?","¿Puede detectar información que falta?"] }
  },
  "website-conversion-audit": {
    de: { title:"Website Conversion Audit | SiteCheck AI", description:"Conversion deiner Website prüfen: CTAs, Kontaktwege, Vertrauen und nächste Schritte.", heading:"Website Conversion Audit", intro:"Prüfe, ob Besucher leicht verstehen, was sie als Nächstes tun sollen, und ob wichtige Kontaktwege sichtbar sind.", points:["Klare Call-to-Actions","Kontaktwege","Vertrauen und Wertversprechen"], questions:["Was wird beim Conversion-Audit geprüft?","Kann der Check mehr Leads garantieren?","Welche Verbesserungen sind möglich?"] },
    fr: { title:"Audit de conversion du site | SiteCheck AI", description:"Analysez la conversion de votre site : CTA, contact, confiance et prochaines étapes.", heading:"Audit de conversion du site", intro:"Vérifiez si les visiteurs comprennent facilement l’action suivante et trouvent les moyens de contact importants.", points:["Appels à l’action clairs","Moyens de contact","Confiance et proposition de valeur"], questions:["Que vérifie l’audit de conversion ?","Le test garantit-il plus de prospects ?","Quelles améliorations sont possibles ?"] },
    es: { title:"Auditoría de conversión web | SiteCheck AI", description:"Comprueba la conversión de tu web: CTA, contacto, confianza y siguientes pasos.", heading:"Auditoría de conversión web", intro:"Comprueba si los visitantes entienden fácilmente qué hacer después y encuentran los canales de contacto importantes.", points:["Llamadas a la acción claras","Formas de contacto","Confianza y propuesta de valor"], questions:["¿Qué comprueba la auditoría de conversión?","¿Garantiza más clientes potenciales?","¿Qué mejoras son posibles?"] }
  },
  "small-business-website-audit": {
    de: { title:"Website-Audit für kleine Unternehmen | SiteCheck AI", description:"Website kleiner Unternehmen prüfen und konkrete Verbesserungen für SEO, Vertrauen und Conversion finden.", heading:"Website-Audit für kleine Unternehmen", intro:"Ein klarer Website-Audit hilft kleinen Unternehmen zu erkennen, welche Verbesserungen zuerst sinnvoll sind.", points:["SEO und Auffindbarkeit","Vertrauen und Klarheit","Kontakt und Conversion"], questions:["Ist der Audit für kleine Unternehmen geeignet?","Was wird tatsächlich gemessen?","Kann ich mit dem kostenlosen Check starten?"] },
    fr: { title:"Audit de site pour petites entreprises | SiteCheck AI", description:"Analysez le site d’une petite entreprise et trouvez des améliorations concrètes en SEO, confiance et conversion.", heading:"Audit de site pour petites entreprises", intro:"Un audit clair aide les petites entreprises à identifier les améliorations les plus utiles à traiter en premier.", points:["SEO et visibilité","Confiance et clarté","Contact et conversion"], questions:["L’audit convient-il aux petites entreprises ?","Que mesurez-vous réellement ?","Puis-je commencer gratuitement ?"] },
    es: { title:"Auditoría web para pequeñas empresas | SiteCheck AI", description:"Analiza la web de una pequeña empresa y encuentra mejoras concretas de SEO, confianza y conversión.", heading:"Auditoría web para pequeñas empresas", intro:"Una auditoría clara ayuda a las pequeñas empresas a identificar qué mejoras conviene abordar primero.", points:["SEO y visibilidad","Confianza y claridad","Contacto y conversión"], questions:["¿Es adecuada para pequeñas empresas?","¿Qué se mide realmente?","¿Puedo empezar gratis?"] }
  },
  "ecommerce-website-audit": {
    de: { title:"E-Commerce Website Audit | SiteCheck AI", description:"Online-Shop prüfen: SEO, Vertrauen, Nutzerführung, Produktseiten und Conversion-Signale.", heading:"E-Commerce Website Audit", intro:"Prüfe wichtige Signale deines Online-Shops und erkenne sichtbare Bereiche, die Vertrauen und Conversion beeinflussen können.", points:["Produktseiten und SEO","Vertrauen und Klarheit","Conversion und nächste Schritte"], questions:["Was wird bei einem Shop geprüft?","Prüft der Audit den gesamten Shop?","Kann ich danach einen vollständigen Bericht kaufen?"] },
    fr: { title:"Audit de site e-commerce | SiteCheck AI", description:"Analysez votre boutique en ligne : SEO, confiance, parcours utilisateur et signaux de conversion.", heading:"Audit de site e-commerce", intro:"Vérifiez les signaux importants de votre boutique et identifiez les points visibles qui peuvent influencer confiance et conversion.", points:["Pages produits et SEO","Confiance et clarté","Conversion et prochaines étapes"], questions:["Que vérifiez-vous sur une boutique ?","Analysez-vous toute la boutique ?","Puis-je acheter un rapport complet ensuite ?"] },
    es: { title:"Auditoría web para e-commerce | SiteCheck AI", description:"Analiza tu tienda online: SEO, confianza, experiencia de usuario y señales de conversión.", heading:"Auditoría web para e-commerce", intro:"Comprueba señales importantes de tu tienda y detecta áreas visibles que pueden influir en la confianza y la conversión.", points:["Páginas de producto y SEO","Confianza y claridad","Conversión y siguientes pasos"], questions:["¿Qué se comprueba en una tienda?","¿Se analiza toda la tienda?","¿Puedo comprar después un informe completo?"] }
  },
  "website-health-check": {
    de: { title:"Website Health Check | SiteCheck AI", description:"Gesundheitscheck für deine Website: SEO, Technik, Mobile, Inhalte, Vertrauen und Conversion.", heading:"Website Health Check", intro:"Erhalte einen schnellen Gesamtüberblick über wichtige messbare Signale deiner Website und erkenne die nächsten Verbesserungen.", points:["SEO und Auffindbarkeit","Technik und Mobile","Inhalte, Vertrauen und Conversion"], questions:["Was umfasst der Website Health Check?","Ist der Check kostenlos?","Was mache ich mit den Ergebnissen?"] },
    fr: { title:"Health Check de site web | SiteCheck AI", description:"Faites un bilan de votre site : SEO, technique, mobile, contenu, confiance et conversion.", heading:"Health Check de site web", intro:"Obtenez une vue d’ensemble rapide des principaux signaux mesurables de votre site et identifiez les prochaines améliorations.", points:["SEO et visibilité","Technique et mobile","Contenu, confiance et conversion"], questions:["Que comprend le Health Check ?","Le test est-il gratuit ?","Que faire avec les résultats ?"] },
    es: { title:"Health Check de sitio web | SiteCheck AI", description:"Haz un chequeo completo de tu web: SEO, tecnología, móvil, contenido, confianza y conversión.", heading:"Health Check de sitio web", intro:"Obtén una visión rápida de las principales señales medibles de tu web y descubre las siguientes mejoras.", points:["SEO y visibilidad","Tecnología y móvil","Contenido, confianza y conversión"], questions:["¿Qué incluye el Health Check?","¿Es gratuito?","¿Qué hago con los resultados?"] }
  }
};

function SeoHead() {
  const legalPath = /^\/(nl|en|de|fr|es)\/(privacy|voorwaarden|terms|cookies|herroepen|withdraw)$/.test(window.location.pathname);
  const { locale } = useLanguage();
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts[1] || '';
  const legalType = pathParts[1];
  const blogSlug = (pathParts[0] === 'nl' || pathParts[0] === 'en') && pathParts[1] === 'blog' ? pathParts[2] : undefined;
  const blogArticle = blogSlug ? getBlogArticle(blogSlug)?.[locale] : undefined;
  const page = seoPages[slug]?.[locale as 'nl' | 'en'] ?? internationalSeoPages[slug]?.[locale as GlobalLocale];
  const legalTitles: Record<string, { nl: string; en: string }> = {
    privacy: { nl: 'Privacyverklaring | SiteCheck AI', en: 'Privacy Policy | SiteCheck AI' },
    voorwaarden: { nl: 'Algemene voorwaarden | SiteCheck AI', en: 'Terms and Conditions | SiteCheck AI' },
    terms: { nl: 'Terms and Conditions | SiteCheck AI', en: 'Terms and Conditions | SiteCheck AI' },
    cookies: { nl: 'Cookiebeleid | SiteCheck AI', en: 'Cookie Policy | SiteCheck AI' },
    herroepen: { nl: 'Aankoop herroepen | SiteCheck AI', en: 'Withdraw a Purchase | SiteCheck AI' },
    withdraw: { nl: 'Aankoop herroepen | SiteCheck AI', en: 'Withdraw a Purchase | SiteCheck AI' },
  };
  const isBlogIndex = pathParts[1] === 'blog' && !blogSlug;
  const title = legalPath
    ? (legalTitles[legalType]?.[locale] ?? 'SiteCheck AI')
    : blogArticle
    ? blogArticle.title + ' | SiteCheck AI'
    : isBlogIndex
      ? (locale === 'nl' ? 'Website tips en SEO kennis | SiteCheck AI' : 'Website & SEO Guides | SiteCheck AI')
      : page?.title ?? (locale === 'nl'
        ? 'Website laten controleren? | SiteCheck AI'
        : 'Website Audit & Website Checker | SiteCheck AI');
  const description = legalPath
    ? (locale === 'nl' ? 'Juridische informatie van SiteCheck AI, waaronder privacy, voorwaarden, cookies en herroeping.' : 'Legal information for SiteCheck AI, including privacy, terms, cookies and withdrawal.')
    : blogArticle?.description
    ?? (isBlogIndex
      ? (locale === 'nl'
        ? 'Praktische artikelen over SEO, websites, snelheid, conversie en online vindbaarheid voor ondernemers.'
        : 'Practical guides about SEO, websites, speed, conversion and search visibility for business owners.')
      : page?.description ?? (locale === 'nl'
        ? 'Laat je website controleren met SiteCheck AI. Ontdek SEO-, content-, techniek-, mobiel- en conversieproblemen en krijg praktische verbeteradviezen.'
        : 'Check your website with SiteCheck AI. Find SEO, content, technical, mobile and conversion issues with practical improvement advice.'));
  const pathname = window.location.pathname;
  const basePath = pathname === '/' || /^\/(nl|en|de|fr|es)\/?$/.test(pathname)
    ? `/${locale}`
    : pathname;
  const canonical = new URL(legalPath ? legalBase! : basePath, window.location.origin).href;
  const seoSlug = blogSlug ? 'blog/' + blogSlug : (isBlogIndex ? 'blog' : (seoPages[slug] || internationalSeoPages[slug] ? slug : ''));
  const legalBase = legalPath ? (locale === 'nl' ? `/nl/${legalType}` : `/en/${legalType === 'voorwaarden' ? 'terms' : legalType === 'herroepen' ? 'withdraw' : legalType}`) : null;
  const nlLegal = legalType === 'terms' || legalType === 'withdraw' ? `/nl/${legalType === 'terms' ? 'voorwaarden' : 'herroepen'}` : `/nl/${legalType}`;
  const enLegal = `/en/${legalType === 'voorwaarden' ? 'terms' : legalType === 'herroepen' ? 'withdraw' : legalType}`;
  const nlUrl = new URL(legalPath ? nlLegal : (seoSlug ? `/nl/${seoSlug}` : '/nl'), window.location.origin).href;
  const enUrl = new URL(legalPath ? enLegal : (seoSlug ? `/en/${seoSlug}` : '/en'), window.location.origin).href;
  const deUrl = new URL(seoSlug ? `/de/${seoSlug}` : '/de', window.location.origin).href;
  const frUrl = new URL(seoSlug ? `/fr/${seoSlug}` : '/fr', window.location.origin).href;
  const esUrl = new URL(seoSlug ? `/es/${seoSlug}` : '/es', window.location.origin).href;

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
    upsertMeta('meta[property="og:url"]', canonical);
    upsertMeta('meta[property="og:site_name"]', 'SiteCheck AI');
    upsertMeta('meta[property="og:locale"]', locale === 'nl' ? 'nl_NL' : 'en_US');
    upsertMeta('meta[name="twitter:card"]', 'summary');
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
    setLink('alternate', deUrl, { hreflang: 'de' });
    setLink('alternate', frUrl, { hreflang: 'fr' });
    setLink('alternate', esUrl, { hreflang: 'es' });
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
      : page
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              name: title,
              description,
              url: canonical,
              inLanguage: locale,
            },
            {
              '@type': 'FAQPage',
              mainEntity: page.questions.map((question) => ({
                '@type': 'Question',
                name: question,
                acceptedAnswer: { '@type': 'Answer', text: faqAnswer(question, locale) },
              })),
            },
          ],
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
  }, [canonical, description, enUrl, deUrl, esUrl, frUrl, locale, nlUrl, title]);

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
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const copy = locale === 'nl' ? {
    knowledge: 'Kennisbank', navNote: 'Voor ondernemers met een helder verhaal', eyebrow: 'Een nuchtere blik op je website',
    title: <>Hoe goed presteert <em>jouw website?</em></>, lede: 'SiteCheck AI analyseert je website en geeft praktische verbeteradviezen. Geen technisch rapport waar je doorheen moet ploegen, maar duidelijke handvatten voor de volgende stap.',
    honest: 'Eerlijk over wat we weten', private: 'Je gegevens blijven privé', startTitle: 'Start met je website', freePill: 'Gratis eerste scan', urlLabel: 'Website-adres', placeholder: 'https://jouwbedrijf.nl',
    freeButton: 'Start gratis scan', paidButton: 'Volledig rapport — €29', paidPending: 'Volledig rapport voorbereiden...', analyzing: 'SiteCheck AI analyseert...',
    fineFree: 'Gratis scan:', finePaid: 'Volledig rapport:', fineText: 'krijg alle verbeterpunten en concrete AI-voorstellen voor €29, eenmalig.',
    queuedTitle: 'Je scan staat klaar', queuedAnalyzing: 'SiteCheck AI analyseert je website', queuedText: 'We hebben je aanvraag ontvangen. De analyse wordt op de achtergrond voorbereid.', queuedAnalyzingText: 'We halen de homepage op en controleren alleen wat we daadwerkelijk kunnen meten.',
    noJargon: 'Geen vakjargon.', signal: 'Wel zicht op wat je website voor je bedrijf kan doen.', onlyUrl: 'Alleen je URL is nodig', processing: 'Aanvragen worden verwerkt',
    methodKicker: 'Zo werkt het', methodTitle: 'Van twijfel naar een volgende stap.', methodIntro: 'Een website hoeft niet perfect te zijn. Je wilt vooral weten waar een kleine verbetering het meeste oplevert.',
    steps: [['Je deelt je URL','Geen account, vragenlijst of technische voorbereiding. Alleen het adres van je website.'],['Wij nemen rustig de tijd','De scan wordt ingepland. We doen niet alsof een snelle blik hetzelfde is als goed kijken.'],['Je krijgt richting','Praktische aanbevelingen waarmee je zelf, of samen met je webbouwer, verder kunt.']],
    broadKicker: 'Een brede blik', broadTitle: 'Niet alleen de buitenkant.', broadIntro: 'Een goede website voelt vanzelfsprekend voor je bezoeker. Daarom kijken we naar de samenhang, niet naar één los vinkje.',
    cards: [['De eerste indruk','Is in één oogopslag duidelijk wat je doet, voor wie en waarom iemand verder zou kijken?'],['De route naar contact','Kan een geïnteresseerde zonder zoeken de juiste volgende stap zetten?'],['Vertrouwen in details','Klopt het verhaal ook in de kleine dingen die bepalen of een bezoeker blijft?']],
    paperLabel: 'Waar we op letten', paperBig: 'Helder.', paperNote: 'De beste aanbeveling is er één die je morgen begrijpt én kunt uitvoeren.',
    closingTitle: 'Maak van je website een betere eerste kennismaking.', closingText: 'Begin met wat je al hebt. SiteCheck AI helpt je kiezen wat daarna de moeite waard is.'
  } : {
    knowledge: 'Guides', navNote: 'For business owners who value clarity', eyebrow: 'A clear look at your website',
    title: <>How well does <em>your website perform?</em></>, lede: 'SiteCheck AI analyzes your website and gives you practical improvement advice. No technical report to dig through — just clear guidance for what to do next.',
    honest: 'Honest about what we know', private: 'Your data stays private', startTitle: 'Start with your website', freePill: 'Free first scan', urlLabel: 'Website address', placeholder: 'https://yourwebsite.com',
    freeButton: 'Start free scan', paidButton: 'Full report — €29', paidPending: 'Preparing full report...', analyzing: 'SiteCheck AI is analyzing...',
    fineFree: 'Free scan:', finePaid: 'Full report:', fineText: 'get all improvement points and concrete AI recommendations for €29, one-time.',
    queuedTitle: 'Your scan is ready', queuedAnalyzing: 'SiteCheck AI is analyzing your website', queuedText: 'We received your request. The analysis is being prepared in the background.', queuedAnalyzingText: 'We are fetching the homepage and checking only what we can actually measure.',
    noJargon: 'No jargon.', signal: 'Just a clear view of what your website could do better for your business.', onlyUrl: 'Only your URL is needed', processing: 'Requests are being processed',
    methodKicker: 'How it works', methodTitle: 'From uncertainty to a next step.', methodIntro: 'Your website does not need to be perfect. You mainly need to know where a small improvement could make the biggest difference.',
    steps: [['Share your URL','No account, questionnaire or technical preparation. Just your website address.'],['We take a closer look','The scan is processed carefully. We do not pretend a quick glance is the same as a proper review.'],['Get clear direction','Practical recommendations you can act on yourself or with your web developer.']],
    broadKicker: 'A broader view', broadTitle: 'More than the surface.', broadIntro: 'A good website feels intuitive to visitors. That is why we look at how the different signals work together, not at isolated checkboxes.',
    cards: [['The first impression','Is it immediately clear what you do, who it is for and why someone should continue?'],['The path to contact','Can an interested visitor find the right next step without searching?'],['Trust in the details','Does the story also hold together in the small details that influence whether a visitor stays?']],
    paperLabel: 'What we look at', paperBig: 'Clear.', paperNote: 'The best recommendation is one you understand today and can act on tomorrow.',
    closingTitle: 'Turn your website into a better first introduction.', closingText: 'Start with what you already have. SiteCheck AI helps you decide what is worth improving next.'
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/scans/stats", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Scan statistics unavailable");
        return response.json() as Promise<{ last7Days: number }>;
      })
      .then((data) => {
        if (Number.isSafeInteger(data.last7Days) && data.last7Days >= 0) {
          setQueueCount(data.last7Days);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const activeScan = useGetScan(activeScanId ?? 0, {
    request: activeScanId !== null && getScanAccessToken(activeScanId) ? { headers: { 'x-scan-access-token': getScanAccessToken(activeScanId)! } } : undefined,
    query: {
      enabled: activeScanId !== null,
      queryKey: getGetScanQueryKey(activeScanId ?? 0),
      refetchInterval: activeScanId !== null ? 4_000 : false,
    },
  });

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
          setQueueCount((count) => count === null ? null : count + 1);
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
          setQueueCount((count) => count === null ? null : count + 1);
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
          <div className="nav-actions"><a className="nav-note" href={homePath + '/blog'}>{copy.knowledge}</a><span className="nav-note">{copy.navNote}</span><LanguageSwitcher /></div>
        </div>
      </nav>

      <section className="hero">
        <div className="page-frame hero-grid">
          <div className="reveal">
            <div className="eyebrow">{copy.eyebrow}</div>
            <h1>{copy.title}</h1>
            <p className="hero-lede">
              {copy.lede}
            </p>
            <div className="hero-meta">
              <span className="meta-item"><ShieldCheck /> {copy.honest}</span>
              <span className="meta-item"><LockKeyhole /> {copy.private}</span>
            </div>
          </div>

          <div className="scan-card reveal reveal-delay-2">
            <div className="scan-card-label">
              <strong>{copy.startTitle}</strong>
              <span className="free-pill">{copy.freePill}</span>
            </div>
            <form onSubmit={submitScan} noValidate>
              <label className="form-label" htmlFor="website-url">{copy.urlLabel}</label>
              <div className="url-field">
                <Globe2 aria-hidden="true" />
                <input
                  id="website-url"
                  className={`url-input ${fieldError ? 'input-error' : ''}`}
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder={copy.placeholder}
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
                    <>{copy.analyzing} <Timer className="animate-pulse" /></>
                  ) : (
                    <>{copy.freeButton} <ArrowRight /></>
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
                    <>{copy.paidPending} <Timer className="animate-pulse" /></>
                  ) : (
                    <>{copy.paidButton} <ArrowRight /></>
                  )}
                </button>
              </div>
              <p className="fine-print"><strong>{copy.fineFree}</strong> {locale === 'nl' ? 'krijg inzicht in je website.' : 'get insight into your website.'} <strong>{copy.finePaid}</strong> {copy.fineText}</p>
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
                    <strong>{createScan.isPending ? copy.queuedAnalyzing : copy.queuedTitle}</strong>
                    <p>{createScan.isPending ? copy.queuedAnalyzingText : copy.queuedText}</p>
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
          <p className="signal-copy"><strong>{copy.noJargon}</strong> {copy.signal}</p>
          <div className="signal-stats">
            <span><span className="stat-dot" />{queueCount === null ? copy.processing : `${queueCount} scans in the last 7 days`}</span>
            <span>{copy.onlyUrl}</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="page-frame method-grid">
          <div>
            <div className="section-kicker">{copy.methodKicker}</div>
            <h2 className="section-title">{copy.methodTitle}</h2>
            <p className="section-intro">{copy.methodIntro}</p>
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
            <div className="paper-label">{copy.paperLabel}</div>
            <div className="paper-big">{copy.paperBig}</div>
            <p className="paper-note">{copy.paperNote}</p>
            <div className="paper-line" />
            <div className="paper-label">SiteCheck AI / 2024</div>
          </div>
        </div>
      </section>

      <section className="section checks-section">
        <div className="page-frame">
          <div className="checks-header">
            <div>
              <div className="section-kicker">{copy.broadKicker}</div>
              <h2 className="section-title">{copy.broadTitle}</h2>
            </div>
            <p className="section-intro">{copy.broadIntro}</p>
          </div>
          <div className="check-grid">
            <article className="check-card">
              <div className="check-icon"><LayoutDashboard /></div>
              <h3>{copy.cards[0][0]}</h3>
              <p>{copy.cards[0][1]}</p>
            </article>
            <article className="check-card">
              <div className="check-icon"><ClipboardCheck /></div>
              <h3>{copy.cards[1][0]}</h3>
              <p>{copy.cards[1][1]}</p>
            </article>
            <article className="check-card">
              <div className="check-icon"><Sparkles /></div>
              <h3>{copy.cards[2][0]}</h3>
              <p>{copy.cards[2][1]}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="popular-checks-heading">
        <div className="page-frame">
          <div className="checks-header">
            <div>
              <div className="section-kicker">{locale === 'nl' ? 'Website checks' : 'Website checks'}</div>
              <h2 id="popular-checks-heading" className="section-title">{locale === 'nl' ? 'Waar wil je je website op controleren?' : 'What do you want to check on your website?'}</h2>
            </div>
            <p className="section-intro">{locale === 'nl'
              ? 'Kies een onderwerp en ontdek welke signalen je kunt controleren.'
              : 'Choose a topic and discover which website signals you can check.'}</p>
          </div>
          <div className="check-grid">
            {(locale === 'nl'
              ? [
                  ['/nl/free-website-audit', 'Gratis website audit'],
                  ['/nl/ai-website-audit', 'AI website audit'],
                  ['/nl/website-seo-checker', 'Website SEO checker'],
                  ['/nl/website-performance-check', 'Website performance check'],
                  ['/nl/website-conversion-audit', 'Website conversion audit'],
                  ['/nl/website-health-check', 'Website health check'],
                ]
              : [
                  ['/en/free-website-audit', 'Free website audit'],
                  ['/en/ai-website-audit', 'AI website audit'],
                  ['/en/website-seo-checker', 'Website SEO checker'],
                  ['/en/website-performance-check', 'Website performance check'],
                  ['/en/website-conversion-audit', 'Website conversion audit'],
                  ['/en/website-health-check', 'Website health check'],
                ]
            ).map(([href, label]) => (
              <a className="check-card" key={href} href={href}>
                <div className="check-icon"><ClipboardCheck /></div>
                <h3>{label}</h3>
                <span className="text-link">{locale === 'nl' ? 'Bekijk check' : 'View check'} <ArrowRight /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="page-frame closing-box">
          <h2>{copy.closingTitle}</h2>
          <p>{copy.closingText}</p>
        </div>
      </section>

      <footer className="footer">
        <div className="page-frame footer-inner">
          <span>© {new Date().getFullYear()} SiteCheck AI</span>
          <span>{locale === 'nl' ? 'Een rustige check voor ambitieuze ondernemers' : 'A clear check for ambitious businesses'}</span>
          <span className="legal-links">
            <a href="/nl/privacy">{locale === 'nl' ? 'Privacy' : 'Privacy'}</a>
            <a href={locale === 'nl' ? '/nl/voorwaarden' : '/en/terms'}>{locale === 'nl' ? 'Voorwaarden' : 'Terms'}</a>
            <a href={locale === 'nl' ? '/nl/cookies' : '/en/cookies'}>{locale === 'nl' ? 'Cookies' : 'Cookies'}</a>
            <a href={locale === 'nl' ? '/nl/herroepen' : '/en/withdraw'}>{locale === 'nl' ? 'Herroepen' : 'Withdraw'}</a>
          </span>
        </div>
      </footer>
    </main></Localized>
  );
}


function faqAnswer(question: string, locale: Locale): string {
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
  if (question.includes('purchase a full report')) return 'Yes. After the free scan, you can purchase the full report for a one-time payment of €29.';
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

const seoInternalLinks: Record<string, { nl: [string, string][]; en: [string, string][] }> = {
  'website-scan': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/ai-website-audit','AI website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-performance-check','Website performance check'],['/nl/website-health-check','Website health check']], en: [['/en/free-website-audit','Free website audit'],['/en/ai-website-audit','AI website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-performance-check','Website performance check'],['/en/website-health-check','Website health check']] },
  'free-website-audit': { nl: [['/nl/website-scan','Website scan'],['/nl/ai-website-audit','AI website audit'],['/nl/small-business-website-audit','Website audit voor kleine bedrijven'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-health-check','Website health check']], en: [['/en/website-scan','Website scan'],['/en/ai-website-audit','AI website audit'],['/en/small-business-website-audit','Small business website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-health-check','Website health check']] },
  'ai-website-audit': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-performance-check','Website performance check'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-health-check','Website health check']], en: [['/en/free-website-audit','Free website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-performance-check','Website performance check'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-health-check','Website health check']] },
  'website-seo-checker': { nl: [['/nl/seo-check','SEO check'],['/nl/seo-audit','SEO audit'],['/nl/website-vindbaarheid-google','Beter vindbaar in Google'],['/nl/website-seo-verbeteren','Website SEO verbeteren'],['/nl/ai-website-audit','AI website audit']], en: [['/en/seo-check','SEO check'],['/en/seo-audit','SEO audit'],['/en/website-vindbaarheid-google','Improve Google visibility'],['/en/website-seo-verbeteren','Improve website SEO'],['/en/ai-website-audit','AI website audit']] },
  'website-performance-check': { nl: [['/nl/website-snelheid-test','Website snelheid test'],['/nl/website-mobile-check','Website mobile check'],['/nl/website-health-check','Website health check'],['/nl/website-audit','Website audit'],['/nl/ai-website-audit','AI website audit']], en: [['/en/website-snelheid-test','Website speed test'],['/en/website-mobile-check','Mobile website check'],['/en/website-health-check','Website health check'],['/en/website-audit','Website audit'],['/en/ai-website-audit','AI website audit']] },
  'website-ux-check': { nl: [['/nl/website-mobile-check','Website mobile check'],['/nl/website-conversie-check','Website conversie check'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-trust-check','Website vertrouwen check'],['/nl/website-check','Website check']], en: [['/en/website-mobile-check','Mobile website check'],['/en/website-conversie-check','Website conversion check'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-trust-check','Website trust check'],['/en/website-check','Website checker']] },
  'website-mobile-check': { nl: [['/nl/website-snelheid-test','Website snelheid test'],['/nl/website-performance-check','Website performance check'],['/nl/website-ux-check','Website UX check'],['/nl/website-accessibility-check','Website toegankelijkheid check'],['/nl/website-health-check','Website health check']], en: [['/en/website-snelheid-test','Website speed test'],['/en/website-performance-check','Website performance check'],['/en/website-ux-check','Website UX check'],['/en/website-accessibility-check','Website accessibility check'],['/en/website-health-check','Website health check']] },
  'website-accessibility-check': { nl: [['/nl/website-mobile-check','Website mobile check'],['/nl/website-ux-check','Website UX check'],['/nl/website-performance-check','Website performance check'],['/nl/website-audit','Website audit'],['/nl/free-website-audit','Gratis website audit']], en: [['/en/website-mobile-check','Mobile website check'],['/en/website-ux-check','Website UX check'],['/en/website-performance-check','Website performance check'],['/en/website-audit','Website audit'],['/en/free-website-audit','Free website audit']] },
  'website-trust-check': { nl: [['/nl/website-conversie-check','Website conversie check'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-check','Website check'],['/nl/small-business-website-audit','Website audit voor kleine bedrijven'],['/nl/website-health-check','Website health check']], en: [['/en/website-conversie-check','Website conversion check'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-check','Website checker'],['/en/small-business-website-audit','Small business website audit'],['/en/website-health-check','Website health check']] },
  'website-conversion-audit': { nl: [['/nl/website-conversie-check','Website conversie check'],['/nl/website-conversie-verbeteren','Website conversie verbeteren'],['/nl/website-trust-check','Website vertrouwen check'],['/nl/website-ux-check','Website UX check'],['/nl/free-website-audit','Gratis website audit']], en: [['/en/website-conversie-check','Website conversion check'],['/en/website-conversie-verbeteren','Improve website conversion'],['/en/website-trust-check','Website trust check'],['/en/website-ux-check','Website UX check'],['/en/free-website-audit','Free website audit']] },
  'small-business-website-audit': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/website-check','Website check'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-trust-check','Website vertrouwen check'],['/nl/website-conversion-audit','Website conversion audit']], en: [['/en/free-website-audit','Free website audit'],['/en/website-check','Website checker'],['/en/website-seo-checker','Website SEO checker'],['/en/website-trust-check','Website trust check'],['/en/website-conversion-audit','Website conversion audit']] },
  'ecommerce-website-audit': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-mobile-check','Website mobile check'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-trust-check','Website vertrouwen check']], en: [['/en/free-website-audit','Free website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-mobile-check','Mobile website check'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-trust-check','Website trust check']] },
  'website-health-check': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/ai-website-audit','AI website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-performance-check','Website performance check'],['/nl/website-conversion-audit','Website conversion audit']], en: [['/en/free-website-audit','Free website audit'],['/en/ai-website-audit','AI website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-performance-check','Website performance check'],['/en/website-conversion-audit','Website conversion audit']] },
  'website-check': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-trust-check','Website vertrouwen check'],['/nl/website-health-check','Website health check']], en: [['/en/free-website-audit','Free website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-trust-check','Website trust check'],['/en/website-health-check','Website health check']] },
  'website-audit': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/ai-website-audit','AI website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-performance-check','Website performance check'],['/nl/website-health-check','Website health check']], en: [['/en/free-website-audit','Free website audit'],['/en/ai-website-audit','AI website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-performance-check','Website performance check'],['/en/website-health-check','Website health check']] },
  'website-analyzer': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/ai-website-audit','AI website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-performance-check','Website performance check'],['/nl/website-health-check','Website health check']], en: [['/en/free-website-audit','Free website audit'],['/en/ai-website-audit','AI website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-performance-check','Website performance check'],['/en/website-health-check','Website health check']] },
  'website-analyse': { nl: [['/nl/free-website-audit','Gratis website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-performance-check','Website performance check'],['/nl/website-health-check','Website health check']], en: [['/en/free-website-audit','Free website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-performance-check','Website performance check'],['/en/website-health-check','Website health check']] },
  'website-conversie-check': { nl: [['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-conversie-verbeteren','Website conversie verbeteren'],['/nl/website-trust-check','Website vertrouwen check'],['/nl/website-ux-check','Website UX check'],['/nl/free-website-audit','Gratis website audit']], en: [['/en/website-conversion-audit','Website conversion audit'],['/en/website-conversie-verbeteren','Improve website conversion'],['/en/website-trust-check','Website trust check'],['/en/website-ux-check','Website UX check'],['/en/free-website-audit','Free website audit']] },
  'website-snelheid-test': { nl: [['/nl/website-performance-check','Website performance check'],['/nl/website-mobile-check','Website mobile check'],['/nl/website-health-check','Website health check'],['/nl/website-audit','Website audit'],['/nl/free-website-audit','Gratis website audit']], en: [['/en/website-performance-check','Website performance check'],['/en/website-mobile-check','Mobile website check'],['/en/website-health-check','Website health check'],['/en/website-audit','Website audit'],['/en/free-website-audit','Free website audit']] },
  'seo-check': { nl: [['/nl/website-seo-checker','Website SEO checker'],['/nl/seo-audit','SEO audit'],['/nl/website-vindbaarheid-google','Beter vindbaar in Google'],['/nl/website-seo-verbeteren','Website SEO verbeteren'],['/nl/ai-website-audit','AI website audit']], en: [['/en/website-seo-checker','Website SEO checker'],['/en/seo-audit','SEO audit'],['/en/website-vindbaarheid-google','Improve Google visibility'],['/en/website-seo-verbeteren','Improve website SEO'],['/en/ai-website-audit','AI website audit']] },
  'seo-audit': { nl: [['/nl/seo-check','SEO check'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-vindbaarheid-google','Beter vindbaar in Google'],['/nl/website-seo-verbeteren','Website SEO verbeteren'],['/nl/free-website-audit','Gratis website audit']], en: [['/en/seo-check','SEO check'],['/en/website-seo-checker','Website SEO checker'],['/en/website-vindbaarheid-google','Improve Google visibility'],['/en/website-seo-verbeteren','Improve website SEO'],['/en/free-website-audit','Free website audit']] },
  'website-vindbaarheid-google': { nl: [['/nl/seo-check','SEO check'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-seo-verbeteren','Website SEO verbeteren'],['/nl/free-website-audit','Gratis website audit'],['/nl/ai-website-audit','AI website audit']], en: [['/en/seo-check','SEO check'],['/en/website-seo-checker','Website SEO checker'],['/en/website-seo-verbeteren','Improve website SEO'],['/en/free-website-audit','Free website audit'],['/en/ai-website-audit','AI website audit']] },
  'website-seo-verbeteren': { nl: [['/nl/seo-check','SEO check'],['/nl/seo-audit','SEO audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-vindbaarheid-google','Beter vindbaar in Google'],['/nl/free-website-audit','Gratis website audit']], en: [['/en/seo-check','SEO check'],['/en/seo-audit','SEO audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-vindbaarheid-google','Improve Google visibility'],['/en/free-website-audit','Free website audit']] },
  'website-conversie-verbeteren': { nl: [['/nl/website-conversie-check','Website conversie check'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-trust-check','Website vertrouwen check'],['/nl/website-ux-check','Website UX check'],['/nl/free-website-audit','Gratis website audit']], en: [['/en/website-conversie-check','Website conversion check'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-trust-check','Website trust check'],['/en/website-ux-check','Website UX check'],['/en/free-website-audit','Free website audit']] },
};

function SeoLandingPage() {
  const { locale } = useLanguage();
  const [location] = useLocation();
  const slug = location.split('/').filter(Boolean)[1] || '';
  const page = seoPages[slug]?.[locale as 'nl' | 'en'] ?? internationalSeoPages[slug]?.[locale as GlobalLocale] ?? seoPages['website-scan'][locale === 'nl' ? 'nl' : 'en'];
  const homePath = `/${locale}`;

  return (
    <Localized>
      <main className="site-shell min-h-[100dvh]">
        <nav className="nav-wrap">
          <div className="page-frame flex items-center justify-between">
            <a className="brand-mark" href={homePath}>
              <span className="brand-name">SiteCheck <span>AI</span></span>
            </a>
            <div className="nav-actions"><a className="nav-note" href={(locale === 'nl' ? '/nl' : '/en') + '/blog'}>{locale === 'nl' ? 'Kennisbank' : 'Guides'}</a><LanguageSwitcher /></div>
          </div>
        </nav>
        <section className="hero">
          <div className="page-frame">
            <div className="reveal" style={{ maxWidth: '820px' }}>
              <div className="eyebrow">SiteCheck AI</div>
              <h1>{page.heading}</h1>
              <p className="hero-lede">{page.intro}</p>
              <div className="scan-actions">
                <a className="scan-button" href={homePath}>{locale === 'nl' ? 'Start gratis scan' : locale === 'en' ? 'Start free scan' : locale === 'de' ? 'Kostenlosen Scan starten' : locale === 'fr' ? 'Lancer l’analyse gratuite' : 'Iniciar análisis gratuito'} <ArrowRight /></a>
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
            <div className="section-kicker">{locale === 'nl' ? 'Ook interessant' : 'Related checks'}</div>
            <div className="check-grid" style={{ marginBottom: '48px' }}>
              {(seoInternalLinks[slug]?.[locale as 'nl' | 'en'] ?? (locale === 'de' || locale === 'fr' || locale === 'es'
                ? Object.keys(internationalSeoPages).filter((s) => s !== slug).slice(0, 5).map((s) => [`/${locale}/${s}`, internationalSeoPages[s][locale as GlobalLocale].heading] as [string, string])
                : seoInternalLinks['website-scan'][locale as 'nl' | 'en'])).filter(([href]) => href !== location).slice(0, 5).map(([href, label]) => (
                <a className="check-card" key={href} href={href}><h2>{label}</h2><span className="text-link">{locale === 'nl' ? 'Bekijk onderwerp' : 'Explore topic'} <ArrowRight /></span></a>
              ))}
            </div>
            <div className="section-kicker" style={{ marginTop: '10px' }}>{locale === 'nl' ? 'Voor jouw type bedrijf' : 'For your type of business'}</div>
            <div className="check-grid" style={{ marginBottom: '48px' }}>
              {(locale === 'nl'
                ? [
                    ['/nl/website-check-makelaar', 'Makelaars'],
                    ['/nl/website-check-hovenier', 'Hoveniers'],
                    ['/nl/website-check-installatiebedrijf', 'Installatiebedrijven'],
                    ['/nl/website-check-restaurant', 'Restaurants'],
                  ]
                : locale === 'en'
                ? [
                    ['/en/website-check-makelaar', 'Real estate agents'],
                    ['/en/website-check-hovenier', 'Landscapers'],
                    ['/en/website-check-installatiebedrijf', 'Installation companies'],
                    ['/en/website-check-restaurant', 'Restaurants'],
                  ]
                : locale === 'de'
                  ? [['/en/website-check-makelaar', 'Branchen-Checks'],['/en/website-check-hovenier', 'Website prüfen'],['/en/website-check-installatiebedrijf', 'Website-Audit'],['/en/website-check-restaurant', 'Website-Check']]
                  : locale === 'fr'
                    ? [['/en/website-check-makelaar', 'Checks par secteur'],['/en/website-check-hovenier', 'Audit de site'],['/en/website-check-installatiebedrijf', 'Audit web'],['/en/website-check-restaurant', 'Test de site']]
                    : [['/en/website-check-makelaar', 'Checks por sector'],['/en/website-check-hovenier', 'Auditoría web'],['/en/website-check-installatiebedrijf', 'Auditoría de sitio'],['/en/website-check-restaurant', 'Comprobación web']]
              ).filter(([href]) => href !== location).map(([href, label]) => (
                <a className="check-card" key={href} href={href}><h2>{label}</h2><span className="text-link">{locale === 'nl' ? 'Bekijk check' : 'View check'} <ArrowRight /></span></a>
              ))}
            </div>
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
          <div className="page-frame footer-inner"><span>© {new Date().getFullYear()} SiteCheck AI</span><span className="legal-links">
            <a href={locale === 'nl' ? '/nl/privacy' : '/en/privacy'}>Privacy</a>
            <a href={locale === 'nl' ? '/nl/voorwaarden' : '/en/terms'}>{locale === 'nl' ? 'Voorwaarden' : 'Terms'}</a>
            <a href={locale === 'nl' ? '/nl/cookies' : '/en/cookies'}>Cookies</a>
            <a href={locale === 'nl' ? '/nl/herroepen' : '/en/withdraw'}>{locale === 'nl' ? 'Herroepen' : 'Withdraw'}</a>
          </span></div>
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
            <section className="section">
              <div className="page-frame">
                <div className="section-kicker">{locale === 'nl' ? 'Direct controleren' : 'Check your website'}</div>
                <div className="check-grid">
                  {(locale === 'nl'
                    ? [['/nl/free-website-audit','Gratis website audit'],['/nl/ai-website-audit','AI website audit'],['/nl/website-seo-checker','Website SEO checker'],['/nl/website-performance-check','Website performance check'],['/nl/website-conversion-audit','Website conversion audit'],['/nl/website-health-check','Website health check']]
                    : [['/en/free-website-audit','Free website audit'],['/en/ai-website-audit','AI website audit'],['/en/website-seo-checker','Website SEO checker'],['/en/website-performance-check','Website performance check'],['/en/website-conversion-audit','Website conversion audit'],['/en/website-health-check','Website health check']]
                  ).map(([href,label]) => <a className="check-card" key={href} href={href}><h2>{label}</h2><span className="text-link">{locale === 'nl' ? 'Bekijk check' : 'View check'} <ArrowRight /></span></a>)}
                </div>
              </div>
            </section>
          </>
        ) : article ? (
          <article><section className="hero"><div className="page-frame"><div className="reveal" style={{ maxWidth: '850px' }}>
            <div className="eyebrow"><a href={blogPath}>{locale === 'nl' ? 'Kennisbank' : 'Guides'}</a></div>
            <h1>{article[locale].title}</h1><p className="hero-lede">{article[locale].intro}</p>
          </div></div></section>
          <section className="section"><div className="page-frame" style={{ maxWidth: '820px' }}>
            <div style={{ marginBottom: '32px', fontSize: '0.95rem', opacity: 0.72 }}><a href={homePath}>SiteCheck AI</a> / <a href={blogPath}>{locale === 'nl' ? 'Kennisbank' : 'Guides'}</a> / {article[locale].title}</div>
            {article[locale].sections.map((section) => <section key={section.heading} style={{ marginBottom: '38px' }}><h2 className="section-title" style={{ fontSize: '1.65rem', marginBottom: '14px' }}>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p className="section-intro" key={paragraph} style={{ marginBottom: '12px' }}>{paragraph}</p>)}</section>)}
            <div className="section-kicker" style={{ marginTop: '48px' }}>{locale === 'nl' ? 'Verder lezen' : 'Read next'}</div>
            <div className="check-grid" style={{ marginBottom: '48px' }}>
              {(locale === 'nl'
                ? [
                    ['/nl/website-scan', 'Website scan'],
                    ['/nl/seo-check', 'SEO check'],
                    ['/nl/website-vindbaarheid-google', 'Beter vindbaar in Google'],
                    ['/nl/website-seo-verbeteren', 'Website SEO verbeteren'],
                    ['/nl/website-conversie-verbeteren', 'Website conversie verbeteren'],
                  ]
                : [
                    ['/en/website-scan', 'Website scan'],
                    ['/en/seo-check', 'SEO check'],
                    ['/en/website-vindbaarheid-google', 'Improve Google visibility'],
                    ['/en/website-seo-verbeteren', 'Improve website SEO'],
                    ['/en/website-conversie-verbeteren', 'Improve website conversion'],
                  ]
              ).slice(0, 4).map(([href, label]) => (
                <a className="check-card" key={href} href={href}><h2>{label}</h2><span className="text-link">{locale === 'nl' ? 'Bekijk onderwerp' : 'Explore topic'} <ArrowRight /></span></a>
              ))}
            </div>
            <div className="closing-box" style={{ marginTop: '48px' }}><h2>{article[locale].cta}</h2><p>{locale === 'nl' ? 'Bekijk direct welke signalen op jouw website aandacht verdienen.' : 'See which signals on your website deserve attention.'}</p><a className="scan-button" href={homePath}>{locale === 'nl' ? 'Start gratis scan' : 'Start free scan'} <ArrowRight /></a></div>
          </div></section></article>
        ) : <section className="hero"><div className="page-frame"><h1>{locale === 'nl' ? 'Artikel niet gevonden' : 'Article not found'}</h1></div></section>}
        <footer className="footer"><div className="page-frame footer-inner"><span>© {new Date().getFullYear()} SiteCheck AI</span><span>{locale === 'nl' ? 'Praktische kennis voor ondernemers' : 'Practical knowledge for business owners'}</span><span className="legal-links">
            <a href={locale === 'nl' ? '/nl/privacy' : '/en/privacy'}>Privacy</a>
            <a href={locale === 'nl' ? '/nl/voorwaarden' : '/en/terms'}>{locale === 'nl' ? 'Voorwaarden' : 'Terms'}</a>
            <a href={locale === 'nl' ? '/nl/cookies' : '/en/cookies'}>Cookies</a>
            <a href={locale === 'nl' ? '/nl/herroepen' : '/en/withdraw'}>{locale === 'nl' ? 'Herroepen' : 'Withdraw'}</a>
          </span></div></footer>
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
        <Route path="/de" component={Home} />
        <Route path="/fr" component={Home} />
        <Route path="/es" component={Home} />
        <Route path="/nl/blog" component={BlogPage} />
        <Route path="/en/blog" component={BlogPage} />
        <Route path="/nl/blog/:slug" component={BlogPage} />
        <Route path="/en/blog/:slug" component={BlogPage} />
        <Route path="/nl/privacy" component={() => <LegalPage type="privacy" />} />
        <Route path="/en/privacy" component={() => <LegalPage type="privacy" />} />
        <Route path="/nl/voorwaarden" component={() => <LegalPage type="terms" />} />
        <Route path="/en/terms" component={() => <LegalPage type="terms" />} />
        <Route path="/nl/cookies" component={() => <LegalPage type="cookies" />} />
        <Route path="/en/cookies" component={() => <LegalPage type="cookies" />} />
        <Route path="/nl/herroepen" component={() => <LegalPage type="withdraw" />} />
        <Route path="/en/withdraw" component={() => <LegalPage type="withdraw" />} />
        <Route path="/nl/:slug" component={SeoLandingPage} />
        <Route path="/en/:slug" component={SeoLandingPage} />
        <Route path="/de/:slug" component={SeoLandingPage} />
        <Route path="/fr/:slug" component={SeoLandingPage} />
        <Route path="/es/:slug" component={SeoLandingPage} />
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
