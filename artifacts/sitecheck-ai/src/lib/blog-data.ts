export type BlogSection = { heading: string; paragraphs: string[] };
export type BlogArticle = {
  slug: string;
  nl: { title: string; description: string; intro: string; sections: BlogSection[]; cta: string };
  en: { title: string; description: string; intro: string; sections: BlogSection[]; cta: string };
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "hoe-doe-je-een-seo-check",
    nl: {
      title: "Hoe doe je een SEO-check van je website?",
      description: "Leer hoe je zelf een SEO-check van je website uitvoert. Controleer titels, metabeschrijving, koppen, links, content en technische signalen.",
      intro: "Een SEO-check hoeft niet ingewikkeld te zijn. Met een vaste checklist kun je snel ontdekken of een pagina een goede basis heeft voor zoekmachines én bezoekers.",
      sections: [
        { heading: "Begin met de paginatitel en metabeschrijving", paragraphs: ["Controleer of iedere belangrijke pagina een duidelijke title heeft die beschrijft waar de pagina over gaat. Kijk ook of de metabeschrijving de bezoeker een goede reden geeft om het zoekresultaat te openen.", "Een goede titel is niet alleen een plek voor een zoekwoord. Hij moet vooral duidelijk maken wat iemand op de pagina kan verwachten."] },
        { heading: "Controleer de koppen en inhoud", paragraphs: ["Een logische structuur met één duidelijk hoofdonderwerp en herkenbare tussenkoppen maakt een pagina makkelijker te begrijpen. Controleer of de tekst daadwerkelijk antwoord geeft op de vraag waarvoor je gevonden wilt worden.", "Vermijd teksten die alleen voor zoekmachines lijken te zijn geschreven. Een bezoeker moet na het lezen echt geholpen zijn."] },
        { heading: "Kijk naar links en navigatie", paragraphs: ["Interne links helpen bezoekers en zoekmachines om verbanden tussen pagina's te begrijpen. Link daarom vanuit relevante teksten naar belangrijke diensten, producten en informatiepagina's.", "Controleer daarnaast of belangrijke pagina's niet ergens diep in de site verborgen zitten."] },
        { heading: "Vergeet techniek en mobiel niet", paragraphs: ["Controleer of de pagina snel genoeg laadt, mobiel goed werkt en technisch bereikbaar is voor zoekmachines. Een SEO-check is niet compleet wanneer je alleen naar tekst kijkt.", "Gebruik voor diepgaande performance-metingen aanvullende tools zoals Search Console en Lighthouse. Een snelle scan kan vooral helpen om duidelijke aandachtspunten te vinden."] },
        { heading: "Maak van de check een actielijst", paragraphs: ["Een lijst met twintig mogelijke verbeteringen is minder bruikbaar dan een korte prioriteitenlijst. Noteer daarom per probleem wat er misgaat, waarom het belangrijk is en wat je als eerste kunt aanpassen.", "Wil je snel zien welke signalen op jouw pagina aandacht verdienen? Start dan met de gratis website scan van SiteCheck AI."] }
      ],
      cta: "Doe een gratis SEO- en websitecheck met SiteCheck AI."
    },
    en: {
      title: "How do you perform an SEO check of your website?",
      description: "Learn how to perform an SEO check yourself. Review titles, meta descriptions, headings, links, content and technical signals.",
      intro: "An SEO check does not have to be complicated. A consistent checklist can quickly show whether a page has a solid foundation for search engines and visitors.",
      sections: [
        { heading: "Start with the page title and meta description", paragraphs: ["Check that every important page has a clear title describing what the page is about. Also check whether the meta description gives a searcher a useful reason to open the result.", "A good title is not simply a place to add a keyword. It should clearly communicate what the visitor will find on the page."] },
        { heading: "Review headings and content", paragraphs: ["A logical structure with a clear main topic and useful subheadings makes a page easier to understand. Check whether the content actually answers the question you want to be found for.", "Avoid writing text that appears to exist only for search engines. A visitor should genuinely get an answer or useful next step."] },
        { heading: "Check links and navigation", paragraphs: ["Internal links help visitors and search engines understand relationships between pages. Link from relevant content to important services, products and information pages.", "Also check that important pages are not hidden deep inside the site."] },
        { heading: "Do not forget technical and mobile checks", paragraphs: ["Check whether the page loads efficiently, works well on mobile and can be accessed by search engines. An SEO check is incomplete if you only review the copy.", "For deeper performance measurements, use additional tools such as Search Console and Lighthouse. A quick scan is useful for finding obvious areas that need attention."] },
        { heading: "Turn the check into an action list", paragraphs: ["A list of twenty possible improvements is less useful than a short priority list. For each issue, note what is wrong, why it matters and what you should change first.", "Want to see which signals on your page deserve attention? Start with the free SiteCheck AI website scan."] }
      ],
      cta: "Run a free SEO and website check with SiteCheck AI."
    }
  },
  {
    slug: "waarom-staat-mijn-website-niet-op-google",
    nl: {
      title: "Waarom staat mijn website niet op Google?",
      description: "Staat je website niet in Google? Ontdek mogelijke oorzaken zoals indexatie, technische blokkades, content, concurrentie en een nieuwe website.",
      intro: "Een website online zetten betekent niet automatisch dat iedere pagina direct in Google verschijnt. Er zijn verschillende technische en inhoudelijke redenen waarom een pagina niet zichtbaar kan zijn.",
      sections: [
        { heading: "Controleer eerst of Google je pagina kent", paragraphs: ["Gebruik Google Search Console om te controleren of Google de URL heeft ontdekt en verwerkt. Een nieuwe website of nieuwe pagina kan tijd nodig hebben voordat Google hem heeft gecrawld en geïndexeerd.", "Controleer ook of je pagina niet per ongeluk op noindex staat of door robots.txt wordt geblokkeerd."] },
        { heading: "Een nieuwe website heeft nog weinig geschiedenis", paragraphs: ["Een nieuwe website heeft meestal nog weinig externe verwijzingen en weinig opgebouwde zoekhistorie. Dat betekent niet dat je niet kunt ranken, maar het kan tijd kosten om zichtbaar te worden.", "Richt je eerst op duidelijke, nuttige pagina's die een concrete zoekvraag beantwoorden."] },
        { heading: "Techniek kan zichtbaarheid in de weg zitten", paragraphs: ["Broken links, verkeerde canonical-tags, blokkades voor crawlers of slecht bereikbare pagina's kunnen problemen veroorzaken. Controleer daarom niet alleen de tekst, maar ook de technische basis.", "Een sitemap helpt zoekmachines om URL's te ontdekken, maar een sitemap op zichzelf garandeert geen indexatie."] },
        { heading: "Content en zoekintentie bepalen ook de concurrentie", paragraphs: ["Zelfs wanneer een pagina geïndexeerd is, betekent dat niet dat hij hoog in de zoekresultaten staat. Google vergelijkt de inhoud met andere pagina's die dezelfde vraag beantwoorden.", "Maak daarom content die specifieker, duidelijker en nuttiger is voor jouw doelgroep in plaats van alleen meer tekst toe te voegen."] },
        { heading: "Maak een praktische controle", paragraphs: ["Begin met indexatie, techniek, inhoud en interne links. Daarna kun je in Search Console kijken op welke zoekopdrachten je al vertoningen krijgt.", "Wil je eerst snel zien welke zichtbare signalen op je website aandacht verdienen? Start dan een gratis SiteCheck AI-scan."] }
      ],
      cta: "Controleer je website gratis met SiteCheck AI."
    },
    en: {
      title: "Why isn't my website showing up on Google?",
      description: "Is your website not appearing in Google? Learn about possible causes including indexing, technical blocks, content, competition and new websites.",
      intro: "Putting a website online does not mean every page will immediately appear in Google. There are several technical and content-related reasons why a page may not be visible.",
      sections: [
        { heading: "First check whether Google knows the page", paragraphs: ["Use Google Search Console to check whether Google has discovered and processed the URL. A new website or page may need time to be crawled and indexed.", "Also check that the page is not accidentally marked noindex or blocked by robots.txt."] },
        { heading: "A new website has little history", paragraphs: ["A new website usually has few external references and little search history. That does not mean it cannot rank, but building visibility can take time.", "Start with clear, useful pages that answer specific questions for your audience."] },
        { heading: "Technical issues can block visibility", paragraphs: ["Broken links, incorrect canonical tags, crawler blocks or inaccessible pages can cause problems. Review the technical foundation as well as the copy.", "A sitemap helps search engines discover URLs, but a sitemap by itself does not guarantee indexing."] },
        { heading: "Content and search intent affect competition", paragraphs: ["Even when a page is indexed, it does not automatically rank highly. Google compares it with other pages that answer the same search.", "Focus on content that is more specific, clear and useful to your audience rather than simply adding more words."] },
        { heading: "Build a practical check", paragraphs: ["Start with indexing, technical signals, content and internal links. Then use Search Console to see which queries already generate impressions.", "Want a quick view of the visible signals on your website? Start a free SiteCheck AI scan."] }
      ],
      cta: "Check your website for free with SiteCheck AI."
    }
  },
  {
    slug: "hoe-snel-moet-een-website-zijn",
    nl: {
      title: "Hoe snel moet een website zijn?",
      description: "Ontdek waarom websitesnelheid belangrijk is, welke factoren invloed hebben en welke snelheidssignalen je kunt controleren.",
      intro: "Een snelle website voelt prettig voor bezoekers en voorkomt onnodige wachttijd. Toch is er niet één magisch aantal seconden dat voor iedere website bepaalt of hij goed is.",
      sections: [
        { heading: "Snelheid gaat over meer dan één getal", paragraphs: ["Laadtijd bestaat uit verschillende onderdelen: serverrespons, bestanden, afbeeldingen, scripts en het moment waarop de belangrijkste inhoud zichtbaar wordt.", "Daarom is het beter om meerdere signalen te bekijken dan alleen een stopwatch op de homepage."] },
        { heading: "Afbeeldingen zijn vaak een belangrijk aandachtspunt", paragraphs: ["Grote afbeeldingen kunnen veel data naar de browser sturen. Gebruik geschikte formaten, passende afmetingen en compressie zonder onnodig kwaliteitsverlies.", "Controleer vooral afbeeldingen die direct boven de vouw staan, omdat die invloed kunnen hebben op de eerste indruk."] },
        { heading: "Scripts en externe diensten tellen mee", paragraphs: ["Analytics, chatwidgets, video, advertenties en andere externe scripts kunnen extra requests en verwerking veroorzaken. Gebruik alleen wat je daadwerkelijk nodig hebt.", "Laad niet-kritische functionaliteit waar mogelijk pas wanneer die nodig is."] },
        { heading: "Mobiel verdient extra aandacht", paragraphs: ["Mobiele bezoekers hebben niet altijd dezelfde verbinding of hardware als desktopgebruikers. Een pagina die op een snelle laptop prima voelt, kan op mobiel merkbaar trager zijn.", "Test daarom belangrijke pagina's op echte mobiele omstandigheden en kijk naar Core Web Vitals wanneer je dieper wilt meten."] },
        { heading: "Gebruik een scan als eerste controle", paragraphs: ["Een snelle websitecheck kan duidelijke technische aandachtspunten aanwijzen. Voor diepgaande performance-analyse zijn gespecialiseerde tools nodig.", "SiteCheck AI kan je helpen om een eerste overzicht te krijgen van snelheid en andere website-signalen."] }
      ],
      cta: "Start een gratis website scan en ontdek technische aandachtspunten."
    },
    en: {
      title: "How fast should a website be?",
      description: "Learn why website speed matters, what affects performance and which speed-related signals you can check.",
      intro: "A fast website feels better for visitors and reduces unnecessary waiting. There is, however, no single magic number of seconds that defines a good website for every situation.",
      sections: [
        { heading: "Speed is more than one number", paragraphs: ["Loading performance includes server response, files, images, scripts and when the main content becomes visible.", "That is why it is better to look at several signals instead of using a stopwatch on the homepage."] },
        { heading: "Images are often an important factor", paragraphs: ["Large images can send a lot of data to the browser. Use suitable formats, appropriate dimensions and compression without unnecessary quality loss.", "Pay particular attention to images near the top of the page because they affect the first impression."] },
        { heading: "Scripts and third-party services count too", paragraphs: ["Analytics, chat widgets, video, advertising and other external scripts can add requests and processing. Keep only what you actually need.", "Where possible, load non-critical functionality when it is needed rather than immediately."] },
        { heading: "Mobile deserves extra attention", paragraphs: ["Mobile visitors may have different connections and hardware from desktop users. A page that feels fine on a fast laptop can feel noticeably slower on mobile.", "Test important pages in realistic mobile conditions and use Core Web Vitals when you need deeper measurement."] },
        { heading: "Use a scan as a first check", paragraphs: ["A quick website check can highlight obvious technical issues. Deeper performance analysis requires specialized tools.", "SiteCheck AI can give you a first overview of speed-related and other website signals."] }
      ],
      cta: "Run a free website scan and find technical areas to improve."
    }
  },
  {
    slug: "hoe-verbeter-je-de-conversie-van-je-website",
    nl: {
      title: "Hoe verbeter je de conversie van je website?",
      description: "Ontdek praktische manieren om websiteconversie te verbeteren met duidelijke actieknoppen, vertrouwen, relevante content en minder drempels.",
      intro: "Conversie begint bij duidelijkheid. Een bezoeker moet snel begrijpen wat je aanbiedt, waarom het relevant is en wat de volgende stap is.",
      sections: [
        { heading: "Maak de volgende stap duidelijk", paragraphs: ["Een bezoeker die interesse heeft, moet niet hoeven zoeken naar contact, offerte, afspraak of aankoop. Gebruik duidelijke actieknoppen op logische momenten.", "Een call-to-action werkt beter wanneer de tekst beschrijft wat er daarna gebeurt."] },
        { heading: "Laat zien waarom iemand voor jou kiest", paragraphs: ["Bezoekers willen weten of je betrouwbaar en relevant bent. Laat daarom concrete voordelen, ervaring, resultaten, reviews of andere geloofwaardige signalen zien wanneer die beschikbaar zijn.", "Vermijd algemene claims die niet worden onderbouwd."] },
        { heading: "Verminder onnodige drempels", paragraphs: ["Een te lang formulier, onduidelijke prijsinformatie of verplichte accountregistratie kan een bezoeker laten afhaken.", "Vraag alleen informatie die echt nodig is voor de volgende stap en leg uit wat iemand kan verwachten."] },
        { heading: "Zorg dat mobiel ook logisch werkt", paragraphs: ["Veel bezoekers bekijken websites op een smartphone. Knoppen, formulieren en navigatie moeten daarom ook op een klein scherm eenvoudig te gebruiken zijn.", "Controleer niet alleen of de pagina technisch responsive is, maar ook of de route naar contact of aankoop prettig voelt."] },
        { heading: "Meet en verbeter stap voor stap", paragraphs: ["Een scan kan mogelijke conversieproblemen signaleren, maar alleen echte gebruikersdata kan laten zien wat daadwerkelijk effect heeft.", "Gebruik daarom website-analyse als startpunt en combineer die later met analytics en experimenten."] }
      ],
      cta: "Ontdek gratis welke conversiesignalen jouw website laat zien."
    },
    en: {
      title: "How can you improve website conversion?",
      description: "Learn practical ways to improve website conversion with clear calls to action, trust signals, relevant content and fewer barriers.",
      intro: "Conversion starts with clarity. A visitor should quickly understand what you offer, why it matters and what the next step is.",
      sections: [
        { heading: "Make the next step obvious", paragraphs: ["A visitor who is interested should not have to search for contact, a quote, an appointment or a purchase option. Use clear calls to action at logical points.", "A call to action works better when its wording explains what happens next."] },
        { heading: "Show why someone should choose you", paragraphs: ["Visitors want to know whether you are credible and relevant. Show concrete benefits, experience, results, reviews or other credible signals when available.", "Avoid broad claims that are not supported by evidence."] },
        { heading: "Remove unnecessary friction", paragraphs: ["A long form, unclear pricing or a mandatory account can make visitors abandon the process.", "Ask only for information that is genuinely needed for the next step and explain what the visitor can expect."] },
        { heading: "Make the mobile journey easy", paragraphs: ["Many visitors use smartphones. Buttons, forms and navigation therefore need to remain easy to use on a small screen.", "Do not only check whether the page is technically responsive; check whether the path to contact or purchase feels straightforward."] },
        { heading: "Measure and improve step by step", paragraphs: ["A scan can flag possible conversion issues, but real user data is needed to understand actual impact.", "Use a website analysis as a starting point and combine it with analytics and experiments over time."] }
      ],
      cta: "See which conversion signals your website exposes with a free scan."
    }
  },
  {
    slug: "website-laten-analyseren-waar-moet-je-op-letten",
    nl: {
      title: "Website laten analyseren: waar moet je op letten?",
      description: "Waar moet een goede websiteanalyse naar kijken? Bekijk SEO, techniek, mobiel, content, vertrouwen en conversie.",
      intro: "Een websiteanalyse is pas nuttig als je na afloop weet wat je met de uitkomsten kunt doen. Kijk daarom niet alleen naar een score, maar naar de kwaliteit en bruikbaarheid van de bevindingen.",
      sections: [
        { heading: "Kijk naar de onderdelen die je bedrijf beïnvloeden", paragraphs: ["Een goede analyse combineert bijvoorbeeld vindbaarheid, technische kwaliteit, gebruikservaring, content en conversie. Zo voorkom je dat je alleen een technisch detail optimaliseert terwijl een belangrijk bedrijfsprobleem blijft liggen.", "Welke onderdelen het zwaarst wegen hangt af van het doel van je website."] },
        { heading: "Vraag om bewijs en context", paragraphs: ["Een melding als 'SEO is slecht' zegt weinig zonder uitleg. Een bruikbare analyse laat zien welk signaal is gevonden, waarom het relevant kan zijn en wat je kunt controleren of verbeteren.", "Dat maakt het rapport ook bruikbaar voor gesprekken met een webbouwer of marketingpartner."] },
        { heading: "Let op wat daadwerkelijk is gecontroleerd", paragraphs: ["Een tool moet duidelijk zijn over de scope. Een analyse van één opgehaalde pagina is iets anders dan een volledige crawl van een website.", "Transparantie over wat niet kon worden gecontroleerd voorkomt verkeerde conclusies."] },
        { heading: "Prioriteiten zijn belangrijker dan een lange lijst", paragraphs: ["Twintig losse verbeterpunten kunnen overweldigend zijn. Een goede analyse helpt je bepalen welke punten eerst aandacht verdienen.", "Begin met problemen die bezoekers, vindbaarheid, vertrouwen of een belangrijke conversiestap direct kunnen beïnvloeden."] },
        { heading: "Gebruik automatische analyse als startpunt", paragraphs: ["Automatische analyse is handig om snel patronen en duidelijke signalen te vinden. Voor strategie, merkpositionering en complexe technische situaties blijft menselijke beoordeling waardevol.", "SiteCheck AI combineert meetbare signalen met begrijpelijke AI-aanbevelingen zodat je een praktisch startpunt hebt."] }
      ],
      cta: "Laat je website gratis analyseren met SiteCheck AI."
    },
    en: {
      title: "Website analysis: what should you look for?",
      description: "What should a useful website analysis cover? Review SEO, technical quality, mobile experience, content, trust and conversion.",
      intro: "A website analysis is useful only when you know what to do with the results. Look beyond a score and focus on the quality and usefulness of the findings.",
      sections: [
        { heading: "Review the areas that affect the business", paragraphs: ["A useful analysis can combine search visibility, technical quality, user experience, content and conversion. This helps avoid optimizing a small technical detail while a larger business issue remains.", "The most important areas depend on the purpose of the website."] },
        { heading: "Ask for evidence and context", paragraphs: ["A message such as 'SEO is bad' is not very useful without an explanation. A useful analysis shows what signal was found, why it may matter and what you can check or improve.", "This also makes the report easier to discuss with a developer or marketing partner."] },
        { heading: "Check what was actually analyzed", paragraphs: ["A tool should be clear about its scope. An analysis of one fetched page is different from a full website crawl.", "Being transparent about what could not be checked helps prevent incorrect conclusions."] },
        { heading: "Priorities matter more than a long list", paragraphs: ["Twenty isolated recommendations can be overwhelming. A useful analysis helps you decide what deserves attention first.", "Start with issues that can directly affect visitors, visibility, trust or an important conversion path."] },
        { heading: "Use automated analysis as a starting point", paragraphs: ["Automated analysis is useful for finding patterns and clear signals quickly. Human review remains valuable for strategy, positioning and complex technical situations.", "SiteCheck AI combines measurable signals with understandable AI recommendations to give you a practical starting point."] }
      ],
      cta: "Analyze your website for free with SiteCheck AI."
    }
  },
  {
    slug: "wat-is-een-seo-audit",
    nl: {
      title: "Wat is een SEO-audit?",
      description: "Lees wat een SEO-audit is, welke onderdelen je controleert en wat het verschil is met een snelle SEO-check.",
      intro: "Een SEO-audit is een gestructureerde beoordeling van factoren die invloed kunnen hebben op de organische vindbaarheid van een website.",
      sections: [
        { heading: "Een audit gaat verder dan alleen zoekwoorden", paragraphs: ["Bij SEO spelen techniek, content, interne links, indexatie, structuur en gebruikerservaring allemaal een rol. Een audit probeert die onderdelen in samenhang te bekijken.", "Zoekwoorden blijven relevant, maar alleen een lijst met zoekwoorden vertelt je niet of een website technisch bereikbaar en inhoudelijk nuttig is."] },
        { heading: "Technische SEO", paragraphs: ["Technische onderdelen kunnen bijvoorbeeld gaan over crawlbaarheid, indexatie, redirects, canonical-tags, sitemap, mobiele werking en prestaties.", "Welke controles nodig zijn hangt af van de omvang en techniek van de website."] },
        { heading: "Content en zoekintentie", paragraphs: ["Controleer of pagina's daadwerkelijk aansluiten op de vragen van de doelgroep. Een pagina kan technisch perfect zijn en toch weinig waarde bieden wanneer de inhoud niet aansluit op de zoekintentie.", "Kijk ook naar overlap tussen pagina's en naar belangrijke onderwerpen die nog ontbreken."] },
        { heading: "Interne links en structuur", paragraphs: ["Een duidelijke sitestructuur helpt bezoekers navigeren en maakt relaties tussen pagina's duidelijker. Belangrijke pagina's moeten logisch bereikbaar zijn.", "Gebruik beschrijvende linkteksten zodat de bestemming van een link duidelijk is."] },
        { heading: "SEO-audit versus snelle check", paragraphs: ["Een snelle SEO-check geeft een eerste overzicht van zichtbare signalen. Een volledige audit kan veel dieper gaan en vraagt vaak meer data en soms menselijke beoordeling.", "SiteCheck AI is bedoeld als praktische eerste analyse, niet als vervanging voor iedere gespecialiseerde SEO-audit."] }
      ],
      cta: "Begin met een gratis SEO-check van je website."
    },
    en: {
      title: "What is an SEO audit?",
      description: "Learn what an SEO audit is, which areas it covers and how it differs from a quick SEO check.",
      intro: "An SEO audit is a structured assessment of factors that can influence a website's organic search visibility.",
      sections: [
        { heading: "An audit is more than keywords", paragraphs: ["SEO can involve technical accessibility, content, internal links, indexing, structure and user experience. An audit looks at these areas together.", "Keywords remain relevant, but a keyword list does not tell you whether a site is technically accessible or useful to visitors."] },
        { heading: "Technical SEO", paragraphs: ["Technical areas can include crawlability, indexing, redirects, canonical tags, sitemaps, mobile behavior and performance.", "The right checks depend on the size and technology of the website."] },
        { heading: "Content and search intent", paragraphs: ["Check whether pages actually match the questions and needs of the target audience. A technically perfect page can still provide little value if it does not satisfy search intent.", "Also look for topic overlap and important subjects that are missing."] },
        { heading: "Internal links and structure", paragraphs: ["A clear site structure helps visitors navigate and makes relationships between pages easier to understand. Important pages should be logically accessible.", "Use descriptive anchor text so the destination of a link is clear."] },
        { heading: "SEO audit versus quick check", paragraphs: ["A quick SEO check provides a first view of visible signals. A full audit can go much deeper and often needs more data and human review.", "SiteCheck AI is designed as a practical first analysis, not a replacement for every specialized SEO audit."] }
      ],
      cta: "Start with a free SEO check of your website."
    }
  },
  {
    slug: "gratis-website-scan-wat-wordt-er-gecontroleerd",
    nl: {
      title: "Gratis website scan: wat wordt er gecontroleerd?",
      description: "Wat controleert een gratis website scan? Bekijk welke SEO-, technische, mobiele, content- en conversiesignalen je kunt laten beoordelen.",
      intro: "Een gratis website scan is vooral handig als eerste diagnose. Je wilt snel weten waar mogelijke verbeterpunten zitten voordat je tijd of geld in grotere optimalisaties steekt.",
      sections: [
        { heading: "SEO-signalen", paragraphs: ["Een scan kan onder andere kijken naar paginatitel, metabeschrijving, koppen, links en andere zichtbare SEO-signalen. Daarmee krijg je een eerste beeld van de basis.", "Een automatische scan kan niet alle aspecten van zoekmachineoptimalisatie beoordelen."] },
        { heading: "Techniek en snelheid", paragraphs: ["Technische controles kunnen signalen geven over bereikbaarheid, responstijd, paginagrootte, compressie en andere meetbare kenmerken.", "Voor diepgaande performance-analyse zijn aanvullende tools nodig."] },
        { heading: "Mobiele ervaring", paragraphs: ["Een website moet niet alleen op een groot scherm goed werken. Navigatie, tekst, knoppen en formulieren moeten ook op mobiel bruikbaar zijn.", "Een scan kan zichtbare mobiele signalen signaleren, maar echte gebruikstests blijven waardevol."] },
        { heading: "Content, vertrouwen en conversie", paragraphs: ["De inhoud moet duidelijk maken wat je aanbiedt en waarom een bezoeker verder zou gaan. Contactmogelijkheden, actieknoppen en vertrouwen spelen daarbij een rol.", "Een scan kan mogelijke aandachtspunten vinden, maar kan geen omzet of conversiestijging garanderen."] },
        { heading: "Van gratis scan naar volledig rapport", paragraphs: ["Een gratis scan is bedoeld als eerste overzicht. Wie meer detail wil, kan bij SiteCheck AI het volledige rapport voor €29 eenmalig aanschaffen.", "Het betaalde rapport bevat meer verbeterpunten en concrete AI-voorstellen."] }
      ],
      cta: "Start vandaag gratis met je website scan."
    },
    en: {
      title: "Free website scan: what does it check?",
      description: "What does a free website scan check? See which SEO, technical, mobile, content and conversion signals can be assessed.",
      intro: "A free website scan is useful as a first diagnosis. You want to know where potential improvements are before investing more time or money.",
      sections: [
        { heading: "SEO signals", paragraphs: ["A scan can review page titles, meta descriptions, headings, links and other visible SEO signals. This gives you a first view of the foundation.", "An automated scan cannot assess every aspect of search engine optimization."] },
        { heading: "Technical and speed signals", paragraphs: ["Technical checks can highlight accessibility, response time, page size, compression and other measurable characteristics.", "Use additional tools when you need deeper performance analysis."] },
        { heading: "Mobile experience", paragraphs: ["A website should not only work well on a large screen. Navigation, text, buttons and forms also need to be usable on mobile.", "A scan can flag visible mobile signals, while real-user testing remains valuable."] },
        { heading: "Content, trust and conversion", paragraphs: ["Content should make it clear what you offer and why a visitor should continue. Contact paths, calls to action and trust signals matter here.", "A scan can flag potential issues but cannot guarantee revenue or conversion increases."] },
        { heading: "From free scan to full report", paragraphs: ["The free scan is designed as a first overview. If you want more detail, SiteCheck AI offers the full report for a one-time payment of €29.", "The paid report includes more improvement points and concrete AI suggestions."] }
      ],
      cta: "Start your free website scan today."
    }
  },
  {
    slug: "website-optimaliseren-voor-google-checklist",
    nl: {
      title: "Website optimaliseren voor Google: een praktische checklist",
      description: "Gebruik deze praktische checklist om je website te verbeteren voor Google: techniek, content, titels, links, mobiel en indexatie.",
      intro: "Website-optimalisatie voor Google bestaat uit veel kleine onderdelen. Met deze checklist kun je de belangrijkste basis stap voor stap nalopen.",
      sections: [
        { heading: "1. Controleer indexatie", paragraphs: ["Zorg dat belangrijke pagina's bereikbaar zijn voor zoekmachines en niet onbedoeld op noindex staan. Gebruik Search Console om te zien hoe Google de URL's verwerkt.", "Een sitemap kan helpen bij het ontdekken van pagina's."] },
        { heading: "2. Schrijf duidelijke titels en beschrijvingen", paragraphs: ["Elke belangrijke pagina verdient een duidelijke title en een passende metabeschrijving. Beschrijf de inhoud in taal die je doelgroep begrijpt.", "Gebruik niet dezelfde titel voor alle pagina's."] },
        { heading: "3. Maak content die een vraag beantwoordt", paragraphs: ["Denk vanuit de bezoeker. Welke vraag probeert iemand op te lossen en geeft jouw pagina daar een compleet antwoord op?", "Voeg alleen informatie toe die daadwerkelijk helpt; lengte op zichzelf is geen kwaliteitsmaatstaf."] },
        { heading: "4. Verbeter interne links", paragraphs: ["Link relevante pagina's met duidelijke ankerteksten aan elkaar. Zo kunnen bezoekers makkelijker verder en ontstaat een logischer geheel.", "Controleer of belangrijke commerciële pagina's vanuit relevante informatieve pagina's bereikbaar zijn."] },
        { heading: "5. Controleer mobiel en snelheid", paragraphs: ["Test belangrijke pagina's op mobiele schermen en controleer prestaties. Kijk naar afbeeldingen, scripts, serverrespons en Core Web Vitals wanneer je dieper wilt meten.", "Los eerst problemen op die bezoekers direct hinderen."] }
      ],
      cta: "Laat je checklist automatisch als eerste controle uitvoeren met SiteCheck AI."
    },
    en: {
      title: "How to optimize a website for Google: a practical checklist",
      description: "Use this practical checklist to improve your website for Google: technical SEO, content, titles, links, mobile and indexing.",
      intro: "Website optimization for Google consists of many small areas. Use this checklist to review the most important basics step by step.",
      sections: [
        { heading: "1. Check indexing", paragraphs: ["Make sure important pages are accessible to search engines and are not accidentally marked noindex. Use Search Console to understand how Google processes your URLs.", "A sitemap can help with URL discovery."] },
        { heading: "2. Write clear titles and descriptions", paragraphs: ["Every important page should have a clear title and useful meta description. Describe the content in language your audience understands.", "Avoid using the same title for every page."] },
        { heading: "3. Create content that answers a question", paragraphs: ["Think from the visitor's perspective. What problem or question are they trying to solve, and does your page provide a complete answer?", "Add information because it helps, not simply to make the page longer."] },
        { heading: "4. Improve internal links", paragraphs: ["Connect relevant pages with descriptive anchor text. This helps visitors continue their journey and creates a clearer site structure.", "Check whether important commercial pages can be reached naturally from relevant informational pages."] },
        { heading: "5. Check mobile and performance", paragraphs: ["Test important pages on mobile screens and review performance. Look at images, scripts, server response and Core Web Vitals when deeper measurement is needed.", "Fix issues that directly hinder visitors first."] }
      ],
      cta: "Use SiteCheck AI for an automated first check of your website."
    }
  },
  {
    slug: "hoe-weet-je-of-je-website-goed-is",
    nl: {
      title: "Hoe weet je of je website goed is?",
      description: "Een goede website is meer dan een mooi ontwerp. Ontdek welke onderdelen je kunt controleren op vindbaarheid, gebruiksgemak, vertrouwen en conversie.",
      intro: "Een website kan er professioneel uitzien en toch kansen laten liggen. Kijk daarom naar wat de website daadwerkelijk voor bezoekers en je bedrijf doet.",
      sections: [
        { heading: "Kunnen bezoekers direct begrijpen wat je doet?", paragraphs: ["De eerste indruk moet snel duidelijk maken wie je helpt, wat je aanbiedt en waarom iemand verder zou lezen.", "Als een bezoeker eerst moet zoeken naar de kern van je aanbod, is dat een duidelijk verbeterpunt."] },
        { heading: "Kunnen mensen je makkelijk vinden?", paragraphs: ["Een goede website heeft een logische structuur en bevat pagina's die aansluiten op relevante zoekvragen. Controleer titels, koppen, interne links en indexatie.", "Denk niet alleen aan je homepage: diensten en belangrijke onderwerpen verdienen vaak hun eigen pagina."] },
        { heading: "Is de website prettig te gebruiken?", paragraphs: ["Navigatie, leesbaarheid, mobiele bediening en snelheid beïnvloeden de ervaring. Een bezoeker moet zonder onnodige drempels kunnen vinden wat hij zoekt.", "Controleer belangrijke routes op zowel desktop als mobiel."] },
        { heading: "Wekt de website vertrouwen?", paragraphs: ["Duidelijke contactgegevens, bewijs van ervaring, reviews en een professioneel verhaal kunnen onzekerheid verminderen. Gebruik alleen signalen die echt bij je bedrijf passen.", "Consistentie in teksten, prijzen en contactinformatie is minstens zo belangrijk."] },
        { heading: "Helpt de website je bedrijf vooruit?", paragraphs: ["Uiteindelijk moet de website een doel dienen: contact, offerte, afspraak, verkoop, informatie of een andere actie.", "Gebruik analyse als startpunt en meet daarna met echte gebruikersdata wat werkt."] }
      ],
      cta: "Krijg een eerste objectieve blik op je website met SiteCheck AI."
    },
    en: {
      title: "How do you know if your website is good?",
      description: "A good website is more than attractive design. Learn what to check for visibility, usability, trust and conversion.",
      intro: "A website can look professional and still miss important opportunities. Look at what the site actually does for visitors and the business.",
      sections: [
        { heading: "Can visitors understand what you do immediately?", paragraphs: ["The first impression should quickly explain who you help, what you offer and why someone should continue reading.", "If visitors have to search for the core offer, that is a clear improvement opportunity."] },
        { heading: "Can people find you?", paragraphs: ["A good website has a logical structure and pages that match relevant search questions. Review titles, headings, internal links and indexing.", "Do not focus only on the homepage; important services and topics often deserve dedicated pages."] },
        { heading: "Is the website easy to use?", paragraphs: ["Navigation, readability, mobile controls and speed affect the experience. Visitors should be able to find what they need without unnecessary friction.", "Check important journeys on both desktop and mobile."] },
        { heading: "Does the website build trust?", paragraphs: ["Clear contact details, evidence of experience, reviews and a professional story can reduce uncertainty. Use only signals that genuinely apply to your business.", "Consistency in copy, pricing and contact information matters too."] },
        { heading: "Does the website support the business?", paragraphs: ["Ultimately, a website should serve a purpose: contact, a quote, an appointment, a sale, information or another action.", "Use analysis as a starting point and then measure real user behavior to understand what works."] }
      ],
      cta: "Get a first objective view of your website with SiteCheck AI."
    }
  },
  {
    slug: "technische-seo-checklist",
    nl: {
      title: "Technische SEO-checklist voor websites",
      description: "Een praktische technische SEO-checklist voor websites. Controleer indexatie, crawlbaarheid, redirects, canonical, sitemap, mobiel en prestaties.",
      intro: "Technische SEO gaat over de voorwaarden waaronder zoekmachines je pagina's kunnen vinden, begrijpen en verwerken. Deze checklist helpt je de basis te controleren.",
      sections: [
        { heading: "Crawlbaarheid en indexatie", paragraphs: ["Controleer of zoekmachines toegang hebben tot belangrijke pagina's en of er geen onbedoelde blokkades zijn. Kijk ook naar noindex-instellingen.", "Gebruik Search Console om concrete indexatieproblemen verder te onderzoeken."] },
        { heading: "Canonical en dubbele URL's", paragraphs: ["Wanneer dezelfde inhoud via meerdere URL's bereikbaar is, kan het belangrijk zijn om de voorkeurs-URL duidelijk te maken. Controleer canonical-tags en redirects.", "Maak geen redirects of canonicals alleen omdat een checklist het noemt; ze moeten passen bij de daadwerkelijke URL-structuur."] },
        { heading: "Sitemap en interne links", paragraphs: ["Een XML-sitemap kan zoekmachines helpen belangrijke URL's te ontdekken. Interne links zorgen daarnaast voor een logische route door je website.", "Controleer regelmatig op kapotte interne links en onbereikbare belangrijke pagina's."] },
        { heading: "Mobiel en beveiliging", paragraphs: ["De website moet goed werken op mobiele apparaten en via HTTPS worden aangeboden. Controleer knoppen, formulieren, menu's en belangrijke content op kleine schermen.", "Een beveiligde verbinding is inmiddels de normale basis voor websites."] },
        { heading: "Prestaties en monitoring", paragraphs: ["Controleer Core Web Vitals en andere performance-signalen met geschikte tools. Houd veranderingen bij nadat je technische wijzigingen hebt gedaan.", "Een automatische website scan kan helpen om opvallende signalen als eerste te vinden, maar vervangt geen volledige technische audit."] }
      ],
      cta: "Start met een gratis technische websitecheck."
    },
    en: {
      title: "Technical SEO checklist for websites",
      description: "A practical technical SEO checklist covering indexing, crawlability, redirects, canonical tags, sitemaps, mobile and performance.",
      intro: "Technical SEO covers the conditions that allow search engines to discover, understand and process your pages. Use this checklist to review the basics.",
      sections: [
        { heading: "Crawlability and indexing", paragraphs: ["Check that search engines can access important pages and that there are no accidental blocks. Also review noindex settings.", "Use Search Console to investigate specific indexing issues."] },
        { heading: "Canonical URLs and duplicates", paragraphs: ["When similar content is accessible through multiple URLs, it can be useful to signal the preferred URL. Review canonical tags and redirects.", "Do not add redirects or canonicals simply because a checklist says so; they should reflect the actual URL structure."] },
        { heading: "Sitemap and internal links", paragraphs: ["An XML sitemap can help search engines discover important URLs. Internal links also create a logical route through the website.", "Regularly check for broken internal links and important pages that cannot be reached naturally."] },
        { heading: "Mobile and security", paragraphs: ["The website should work well on mobile devices and use HTTPS. Check buttons, forms, menus and important content on small screens.", "A secure connection is standard practice for modern websites."] },
        { heading: "Performance and monitoring", paragraphs: ["Use suitable tools to review Core Web Vitals and other performance signals. Track changes after technical updates.", "An automated website scan can highlight obvious signals as a first step, but it does not replace a full technical audit."] }
      ],
      cta: "Start with a free technical website check."
    }
  },
  {
    slug: "website-checklist-voor-ondernemers",
    nl: {
      title: "Website checklist voor ondernemers",
      description: "Een eenvoudige website checklist voor ondernemers. Controleer eerste indruk, aanbod, SEO, mobiel, vertrouwen, contact en conversie.",
      intro: "Je hoeft geen webdeveloper te zijn om de belangrijkste onderdelen van je website te controleren. Met deze checklist kun je in korte tijd de grootste aandachtspunten vinden.",
      sections: [
        { heading: "1. Eerste indruk", paragraphs: ["Is binnen enkele seconden duidelijk wat je bedrijf doet en voor wie? Staat de belangrijkste boodschap niet verstopt onder lange introducties?", "Bekijk je homepage alsof je je bedrijf voor het eerst ziet."] },
        { heading: "2. Aanbod en bewijs", paragraphs: ["Zijn je diensten of producten concreet beschreven? Laat je zien waarom klanten voor jou kiezen en is relevante bewijsvoering makkelijk te vinden?", "Vermijd vage marketingtaal wanneer een concreet voordeel beter werkt."] },
        { heading: "3. Vindbaarheid", paragraphs: ["Hebben belangrijke diensten eigen pagina's? Zijn titels, koppen, metabeschrijvingen en interne links logisch ingericht?", "Controleer daarnaast indexatie in Search Console."] },
        { heading: "4. Contact en conversie", paragraphs: ["Kan een geïnteresseerde makkelijk contact opnemen of de volgende stap zetten? Test formulieren, telefoonnummers, e-mailadressen en knoppen.", "Maak de gewenste actie duidelijk zonder de bezoeker te overspoelen met keuzes."] },
        { heading: "5. Mobiel en techniek", paragraphs: ["Open de website op je telefoon en controleer snelheid, leesbaarheid, menu's en formulieren. Kijk ook naar beveiliging en technische fouten.", "Een korte scan kan helpen om punten te vinden die je zelf gemakkelijk over het hoofd ziet."] }
      ],
      cta: "Loop deze checklist automatisch na met een gratis SiteCheck AI-scan."
    },
    en: {
      title: "Website checklist for business owners",
      description: "A simple website checklist for business owners. Review first impression, offer, SEO, mobile, trust, contact and conversion.",
      intro: "You do not need to be a developer to review the most important parts of your website. This checklist helps you find major issues quickly.",
      sections: [
        { heading: "1. First impression", paragraphs: ["Can someone understand what your business does and who it serves within a few seconds? Is the core message easy to find?", "Look at the homepage as if you were seeing the business for the first time."] },
        { heading: "2. Offer and proof", paragraphs: ["Are your services or products explained clearly? Do you show why customers should choose you and can visitors find relevant proof?", "Avoid vague marketing language when a concrete benefit would be clearer."] },
        { heading: "3. Search visibility", paragraphs: ["Do important services have dedicated pages? Are titles, headings, meta descriptions and internal links structured logically?", "Also check indexing in Search Console."] },
        { heading: "4. Contact and conversion", paragraphs: ["Can an interested visitor easily contact you or take the next step? Test forms, phone numbers, email addresses and buttons.", "Make the desired action clear without overwhelming visitors with too many choices."] },
        { heading: "5. Mobile and technical quality", paragraphs: ["Open the site on your phone and check speed, readability, menus and forms. Also review security and technical errors.", "A quick scan can highlight issues that are easy to overlook yourself."] }
      ],
      cta: "Run this checklist automatically with a free SiteCheck AI scan."
    }
  },
  {
    slug: "website-controleren-voor-livegang",
    nl: {
      title: "Website controleren voor livegang: praktische checklist",
      description: "Controleer je website voor livegang op SEO, mobiel, techniek, formulieren, vertrouwen en conversie met deze praktische checklist.",
      intro: "Een website kan er klaar uitzien en toch belangrijke fouten bevatten. Controleer vóór livegang de onderdelen die bezoekers, zoekmachines en nieuwe aanvragen direct raken.",
      sections: [
        { heading: "Controleer eerst de belangrijkste pagina's", paragraphs: ["Open de homepage, dienstenpagina's, contactpagina en andere pagina's die bezoekers nodig hebben om een beslissing te nemen.", "Controleer of navigatie en interne links logisch werken en nergens naar een oude of verkeerde URL verwijzen."] },
        { heading: "Test formulieren en contact", paragraphs: ["Verstuur ieder belangrijk formulier zelf en controleer of de bevestiging en opvolging werken. Test ook telefoonnummer, e-mailadres en eventuele afspraaklinks.", "Een technisch kleine fout kan een directe aanvraag kosten."] },
        { heading: "Controleer SEO-basis", paragraphs: ["Controleer paginatitels, metabeschrijvingen, hoofdkoppen, canonicals, robots.txt, sitemap en indexeerbaarheid.", "Zorg dat belangrijke pagina's via normale links bereikbaar zijn en niet per ongeluk op noindex staan."] },
        { heading: "Test mobiel en snelheid", paragraphs: ["Bekijk de belangrijkste routes op een echte telefoon. Let op knoppen, formulieren, menu's, afbeeldingen en tekstgrootte.", "Gebruik aanvullende performance-tools wanneer je diepgaand wilt meten; een snelle scan is vooral een eerste controle."] },
        { heading: "Laat een onafhankelijke scan meekijken", paragraphs: ["Een tweede paar ogen kan patronen vinden die je als maker niet meer ziet. SiteCheck AI kan meetbare signalen automatisch controleren en vertalen naar praktische verbeterpunten.", "Gebruik de uitkomst als laatste controle vóór je de website actief gaat promoten."] }
      ],
      cta: "Controleer je website gratis vóór livegang."
    },
    en: {
      title: "Website launch checklist: what to check before going live",
      description: "Check your website before launch for SEO, mobile usability, technical issues, forms, trust and conversion.",
      intro: "A website can look ready while still containing important issues. Before launch, check the areas that directly affect visitors, search engines and new leads.",
      sections: [
        { heading: "Check the key pages first", paragraphs: ["Open the homepage, service pages, contact page and the pages visitors need to make a decision.", "Make sure navigation and internal links work and do not point to old or incorrect URLs."] },
        { heading: "Test forms and contact paths", paragraphs: ["Submit every important form yourself and verify confirmation and follow-up. Also test phone numbers, email addresses and booking links.", "A small technical error can cost a real enquiry."] },
        { heading: "Review the SEO foundation", paragraphs: ["Check page titles, meta descriptions, headings, canonicals, robots.txt, sitemap and indexability.", "Make sure important pages are reachable through normal links and are not accidentally marked noindex."] },
        { heading: "Test mobile and performance", paragraphs: ["Review the main journeys on a real phone. Check buttons, forms, menus, images and text size.", "Use specialized performance tools when you need deeper measurement; a quick scan is useful as a first check."] },
        { heading: "Use an independent scan", paragraphs: ["A second set of eyes can find patterns the site owner no longer notices. SiteCheck AI checks measurable signals and turns them into practical improvements.", "Use the result as a final quality check before promoting the new site."] }
      ],
      cta: "Run a free website check before launch."
    }
  },
  {
    slug: "website-krijgt-bezoekers-maar-geen-aanvragen",
    nl: {
      title: "Website krijgt bezoekers maar geen aanvragen: waar kijk je naar?",
      description: "Krijgt je website bezoekers maar weinig aanvragen? Controleer waardepropositie, CTA's, vertrouwen, contact en gebruikservaring.",
      intro: "Meer verkeer lost niet automatisch een conversieprobleem op. Als bezoekers komen maar weinig actie ondernemen, kijk dan eerst naar duidelijkheid, vertrouwen en de volgende stap.",
      sections: [
        { heading: "Is direct duidelijk wat je aanbiedt?", paragraphs: ["Een bezoeker moet snel begrijpen wat je doet, voor wie het bedoeld is en waarom het relevant is.", "Een sterke eerste boodschap is concreter dan algemene termen als kwaliteit, service of maatwerk."] },
        { heading: "Is de volgende stap zichtbaar?", paragraphs: ["Gebruik duidelijke actieknoppen zoals offerte aanvragen, afspraak maken of contact opnemen wanneer dat past bij je bedrijfsdoel.", "Laat bezoekers niet zelf zoeken naar de route die jij uiteindelijk wilt dat ze nemen."] },
        { heading: "Is er voldoende vertrouwen?", paragraphs: ["Laat relevante ervaring, reviews, cases, keurmerken, garanties of andere geloofwaardige signalen zien wanneer je die hebt.", "Zorg dat bewijs aansluit op de twijfel die een potentiële klant waarschijnlijk heeft."] },
        { heading: "Zitten er onnodige drempels?", paragraphs: ["Lange formulieren, onduidelijke prijzen, verplichte accounts of ingewikkelde navigatie kunnen actie moeilijker maken.", "Vraag alleen wat nodig is voor de volgende stap en maak duidelijk wat er na een aanvraag gebeurt."] },
        { heading: "Meet voordat je grote wijzigingen doet", paragraphs: ["Een scan kan mogelijke problemen signaleren, maar echte analytics en experimenten laten zien wat bezoekers daadwerkelijk doen.", "Gebruik SiteCheck AI als snelle diagnose en combineer de bevindingen met je eigen conversiedata."] }
      ],
      cta: "Laat gratis controleren welke conversiesignalen je website laat zien."
    },
    en: {
      title: "Your website gets visitors but no enquiries: what should you check?",
      description: "If your website gets traffic but few enquiries, review your value proposition, calls to action, trust signals, contact paths and user experience.",
      intro: "More traffic does not automatically solve a conversion problem. If visitors arrive but rarely take action, start with clarity, trust and the next step.",
      sections: [
        { heading: "Is the offer clear immediately?", paragraphs: ["Visitors should quickly understand what you do, who it is for and why it matters.", "A concrete value proposition is usually clearer than generic claims about quality, service or expertise."] },
        { heading: "Is the next step obvious?", paragraphs: ["Use clear calls to action such as request a quote, book an appointment or get in touch when they fit your business goal.", "Do not make visitors search for the action you ultimately want them to take."] },
        { heading: "Is there enough trust?", paragraphs: ["Show relevant experience, reviews, cases, certifications, guarantees or other credible signals when available.", "Match the proof to the doubts a potential customer is likely to have."] },
        { heading: "Are there unnecessary barriers?", paragraphs: ["Long forms, unclear pricing, mandatory accounts or complicated navigation can make action harder.", "Ask only for what is needed for the next step and explain what happens after an enquiry."] },
        { heading: "Measure before making major changes", paragraphs: ["A scan can flag possible issues, but analytics and experiments show what visitors actually do.", "Use SiteCheck AI as a quick diagnosis and combine its findings with your own conversion data."] }
      ],
      cta: "Check your website's conversion signals for free."
    }
  },
  {
    slug: "ai-website-audit-wat-heb-je-eraan",
    nl: {
      title: "AI website audit: wat heb je eraan?",
      description: "Wat kan een AI website audit wel en niet? Ontdek hoe automatische website-analyse helpt bij SEO, techniek, content en conversie.",
      intro: "AI kan een website snel analyseren, maar een goede AI-audit moet duidelijk zijn over wat daadwerkelijk is gecontroleerd. Gebruik automatisering vooral om sneller van signalen naar actie te gaan.",
      sections: [
        { heading: "Waar AI goed in kan zijn", paragraphs: ["AI kan veel meetgegevens en tekstuele signalen snel samenvatten, patronen herkennen en technische bevindingen begrijpelijk uitleggen.", "Dat is vooral nuttig wanneer je snel een eerste diagnose wilt zonder zelf tientallen controles uit te voeren."] },
        { heading: "Waar automatische analyse grenzen heeft", paragraphs: ["Een tool ziet niet automatisch iedere pagina, gebruikerssituatie of bedrijfsdoelstelling. Een analyse van één opgehaalde pagina is geen volledige crawl.", "Goede software maakt daarom duidelijk wat wel en niet is gecontroleerd."] },
        { heading: "Van score naar concrete actie", paragraphs: ["Een cijfer alleen vertelt je niet wat je moet doen. Nuttige aanbevelingen koppelen een gevonden signaal aan het belang ervan en een concrete volgende stap.", "Dat maakt een rapport bruikbaarder voor ondernemers en voor gesprekken met een webbouwer."] },
        { heading: "Gebruik AI als versneller", paragraphs: ["Voor strategie, merkpositionering en complexe technische keuzes blijft menselijke beoordeling belangrijk.", "AI is het meest nuttig wanneer het de eerste analyse versnelt en mensen helpt om sneller de juiste vervolgvragen te stellen."] },
        { heading: "Probeer het met je eigen website", paragraphs: ["Een echte websitecheck maakt duidelijk welke signalen op jouw pagina zichtbaar zijn. SiteCheck AI is ontworpen als praktische eerste analyse met meetresultaten en AI-verbeterpunten.", "Gebruik de gratis scan om te bepalen of een uitgebreider rapport nuttig is."] }
      ],
      cta: "Probeer een gratis AI website audit."
    },
    en: {
      title: "AI website audit: what is it useful for?",
      description: "Learn what an AI website audit can and cannot do and how automated analysis helps with SEO, technical quality, content and conversion.",
      intro: "AI can analyze a website quickly, but a useful AI audit should be clear about what was actually checked. Automation is most valuable when it turns signals into action faster.",
      sections: [
        { heading: "Where AI can help", paragraphs: ["AI can summarize measurements and text signals, identify patterns and explain technical findings in plain language.", "This is useful when you want a first diagnosis without running dozens of checks yourself."] },
        { heading: "Where automated analysis has limits", paragraphs: ["A tool does not automatically see every page, user situation or business objective. An analysis of one fetched page is not a full crawl.", "Good software therefore makes its scope clear."] },
        { heading: "Turn scores into actions", paragraphs: ["A number alone does not tell you what to do. Useful recommendations connect a finding to its relevance and a concrete next step.", "That makes a report more useful for business owners and for discussions with developers."] },
        { heading: "Use AI as an accelerator", paragraphs: ["Human judgment remains important for strategy, positioning and complex technical decisions.", "AI is most useful when it speeds up the first analysis and helps people ask better follow-up questions."] },
        { heading: "Try it on your own website", paragraphs: ["A real website check shows which signals are visible on your page. SiteCheck AI is designed as a practical first analysis with measurements and AI improvement points.", "Start with the free scan and decide whether a fuller report is useful."] }
      ],
      cta: "Try a free AI website audit."
    }
  }

];

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return blogArticles.find((article) => article.slug === slug);
}
