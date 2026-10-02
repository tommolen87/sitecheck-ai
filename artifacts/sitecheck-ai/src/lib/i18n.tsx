import { cloneElement, createContext, isValidElement, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "nl" | "en" | "de" | "fr" | "es";

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
  "We controleren je website stap voor stap. Een volledige scan duurt meestal ongeveer 30–60 seconden.": "We are checking your website step by step. A full scan usually takes about 30–60 seconds.",
  "We analyseren": "We are analyzing",
  "je website.": "your website.",
  "We voeren meerdere controles tegelijk uit en laten daarna AI de belangrijkste verbeterpunten uitwerken. De scan duurt meestal ongeveer 15–30 seconden.": "We run multiple checks at the same time and then use AI to work out the most important improvement points. The scan usually takes about 15–30 seconds.",
  "Scan in uitvoering": "Scan in progress",
  "Meerdere controles worden tegelijk uitgevoerd": "Multiple checks are running at the same time",
  "Website en pagina-inhoud controleren": "Checking the website and page content",
  "Techniek, links en snelheid meten": "Measuring technology, links and speed",
  "Belangrijkste verbeterpunten met AI uitwerken": "Working out the most important improvement points with AI",
  "Bezig sinds": "Running for",
  "sec.": "sec.",

  "We zijn nu bezig met": "We are currently checking",
  "Website ophalen en bereikbaarheid controleren": "Fetching the website and checking availability",
  "Vindbaarheid in Google en pagina-opbouw controleren": "Checking Google visibility and page structure",
  "Content, contactmogelijkheden en conversie bekijken": "Reviewing content, contact options and conversion",
  "Techniek en snelheid controleren": "Checking technology and speed",
  "De belangrijkste verbeterpunten door AI laten analyseren": "Having AI analyze the most important improvement points",

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
  "concrete actie.": "concrete action.",
  "Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen en een praktisch plan om je website stap voor stap te verbeteren.": "Your free scan shows where opportunities lie. For €29, you get the full improvement plan: concrete improvement points, clear priorities, AI suggestions and a practical plan to improve your website step by step.",
  "10 belangrijkste verbeterpunten": "10 most important improvement points",
  "Prioriteit, impact en moeilijkheid per punt": "Priority, impact and difficulty for each point",
  "Een duidelijk actieplan voor de komende 30 dagen": "A clear action plan for the next 30 days",
  "Volledig rapport als PDF": "Full report as PDF",

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


const internationalTranslations: Record<"de" | "fr" | "es", Record<string, string>> = {
  de: {
    "Volledig verbeterplan":"Vollständiger Verbesserungsplan","Van inzicht naar":"Von Erkenntnis zu"," concrete actie.":" konkreter Aktion.","Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen en een praktisch plan om je website stap voor stap te verbeteren.":"Dein kostenloser Scan zeigt, wo Chancen liegen. Für 29 € erhältst du den vollständigen Verbesserungsplan: konkrete Verbesserungspunkte, klare Prioritäten, KI-Vorschläge und einen praktischen Plan zur schrittweisen Verbesserung deiner Website.",
    "eenmalig · geen abonnement":"einmalig · kein Abonnement","10 belangrijkste verbeterpunten":"10 wichtigste Verbesserungspunkte","Concrete AI-voorstellen per punt":"Konkrete KI-Vorschläge für jeden Punkt","Prioriteit, impact en moeilijkheid per punt":"Priorität, Auswirkung und Aufwand für jeden Punkt","Een duidelijk actieplan voor de komende 30 dagen":"Ein klarer Aktionsplan für die nächsten 30 Tage","Volledig rapport als PDF":"Vollständiger Bericht als PDF","Bekijk mijn verbeterplan — €29":"Meinen Verbesserungsplan ansehen — 29 €","Terug naar mijn scan":"Zurück zu meinem Scan",
    "Scan afgerond":"Scan abgeschlossen","Gescand op":"Gescannt am","Totale score":"Gesamtscore","Gemeten kwaliteit":"Gemessene Qualität","Totale meetdekking":"Gesamte Messabdeckung","Sterke punten":"Stärken","Wat gaat er al goed?":"Was läuft bereits gut?","Volledig rapport":"Vollständiger Bericht","Download je volledige rapport":"Vollständigen Bericht herunterladen","PDF downloaden":"PDF herunterladen","Praktisch actieplan":"Praktischer Aktionsplan","Impact":"Auswirkung","Moeilijkheid":"Aufwand","Vertrouwen":"Vertrauen","Hoog":"Hoch","Middel":"Mittel","Laag":"Niedrig","Makkelijk":"Einfach","Gemiddeld":"Mittel","Moeilijk":"Schwierig",
    "Conversie":"Konversion","Vindbaarheid in Google":"Sichtbarkeit bei Google","Mobiel":"Mobil","Techniek & snelheid":"Technik & Geschwindigkeit","Content":"Inhalt","Lokale vindbaarheid":"Lokale Sichtbarkeit","Wat we zagen":"Was wir festgestellt haben","Waarom dit belangrijk is":"Warum das wichtig ist","Wat je concreet kunt verbeteren":"Was du konkret verbessern kannst","Concreet voorstel":"Konkreter Vorschlag","Aanbeveling":"Empfehlung","Verbeterpunt":"Verbesserungspunkt","Contactsignalen":"Kontaktsignale","Technische signalen":"Technische Signale",
    "Paginatitel":"Seitentitel","Lengte paginatitel":"Länge des Seitentitels","Korte omschrijving voor Google":"Kurze Beschreibung für Google","Lengte omschrijving voor Google":"Länge der Beschreibung für Google","Hoofdtitels van de pagina":"Hauptüberschriften der Seite","Alle koppen":"Alle Überschriften","Zichtbare tekens":"Sichtbare Zeichen","Interne links":"Interne Links","Externe links":"Externe Links","Afbeeldingen":"Bilder","Afbeeldingen met alt-tekst":"Bilder mit Alternativtext","Actieknoppen":"Aktionsschaltflächen","Belangrijkste actieknop":"Wichtigste Aktionsschaltfläche","Voorkeursadres van de pagina":"Bevorzugte Seitenadresse","Instructies voor zoekmachines":"Anweisungen für Suchmaschinen","Pagina-overzicht voor zoekmachines":"Seitenübersicht für Suchmaschinen","Voorvertoning bij delen":"Vorschau beim Teilen","Serverantwoord":"Serverantwort","Responstijd":"Antwortzeit","Paginagrootte":"Seitengröße","Gegevenscompressie":"Datenkomprimierung",
    "Niet aangetroffen":"Nicht gefunden","Aangetroffen":"Gefunden","Bereikbaar":"Erreichbar","Niet gevonden":"Nicht gefunden","Ja":"Ja","Nee":"Nein","Niet vastgesteld":"Nicht festgestellt","Uitstekend":"Ausgezeichnet","Goed":"Gut","Redelijk":"Ordentlich","Verbetering nodig":"Verbesserung erforderlich","Veel verbetering nodig":"Deutlich verbesserungsbedürftig","Geen contactsignalen gerapporteerd.":"Keine Kontaktsignale gemeldet.","Geen technische signalen gerapporteerd.":"Keine technischen Signale gemeldet."
  },
  fr: {
    "Volledig verbeterplan":"Plan d'amélioration complet","Van inzicht naar":"Des constats à"," concrete actie.":" l'action concrète.","Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen en een praktisch plan om je website stap voor stap te verbeteren.":"Votre analyse gratuite montre où se trouvent les opportunités. Pour 29 €, vous recevez le plan d'amélioration complet : points d'amélioration concrets, priorités claires, propositions d'IA et plan pratique pour améliorer votre site étape par étape.",
    "eenmalig · geen abonnement":"paiement unique · sans abonnement","10 belangrijkste verbeterpunten":"10 principaux points d'amélioration","Concrete AI-voorstellen per punt":"Propositions concrètes d'IA pour chaque point","Prioriteit, impact en moeilijkheid per punt":"Priorité, impact et effort pour chaque point","Een duidelijk actieplan voor de komende 30 dagen":"Un plan d'action clair pour les 30 prochains jours","Volledig rapport als PDF":"Rapport complet au format PDF","Bekijk mijn verbeterplan — €29":"Voir mon plan d'amélioration — 29 €","Terug naar mijn scan":"Retour à mon analyse",
    "Scan afgerond":"Analyse terminée","Gescand op":"Analysé le","Totale score":"Score global","Gemeten kwaliteit":"Qualité mesurée","Totale meetdekking":"Couverture totale des mesures","Sterke punten":"Points forts","Wat gaat er al goed?":"Ce qui fonctionne déjà bien","Volledig rapport":"Rapport complet","Download je volledige rapport":"Télécharger votre rapport complet","PDF downloaden":"Télécharger le PDF","Praktisch actieplan":"Plan d'action pratique","Impact":"Impact","Moeilijkheid":"Difficulté","Vertrouwen":"Confiance","Hoog":"Élevé","Middel":"Moyen","Laag":"Faible","Makkelijk":"Facile","Gemiddeld":"Moyen","Moeilijk":"Difficile",
    "Conversie":"Conversion","Vindbaarheid in Google":"Visibilité sur Google","Mobiel":"Mobile","Techniek & snelheid":"Technique et vitesse","Content":"Contenu","Lokale vindbaarheid":"Visibilité locale","Wat we zagen":"Ce que nous avons constaté","Waarom dit belangrijk is":"Pourquoi c'est important","Wat je concreet kunt verbeteren":"Ce que vous pouvez améliorer concrètement","Concreet voorstel":"Proposition concrète","Aanbeveling":"Recommandation","Verbeterpunt":"Point d'amélioration","Contactsignalen":"Signaux de contact","Technische signalen":"Signaux techniques",
    "Paginatitel":"Titre de la page","Lengte paginatitel":"Longueur du titre","Korte omschrijving voor Google":"Courte description pour Google","Lengte omschrijving voor Google":"Longueur de la description","Hoofdtitels van de pagina":"Titres principaux de la page","Alle koppen":"Tous les titres","Zichtbare tekens":"Caractères visibles","Interne links":"Liens internes","Externe links":"Liens externes","Afbeeldingen":"Images","Afbeeldingen met alt-tekst":"Images avec texte alternatif","Actieknoppen":"Boutons d'action","Belangrijkste actieknop":"Bouton d'action principal","Voorkeursadres van de pagina":"Adresse préférée de la page","Instructies voor zoekmachines":"Instructions pour les moteurs de recherche","Pagina-overzicht voor zoekmachines":"Plan du site pour les moteurs de recherche","Voorvertoning bij delen":"Aperçu lors du partage","Serverantwoord":"Réponse du serveur","Responstijd":"Temps de réponse","Paginagrootte":"Taille de la page","Gegevenscompressie":"Compression des données",
    "Niet aangetroffen":"Non trouvé","Aangetroffen":"Trouvé","Bereikbaar":"Accessible","Niet gevonden":"Non trouvé","Ja":"Oui","Nee":"Non","Niet vastgesteld":"Non déterminé","Uitstekend":"Excellent","Goed":"Bon","Redelijk":"Correct","Verbetering nodig":"Amélioration nécessaire","Veel verbetering nodig":"Amélioration importante nécessaire","Geen contactsignalen gerapporteerd.":"Aucun signal de contact signalé.","Geen technische signalen gerapporteerd.":"Aucun signal technique signalé."
  },
  es: {
    "Volledig verbeterplan":"Plan de mejora completo","Van inzicht naar":"De los hallazgos a la"," concrete actie.":" acción concreta.","Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen en een praktisch plan om je website stap voor stap te verbeteren.":"Tu análisis gratuito muestra dónde hay oportunidades. Por 29 €, recibes el plan de mejora completo: puntos de mejora concretos, prioridades claras, propuestas de IA y un plan práctico para mejorar tu sitio paso a paso.",
    "eenmalig · geen abonnement":"pago único · sin suscripción","10 belangrijkste verbeterpunten":"10 puntos de mejora principales","Concrete AI-voorstellen per punt":"Propuestas concretas de IA para cada punto","Prioriteit, impact en moeilijkheid per punt":"Prioridad, impacto y dificultad de cada punto","Een duidelijk actieplan voor de komende 30 dagen":"Un plan de acción claro para los próximos 30 días","Volledig rapport als PDF":"Informe completo en PDF","Bekijk mijn verbeterplan — €29":"Ver mi plan de mejora — 29 €","Terug naar mijn scan":"Volver a mi análisis",
    "Scan afgerond":"Análisis completado","Gescand op":"Analizado el","Totale score":"Puntuación global","Gemeten kwaliteit":"Calidad medida","Totale meetdekking":"Cobertura total de medición","Sterke punten":"Puntos fuertes","Wat gaat er al goed?":"Lo que ya funciona bien","Volledig rapport":"Informe completo","Download je volledige rapport":"Descargar tu informe completo","PDF downloaden":"Descargar PDF","Praktisch actieplan":"Plan de acción práctico","Impact":"Impacto","Moeilijkheid":"Dificultad","Vertrouwen":"Confianza","Hoog":"Alto","Middel":"Medio","Laag":"Bajo","Makkelijk":"Fácil","Gemiddeld":"Medio","Moeilijk":"Difícil",
    "Conversie":"Conversión","Vindbaarheid in Google":"Visibilidad en Google","Mobiel":"Móvil","Techniek & snelheid":"Técnica y velocidad","Content":"Contenido","Lokale vindbaarheid":"Visibilidad local","Wat we zagen":"Lo que hemos detectado","Waarom dit belangrijk is":"Por qué es importante","Wat je concreet kunt verbeteren":"Lo que puedes mejorar concretamente","Concreet voorstel":"Propuesta concreta","Aanbeveling":"Recomendación","Verbeterpunt":"Punto de mejora","Contactsignalen":"Señales de contacto","Technische signalen":"Señales técnicas",
    "Paginatitel":"Título de la página","Lengte paginatitel":"Longitud del título","Korte omschrijving voor Google":"Descripción breve para Google","Lengte omschrijving voor Google":"Longitud de la descripción","Hoofdtitels van de pagina":"Encabezados principales de la página","Alle koppen":"Todos los encabezados","Zichtbare tekens":"Caracteres visibles","Interne links":"Enlaces internos","Externe links":"Enlaces externos","Afbeeldingen":"Imágenes","Afbeeldingen met alt-tekst":"Imágenes con texto alternativo","Actieknoppen":"Botones de acción","Belangrijkste actieknop":"Botón de acción principal","Voorkeursadres van de pagina":"Dirección preferida de la página","Instructies voor zoekmachines":"Instrucciones para buscadores","Pagina-overzicht voor zoekmachines":"Mapa del sitio para buscadores","Voorvertoning bij delen":"Vista previa al compartir","Serverantwoord":"Respuesta del servidor","Responstijd":"Tiempo de respuesta","Paginagrootte":"Tamaño de la página","Gegevenscompressie":"Compresión de datos",
    "Niet aangetroffen":"No encontrado","Aangetroffen":"Encontrado","Bereikbaar":"Disponible","Niet gevonden":"No encontrado","Ja":"Sí","Nee":"No","Niet vastgesteld":"No determinado","Uitstekend":"Excelente","Goed":"Bueno","Redelijk":"Aceptable","Verbetering nodig":"Necesita mejoras","Veel verbetering nodig":"Necesita muchas mejoras","Geen contactsignalen gerapporteerd.":"No se han informado señales de contacto.","Geen technische signalen gerapporteerd.":"No se han informado señales técnicas."
  },
};

const additionalInternationalTranslations: Record<"de" | "fr" | "es", Record<string, string>> = {
  "de": {
    "Gebruik een volledig webadres, bijvoorbeeld https://jouwbedrijf.nl": "Geben Sie eine vollständige Webadresse ein, z. B. https://ihrunternehmen.de",
    "Start gratis scan": "Kostenlosen Scan starten",
    "Volledig rapport — €29": "Vollständiger Bericht — 29 €",
    "SiteCheck AI analyseert...": "SiteCheck AI analysiert...",
    "Volledig rapport voorbereiden...": "Vollständigen Bericht vorbereiten...",
    "Gratis scan:": "Kostenloser Scan:",
    "Volledig rapport:": "Vollständiger Bericht:",
    "Er ging iets mis bij het aanmelden van je scan. Probeer het opnieuw.": "Beim Starten Ihres Scans ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
    "SiteCheck AI analyseert je website": "SiteCheck AI analysiert Ihre Website",
    "We controleren je website stap voor stap. Een volledige scan duurt meestal ongeveer 30–60 seconden.": "Wir prüfen Ihre Website Schritt für Schritt. Ein vollständiger Scan dauert in der Regel etwa 30–60 Sekunden.",
    "We analyseren": "Wir analysieren",
    "je website.": "Ihre Website.",
    "We voeren meerdere controles tegelijk uit en laten daarna AI de belangrijkste verbeterpunten uitwerken. De scan duurt meestal ongeveer 15–30 seconden.": "Wir führen mehrere Prüfungen gleichzeitig durch und lassen anschließend die KI die wichtigsten Verbesserungen ausarbeiten. Der Scan dauert in der Regel etwa 15–30 Sekunden.",
    "Scan in uitvoering": "Scan läuft",
    "Meerdere controles worden tegelijk uitgevoerd": "Mehrere Prüfungen werden gleichzeitig durchgeführt",
    "Website en pagina-inhoud controleren": "Website und Seiteninhalt prüfen",
    "Techniek, links en snelheid meten": "Technik, Links und Geschwindigkeit messen",
    "Belangrijkste verbeterpunten met AI uitwerken": "Wichtigste Verbesserungen mit KI ausarbeiten",
    "Bezig sinds": "Läuft seit",
    "We zijn nu bezig met": "Wir prüfen gerade",
    "Website ophalen en bereikbaarheid controleren": "Website abrufen und Erreichbarkeit prüfen",
    "Vindbaarheid in Google en pagina-opbouw controleren": "Google-Sichtbarkeit und Seitenstruktur prüfen",
    "Content, contactmogelijkheden en conversie bekijken": "Inhalte, Kontaktmöglichkeiten und Conversion prüfen",
    "Techniek en snelheid controleren": "Technik und Geschwindigkeit prüfen",
    "De belangrijkste verbeterpunten door AI laten analyseren": "Wichtigste Verbesserungen durch KI analysieren",
    "Je scan staat klaar": "Ihr Scan ist bereit",
    "We halen de homepage op en controleren alleen wat we daadwerkelijk kunnen meten.": "Wir rufen die Startseite ab und prüfen nur, was wir tatsächlich messen können.",
    "We hebben je aanvraag ontvangen. De analyse wordt op de achtergrond voorbereid.": "Wir haben Ihre Anfrage erhalten. Die Analyse wird im Hintergrund vorbereitet.",
    "Aanvragen worden verwerkt": "Anfragen werden verarbeitet",
    "recente aanvraag": "aktuelle Anfrage",
    "recente aanvragen": "aktuelle Anfragen",
    "Alleen je URL is nodig": "Nur Ihre URL wird benötigt",
    "Geen vakjargon.": "Kein Fachjargon.",
    "Wel zicht op wat je website voor je bedrijf kan doen.": "Ein klarer Überblick darüber, was Ihre Website für Ihr Unternehmen leisten kann.",
    "Zo werkt het": "So funktioniert es",
    "Van twijfel naar een volgende stap.": "Von Unsicherheit zum nächsten Schritt.",
    "Je deelt je URL": "Sie teilen Ihre URL",
    "Wij nemen rustig de tijd": "Wir nehmen uns die nötige Zeit",
    "Je krijgt richting": "Sie erhalten klare Orientierung",
    "Waar we op letten": "Worauf wir achten",
    "Helder.": "Klar.",
    "Een brede blik": "Ein umfassender Blick",
    "Niet alleen de buitenkant.": "Nicht nur die Oberfläche.",
    "De eerste indruk": "Der erste Eindruck",
    "De route naar contact": "Der Weg zum Kontakt",
    "Vertrouwen in details": "Vertrauen in den Details",
    "Maak van je website een betere eerste kennismaking.": "Machen Sie Ihre Website zu einem besseren ersten Eindruck.",
    "Een rustige check voor ambitieuze ondernemers": "Ein ruhiger Check für ambitionierte Unternehmen",
    "Een helder beeld van": "Ein klares Bild Ihrer",
    "Ruimte om te groeien": "Raum für Wachstum",
    "Tijd voor aandacht": "Braucht Aufmerksamkeit",
    "onderdelen zijn gecontroleerd.": "Bereiche wurden geprüft.",
    "Niet-gemeten onderdelen tellen niet positief mee; een volledige score is pas mogelijk wanneer alle onderdelen meetbaar zijn.": "Nicht gemessene Bereiche werden nicht positiv gewertet; eine vollständige Punktzahl ist nur möglich, wenn alle Bereiche messbar sind.",
    "Kwaliteit gemeten:": "Gemessene Qualität:",
    "Uitgevoerd:": "Ausgeführt:",
    "Meetdekking:": "Messabdeckung:",
    "Gewicht totaal:": "Gesamtgewicht:",
    "belangrijke": "wichtige",
    "check kon": "Prüfung konnte",
    "checks konden": "Prüfungen konnten",
    "we niet betrouwbaar beoordelen.": "nicht zuverlässig bewertet werden.",
    "niet gecheckt": "nicht geprüft",
    "Bekijk score-opbouw": "Punktaufteilung anzeigen",
    "scoremeting": "Punktmessung",
    "scoremetingen": "Punktmessungen",
    "uitgevoerd": "ausgeführt",
    "geslaagd": "bestanden",
    "niet geslaagd": "nicht bestanden",
    "onbekend": "unbekannt",
    "Weging hoog": "Hohe Gewichtung",
    "Weging middel": "Mittlere Gewichtung",
    "Weging laag": "Niedrige Gewichtung",
    "Deze onderdelen van je website kwamen goed uit de scan.": "Diese Bereiche Ihrer Website haben im Scan gut abgeschnitten.",
    "Alle scores, sterke punten, verbeterpunten en het actieplan gebundeld in één PDF.": "Alle Bewertungen, Stärken, Verbesserungen und der Aktionsplan in einem PDF.",
    "De belangrijkste aandachtspunten.": "Die wichtigsten Punkte.",
    "De AI interpreteert uitsluitend gegevens die onze scanner heeft verzameld. AI-beoordelingen vervangen geen menselijke website-audit.": "Die KI interpretiert ausschließlich Daten, die unser Scanner gesammelt hat. KI-Bewertungen ersetzen keine menschliche Website-Prüfung.",
    "De aanbevelingen hieronder volgen direct uit de bevindingen van deze scan.": "Die folgenden Empfehlungen ergeben sich direkt aus den Ergebnissen dieses Scans.",
    "Deze scan rapporteerde geen aandachtspunten.": "Dieser Scan hat keine Punkte gemeldet.",
    "Dit zou ik als eerste aanpakken.": "Das würde ich zuerst angehen.",
    "We hebben de belangrijkste bevindingen van deze scan op volgorde gezet, zodat je direct weet waar je kunt beginnen.": "Wir haben die wichtigsten Ergebnisse dieses Scans priorisiert, damit Sie direkt wissen, wo Sie beginnen können.",
    "Gebaseerd op:": "Basierend auf:",
    "De meting achter de score": "Die Messung hinter der Bewertung",
    "Wat de scan zag": "Was der Scan erkannt hat",
    "Dit zijn meetbare signalen uit de opgehaalde pagina. Ze zijn geen interpretatie of belofte.": "Dies sind messbare Signale aus der abgerufenen Seite. Sie sind keine Interpretation oder Zusage.",
    "Geen technische voorkennis nodig": "Keine technischen Vorkenntnisse erforderlich",
    "Begrippen eenvoudig uitgelegd": "Begriffe einfach erklärt",
    "Kom je een term tegen die je niet kent? Hier leggen we de belangrijkste begrippen uit.": "Sie kennen einen Begriff nicht? Hier erklären wir die wichtigsten Begriffe.",
    "Transparant over de grenzen": "Transparent über die Grenzen",
    "Dit konden we niet controleren.": "Das konnten wir nicht prüfen.",
    "Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.": "Für diesen Scan wurden keine ungeprüften Bereiche gemeldet.",
    "Scan niet beschikbaar": "Scan nicht verfügbar",
    "Deze scan kon niet worden afgerond.": "Dieser Scan konnte nicht abgeschlossen werden.",
    "Geen resultaat gevonden.": "Kein Ergebnis gefunden.",
    "Er is nog geen analyse beschikbaar.": "Noch keine Analyse verfügbar.",
    "Dit scanadres klopt niet.": "Diese Scan-Adresse ist ungültig.",
    "We kunnen zonder een geldig scan-ID geen resultaat ophalen.": "Ohne eine gültige Scan-ID können wir kein Ergebnis abrufen.",
    "We konden deze scan niet ophalen.": "Dieser Scan konnte nicht abgerufen werden.",
    "De scan kon niet worden opgehaald. Probeer het opnieuw.": "Der Scan konnte nicht abgerufen werden. Bitte versuchen Sie es erneut.",
    "De scan is afgerond, maar de API heeft geen analyse meegestuurd. Probeer deze pagina later opnieuw.": "Der Scan ist abgeschlossen, aber die API hat keine Analyse zurückgegeben. Bitte versuchen Sie es später erneut.",
    "Even geduld": "Einen Moment bitte",
    "SiteCheck AI analyseert": "SiteCheck AI analysiert",
    "We halen de pagina op en kijken rustig naar wat er daadwerkelijk te controleren is. Deze pagina ververst automatisch.": "Wir rufen die Seite ab und prüfen sorgfältig, was tatsächlich gemessen werden kann. Diese Seite aktualisiert sich automatisch.",
    "Terug naar een nieuwe scan": "Zurück zu einem neuen Scan",
    "Sterk punt": "Stärke",
    "Wat we zagen": "Was wir festgestellt haben",
    "Waarom dit belangrijk is": "Warum das wichtig ist",
    "Wat je concreet kunt verbeteren": "Was Sie konkret verbessern können",
    "Concreet voorstel": "Konkreter Vorschlag",
    "Aanbeveling": "Empfehlung",
    "Verbeterpunt": "Verbesserungspunkt",
    "Geen technische vaktaal.": "Kein technischer Fachjargon.",
    "Bekijk alle verbeterpunten — €29": "Alle Verbesserungen ansehen — 29 €",
    "Maak mijn volledige verbeterplan — €29": "Meinen vollständigen Verbesserungsplan erstellen — 29 €",
    "Nieuwe scan starten": "Neuen Scan starten",
    "Terug naar mijn scan": "Zurück zu meinem Scan",
    "Volledig rapport": "Vollständiger Bericht",
    "PDF downloaden": "PDF herunterladen",

  },
  "fr": {
    "Gebruik een volledig webadres, bijvoorbeeld https://jouwbedrijf.nl": "Saisissez une adresse web complète, par exemple https://votreentreprise.fr",
    "Start gratis scan": "Lancer l’analyse gratuite",
    "Volledig rapport — €29": "Rapport complet — 29 €",
    "SiteCheck AI analyseert...": "SiteCheck AI analyse...",
    "Volledig rapport voorbereiden...": "Préparation du rapport complet...",
    "Gratis scan:": "Analyse gratuite :",
    "Volledig rapport:": "Rapport complet :",
    "Er ging iets mis bij het aanmelden van je scan. Probeer het opnieuw.": "Une erreur s’est produite lors du lancement de votre analyse. Veuillez réessayer.",
    "SiteCheck AI analyseert je website": "SiteCheck AI analyse votre site web",
    "We controleren je website stap voor stap. Een volledige scan duurt meestal ongeveer 30–60 seconden.": "Nous vérifions votre site étape par étape. Une analyse complète prend généralement 30 à 60 secondes.",
    "We analyseren": "Nous analysons",
    "je website.": "votre site web.",
    "We voeren meerdere controles tegelijk uit en laten daarna AI de belangrijkste verbeterpunten uitwerken. De scan duurt meestal ongeveer 15–30 seconden.": "Nous effectuons plusieurs contrôles en parallèle, puis l’IA élabore les principaux points d’amélioration. L’analyse prend généralement 15 à 30 secondes.",
    "Scan in uitvoering": "Analyse en cours",
    "Meerdere controles worden tegelijk uitgevoerd": "Plusieurs contrôles sont effectués en parallèle",
    "Website en pagina-inhoud controleren": "Vérification du site et du contenu des pages",
    "Techniek, links en snelheid meten": "Mesure de la technique, des liens et de la vitesse",
    "Belangrijkste verbeterpunten met AI uitwerken": "Élaboration des principaux points d’amélioration avec l’IA",
    "Bezig sinds": "En cours depuis",
    "We zijn nu bezig met": "Nous vérifions actuellement",
    "Website ophalen en bereikbaarheid controleren": "Récupération du site et vérification de l’accessibilité",
    "Vindbaarheid in Google en pagina-opbouw controleren": "Vérification de la visibilité Google et de la structure des pages",
    "Content, contactmogelijkheden en conversie bekijken": "Analyse du contenu, des moyens de contact et de la conversion",
    "Techniek en snelheid controleren": "Vérification de la technique et de la vitesse",
    "De belangrijkste verbeterpunten door AI laten analyseren": "Analyse des principaux points d’amélioration par l’IA",
    "Je scan staat klaar": "Votre analyse est prête",
    "We halen de homepage op en controleren alleen wat we daadwerkelijk kunnen meten.": "Nous récupérons la page d’accueil et vérifions uniquement ce que nous pouvons réellement mesurer.",
    "We hebben je aanvraag ontvangen. De analyse wordt op de achtergrond voorbereid.": "Nous avons reçu votre demande. L’analyse est préparée en arrière-plan.",
    "Aanvragen worden verwerkt": "Demandes en cours de traitement",
    "recente aanvraag": "demande récente",
    "recente aanvragen": "demandes récentes",
    "Alleen je URL is nodig": "Seule votre URL est nécessaire",
    "Geen vakjargon.": "Aucun jargon technique.",
    "Wel zicht op wat je website voor je bedrijf kan doen.": "Une vision claire de ce que votre site peut apporter à votre entreprise.",
    "Zo werkt het": "Comment ça marche",
    "Van twijfel naar een volgende stap.": "Du doute à une prochaine étape claire.",
    "Je deelt je URL": "Vous partagez votre URL",
    "Wij nemen rustig de tijd": "Nous prenons le temps nécessaire",
    "Je krijgt richting": "Vous obtenez une direction claire",
    "Waar we op letten": "Ce que nous examinons",
    "Helder.": "Clair.",
    "Een brede blik": "Une vue d’ensemble",
    "Niet alleen de buitenkant.": "Pas seulement la surface.",
    "De eerste indruk": "La première impression",
    "De route naar contact": "Le chemin vers le contact",
    "Vertrouwen in details": "La confiance dans les détails",
    "Maak van je website een betere eerste kennismaking.": "Faites de votre site une meilleure première impression.",
    "Een rustige check voor ambitieuze ondernemers": "Un contrôle simple pour les entreprises ambitieuses",
    "Een helder beeld van": "Une vision claire de votre",
    "Ruimte om te groeien": "Des possibilités de progression",
    "Tijd voor aandacht": "À améliorer",
    "onderdelen zijn gecontroleerd.": "éléments ont été contrôlés.",
    "Niet-gemeten onderdelen tellen niet positief mee; een volledige score is pas mogelijk wanneer alle onderdelen meetbaar zijn.": "Les éléments non mesurés ne comptent pas positivement ; un score complet n’est possible que lorsque tous les éléments peuvent être mesurés.",
    "Kwaliteit gemeten:": "Qualité mesurée :",
    "Uitgevoerd:": "Exécuté :",
    "Meetdekking:": "Couverture des mesures :",
    "Gewicht totaal:": "Poids total :",
    "belangrijke": "importantes",
    "check kon": "contrôle n’a pas pu être",
    "checks konden": "contrôles n’ont pas pu être",
    "we niet betrouwbaar beoordelen.": "évalués de manière fiable.",
    "niet gecheckt": "non contrôlé",
    "Bekijk score-opbouw": "Voir le détail du score",
    "scoremeting": "mesure du score",
    "scoremetingen": "mesures du score",
    "uitgevoerd": "exécuté",
    "geslaagd": "réussi",
    "niet geslaagd": "non réussi",
    "onbekend": "inconnu",
    "Weging hoog": "Pondération élevée",
    "Weging middel": "Pondération moyenne",
    "Weging laag": "Pondération faible",
    "Deze onderdelen van je website kwamen goed uit de scan.": "Ces éléments de votre site ont obtenu de bons résultats lors de l’analyse.",
    "Alle scores, sterke punten, verbeterpunten en het actieplan gebundeld in één PDF.": "Tous les scores, points forts, améliorations et le plan d’action réunis dans un seul PDF.",
    "De belangrijkste aandachtspunten.": "Les principaux points d’attention.",
    "De AI interpreteert uitsluitend gegevens die onze scanner heeft verzameld. AI-beoordelingen vervangen geen menselijke website-audit.": "L’IA interprète uniquement les données recueillies par notre scanner. Les évaluations de l’IA ne remplacent pas un audit humain du site.",
    "De aanbevelingen hieronder volgen direct uit de bevindingen van deze scan.": "Les recommandations ci-dessous découlent directement des résultats de cette analyse.",
    "Deze scan rapporteerde geen aandachtspunten.": "Cette analyse n’a signalé aucun point d’attention.",
    "Dit zou ik als eerste aanpakken.": "Voici ce que je traiterais en premier.",
    "We hebben de belangrijkste bevindingen van deze scan op volgorde gezet, zodat je direct weet waar je kunt beginnen.": "Nous avons classé les principaux résultats de cette analyse afin que vous sachiez immédiatement par où commencer.",
    "Gebaseerd op:": "Basé sur :",
    "De meting achter de score": "La mesure derrière le score",
    "Wat de scan zag": "Ce que l’analyse a détecté",
    "Dit zijn meetbare signalen uit de opgehaalde pagina. Ze zijn geen interpretatie of belofte.": "Ce sont des signaux mesurables provenant de la page récupérée. Ils ne constituent ni une interprétation ni une promesse.",
    "Geen technische voorkennis nodig": "Aucune connaissance technique requise",
    "Begrippen eenvoudig uitgelegd": "Les termes expliqués simplement",
    "Kom je een term tegen die je niet kent? Hier leggen we de belangrijkste begrippen uit.": "Vous rencontrez un terme inconnu ? Nous expliquons ici les principaux termes.",
    "Transparant over de grenzen": "Transparence sur les limites",
    "Dit konden we niet controleren.": "Ce que nous n’avons pas pu vérifier.",
    "Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.": "Aucun élément non vérifié n’a été signalé pour cette analyse.",
    "Scan niet beschikbaar": "Analyse indisponible",
    "Deze scan kon niet worden afgerond.": "Cette analyse n’a pas pu être terminée.",
    "Geen resultaat gevonden.": "Aucun résultat trouvé.",
    "Er is nog geen analyse beschikbaar.": "Aucune analyse n’est encore disponible.",
    "Dit scanadres klopt niet.": "Cette adresse d’analyse n’est pas valide.",
    "We kunnen zonder een geldig scan-ID geen resultaat ophalen.": "Impossible de récupérer un résultat sans identifiant d’analyse valide.",
    "We konden deze scan niet ophalen.": "Nous n’avons pas pu récupérer cette analyse.",
    "De scan kon niet worden opgehaald. Probeer het opnieuw.": "L’analyse n’a pas pu être récupérée. Veuillez réessayer.",
    "De scan is afgerond, maar de API heeft geen analyse meegestuurd. Probeer deze pagina later opnieuw.": "L’analyse est terminée, mais l’API n’a renvoyé aucune analyse. Veuillez réessayer cette page plus tard.",
    "Even geduld": "Un instant",
    "SiteCheck AI analyseert": "SiteCheck AI analyse",
    "We halen de pagina op en kijken rustig naar wat er daadwerkelijk te controleren is. Deze pagina ververst automatisch.": "Nous récupérons la page et vérifions attentivement ce qui peut réellement être mesuré. Cette page se met à jour automatiquement.",
    "Terug naar een nieuwe scan": "Retour à une nouvelle analyse",
    "Sterk punt": "Point fort",
    "Wat we zagen": "Ce que nous avons constaté",
    "Waarom dit belangrijk is": "Pourquoi c’est important",
    "Wat je concreet kunt verbeteren": "Ce que vous pouvez améliorer concrètement",
    "Concreet voorstel": "Proposition concrète",
    "Aanbeveling": "Recommandation",
    "Verbeterpunt": "Point d’amélioration",
    "Geen technische vaktaal.": "Sans jargon technique.",
    "Bekijk alle verbeterpunten — €29": "Voir tous les points d’amélioration — 29 €",
    "Maak mijn volledige verbeterplan — €29": "Créer mon plan d’amélioration complet — 29 €",
    "Nieuwe scan starten": "Lancer une nouvelle analyse",
    "Terug naar mijn scan": "Retour à mon analyse",
    "Volledig rapport": "Rapport complet",
    "PDF downloaden": "Télécharger le PDF",

  },
  "es": {
    "Gebruik een volledig webadres, bijvoorbeeld https://jouwbedrijf.nl": "Introduce una dirección web completa, por ejemplo https://tuempresa.es",
    "Start gratis scan": "Iniciar análisis gratuito",
    "Volledig rapport — €29": "Informe completo — 29 €",
    "SiteCheck AI analyseert...": "SiteCheck AI está analizando...",
    "Volledig rapport voorbereiden...": "Preparando el informe completo...",
    "Gratis scan:": "Análisis gratuito:",
    "Volledig rapport:": "Informe completo:",
    "Er ging iets mis bij het aanmelden van je scan. Probeer het opnieuw.": "Se produjo un error al iniciar el análisis. Inténtalo de nuevo.",
    "SiteCheck AI analyseert je website": "SiteCheck AI está analizando tu sitio web",
    "We controleren je website stap voor stap. Een volledige scan duurt meestal ongeveer 30–60 seconden.": "Comprobamos tu sitio web paso a paso. Un análisis completo suele tardar entre 30 y 60 segundos.",
    "We analyseren": "Estamos analizando",
    "je website.": "tu sitio web.",
    "We voeren meerdere controles tegelijk uit en laten daarna AI de belangrijkste verbeterpunten uitwerken. De scan duurt meestal ongeveer 15–30 seconden.": "Realizamos varias comprobaciones a la vez y después la IA desarrolla los principales puntos de mejora. El análisis suele tardar entre 15 y 30 segundos.",
    "Scan in uitvoering": "Análisis en curso",
    "Meerdere controles worden tegelijk uitgevoerd": "Se están realizando varias comprobaciones a la vez",
    "Website en pagina-inhoud controleren": "Comprobar el sitio y el contenido de las páginas",
    "Techniek, links en snelheid meten": "Medir tecnología, enlaces y velocidad",
    "Belangrijkste verbeterpunten met AI uitwerken": "Desarrollar los principales puntos de mejora con IA",
    "Bezig sinds": "En curso desde",
    "We zijn nu bezig met": "Estamos comprobando",
    "Website ophalen en bereikbaarheid controleren": "Obtener el sitio y comprobar su disponibilidad",
    "Vindbaarheid in Google en pagina-opbouw controleren": "Comprobar la visibilidad en Google y la estructura de las páginas",
    "Content, contactmogelijkheden en conversie bekijken": "Revisar contenido, opciones de contacto y conversión",
    "Techniek en snelheid controleren": "Comprobar tecnología y velocidad",
    "De belangrijkste verbeterpunten door AI laten analyseren": "Analizar los principales puntos de mejora con IA",
    "Je scan staat klaar": "Tu análisis está listo",
    "We halen de homepage op en controleren alleen wat we daadwerkelijk kunnen meten.": "Obtenemos la página de inicio y comprobamos solo lo que realmente podemos medir.",
    "We hebben je aanvraag ontvangen. De analyse wordt op de achtergrond voorbereid.": "Hemos recibido tu solicitud. El análisis se está preparando en segundo plano.",
    "Aanvragen worden verwerkt": "Solicitudes en proceso",
    "recente aanvraag": "solicitud reciente",
    "recente aanvragen": "solicitudes recientes",
    "Alleen je URL is nodig": "Solo necesitamos tu URL",
    "Geen vakjargon.": "Sin jerga técnica.",
    "Wel zicht op wat je website voor je bedrijf kan doen.": "Una visión clara de lo que tu sitio web puede hacer por tu empresa.",
    "Zo werkt het": "Cómo funciona",
    "Van twijfel naar een volgende stap.": "De la duda a un siguiente paso claro.",
    "Je deelt je URL": "Compartes tu URL",
    "Wij nemen rustig de tijd": "Nos tomamos el tiempo necesario",
    "Je krijgt richting": "Obtienes una dirección clara",
    "Waar we op letten": "En qué nos fijamos",
    "Helder.": "Claro.",
    "Een brede blik": "Una visión amplia",
    "Niet alleen de buitenkant.": "No solo la superficie.",
    "De eerste indruk": "La primera impresión",
    "De route naar contact": "El camino al contacto",
    "Vertrouwen in details": "Confianza en los detalles",
    "Maak van je website een betere eerste kennismaking.": "Convierte tu sitio web en una mejor primera impresión.",
    "Een rustige check voor ambitieuze ondernemers": "Una revisión sencilla para empresas ambiciosas",
    "Een helder beeld van": "Una visión clara de tu",
    "Ruimte om te groeien": "Hay margen de mejora",
    "Tijd voor aandacht": "Necesita atención",
    "onderdelen zijn gecontroleerd.": "elementos han sido comprobados.",
    "Niet-gemeten onderdelen tellen niet positief mee; een volledige score is pas mogelijk wanneer alle onderdelen meetbaar zijn.": "Los elementos no medidos no cuentan positivamente; la puntuación completa solo es posible cuando todos los elementos pueden medirse.",
    "Kwaliteit gemeten:": "Calidad medida:",
    "Uitgevoerd:": "Ejecutado:",
    "Meetdekking:": "Cobertura de medición:",
    "Gewicht totaal:": "Peso total:",
    "belangrijke": "importantes",
    "check kon": "comprobación no pudo ser",
    "checks konden": "comprobaciones no pudieron ser",
    "we niet betrouwbaar beoordelen.": "evaluadas de forma fiable.",
    "niet gecheckt": "no comprobado",
    "Bekijk score-opbouw": "Ver desglose de la puntuación",
    "scoremeting": "medición de puntuación",
    "scoremetingen": "mediciones de puntuación",
    "uitgevoerd": "ejecutado",
    "geslaagd": "superado",
    "niet geslaagd": "no superado",
    "onbekend": "desconocido",
    "Weging hoog": "Ponderación alta",
    "Weging middel": "Ponderación media",
    "Weging laag": "Ponderación baja",
    "Deze onderdelen van je website kwamen goed uit de scan.": "Estas áreas de tu sitio web obtuvieron buenos resultados en el análisis.",
    "Alle scores, sterke punten, verbeterpunten en het actieplan gebundeld in één PDF.": "Todas las puntuaciones, puntos fuertes, mejoras y el plan de acción reunidos en un único PDF.",
    "De belangrijkste aandachtspunten.": "Los principales puntos de atención.",
    "De AI interpreteert uitsluitend gegevens die onze scanner heeft verzameld. AI-beoordelingen vervangen geen menselijke website-audit.": "La IA interpreta únicamente los datos recopilados por nuestro escáner. Las evaluaciones de IA no sustituyen una auditoría humana del sitio web.",
    "De aanbevelingen hieronder volgen direct uit de bevindingen van deze scan.": "Las recomendaciones siguientes se basan directamente en los resultados de este análisis.",
    "Deze scan rapporteerde geen aandachtspunten.": "Este análisis no ha detectado puntos de atención.",
    "Dit zou ik als eerste aanpakken.": "Esto es lo que abordaría primero.",
    "We hebben de belangrijkste bevindingen van deze scan op volgorde gezet, zodat je direct weet waar je kunt beginnen.": "Hemos ordenado los resultados más importantes para que sepas directamente por dónde empezar.",
    "Gebaseerd op:": "Basado en:",
    "De meting achter de score": "La medición detrás de la puntuación",
    "Wat de scan zag": "Lo que detectó el análisis",
    "Dit zijn meetbare signalen uit de opgehaalde pagina. Ze zijn geen interpretatie of belofte.": "Son señales medibles de la página obtenida. No son una interpretación ni una promesa.",
    "Geen technische voorkennis nodig": "No necesitas conocimientos técnicos",
    "Begrippen eenvoudig uitgelegd": "Conceptos explicados de forma sencilla",
    "Kom je een term tegen die je niet kent? Hier leggen we de belangrijkste begrippen uit.": "¿Encuentras un término que no conoces? Aquí explicamos los conceptos más importantes.",
    "Transparant over de grenzen": "Transparencia sobre los límites",
    "Dit konden we niet controleren.": "Esto no pudimos comprobarlo.",
    "Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.": "No se han informado elementos sin comprobar para este análisis.",
    "Scan niet beschikbaar": "Análisis no disponible",
    "Deze scan kon niet worden afgerond.": "Este análisis no pudo completarse.",
    "Geen resultaat gevonden.": "No se ha encontrado ningún resultado.",
    "Er is nog geen analyse beschikbaar.": "Aún no hay ningún análisis disponible.",
    "Dit scanadres klopt niet.": "Esta dirección de análisis no es válida.",
    "We kunnen zonder een geldig scan-ID geen resultaat ophalen.": "No podemos obtener un resultado sin un ID de análisis válido.",
    "We konden deze scan niet ophalen.": "No hemos podido recuperar este análisis.",
    "De scan kon niet worden opgehaald. Probeer het opnieuw.": "No se ha podido recuperar el análisis. Inténtalo de nuevo.",
    "De scan is afgerond, maar de API heeft geen analyse meegestuurd. Probeer deze pagina later opnieuw.": "El análisis ha terminado, pero la API no ha devuelto ningún análisis. Vuelve a intentarlo más tarde.",
    "Even geduld": "Un momento",
    "SiteCheck AI analyseert": "SiteCheck AI está analizando",
    "We halen de pagina op en kijken rustig naar wat er daadwerkelijk te controleren is. Deze pagina ververst automatisch.": "Obtenemos la página y comprobamos cuidadosamente qué se puede medir realmente. Esta página se actualiza automáticamente.",
    "Terug naar een nieuwe scan": "Volver a un nuevo análisis",
    "Sterk punt": "Punto fuerte",
    "Wat we zagen": "Lo que hemos detectado",
    "Waarom dit belangrijk is": "Por qué es importante",
    "Wat je concreet kunt verbeteren": "Lo que puedes mejorar concretamente",
    "Concreet voorstel": "Propuesta concreta",
    "Aanbeveling": "Recomendación",
    "Verbeterpunt": "Punto de mejora",
    "Geen technische vaktaal.": "Sin jerga técnica.",
    "Bekijk alle verbeterpunten — €29": "Ver todos los puntos de mejora — 29 €",
    "Maak mijn volledige verbeterplan — €29": "Crear mi plan de mejora completo — 29 €",
    "Nieuwe scan starten": "Iniciar un nuevo análisis",
    "Terug naar mijn scan": "Volver a mi análisis",
    "Volledig rapport": "Informe completo",
    "PDF downloaden": "Descargar PDF"
  }
};

const finalInternationalTranslations: Record<"de" | "fr" | "es", Record<string, string>> = {
  "de": {
    "van 100": "von 100",
    "Niet gemeten": "Nicht gemessen",
    "Een stevige basis": "Eine solide Grundlage",
    "Alleen onderdelen die de scan daadwerkelijk heeft beoordeeld krijgen een score.": "Nur Bereiche, die der Scan tatsächlich bewertet hat, erhalten eine Punktzahl.",
    "Geen resultaat gevonden.": "Kein Ergebnis gefunden.",
    "Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.": "Für diesen Scan wurden keine ungeprüften Bereiche gemeldet.",
    "Waar we het vonden": "Wo wir es gefunden haben",
    "Bekijk alle verbeterpunten — €29": "Alle Verbesserungspunkte ansehen — 29 €",
    "Website adres": "Website-Adresse",
    "Nieuwe scan": "Neuer Scan",
    "eenmalig": "einmalig",
    "Wil je weten wat je écht kunt verbeteren?": "Möchten Sie wissen, was Sie wirklich verbessern können?",
    "Maak van je scan een concreet verbeterplan.": "Machen Sie aus Ihrem Scan einen konkreten Verbesserungsplan.",
    "Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: 10 concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen, een 30-dagen actieplan en het volledige rapport als PDF.": "Ihr kostenloser Scan zeigt, wo Chancen liegen. Für 29 € erhalten Sie den vollständigen Verbesserungsplan: 10 konkrete Verbesserungspunkte, klare Prioritäten, KI-Vorschläge, einen 30-Tage-Aktionsplan und den vollständigen Bericht als PDF.",
    "Uitleg waarom elk punt belangrijk is": "Erklärung, warum jeder Punkt wichtig ist",
    "Impact en moeilijkheid per verbetering": "Auswirkung und Aufwand pro Verbesserung",
    "Praktisch actieplan voor de komende 30 dagen": "Praktischer Aktionsplan für die nächsten 30 Tage",
    "Eenmalige betaling · geen abonnement": "Einmalzahlung · kein Abonnement",
    "De zeven invalshoeken": "Die sieben Bereiche",
    "Waar staat je website?": "Wie steht Ihre Website da?",
    "Wat we zagen": "Was wir festgestellt haben",
    "Waarom dit belangrijk is": "Warum das wichtig ist",
    "Wat de scan zag": "Was der Scan erkannt hat",
    "E-mailadres gevonden": "E-Mail-Adresse gefunden",
    "Telefoonnummer gevonden": "Telefonnummer gefunden",
    "Adres- of locatiesignaal gevonden": "Adress- oder Ortssignal gefunden",
    "HTTPS actief": "HTTPS aktiv",
    "HTTP-status 200": "HTTP-Status 200",
    "Viewport-instelling gevonden": "Viewport-Einstellung gefunden",
    "Canonical-link gevonden": "Canonical-Link gefunden",
    "Taalinstelling gevonden": "Spracheinstellung gefunden",
    "Compressie gevonden (gzip)": "Komprimierung gefunden (gzip)",
    "robots.txt bereikbaar": "robots.txt erreichbar",
    "Sitemap bereikbaar": "Sitemap erreichbar",
    "Geen contactsignalen gerapporteerd.": "Keine Kontaktsignale gemeldet.",
    "Geen technische signalen gerapporteerd.": "Keine technischen Signale gemeldet.",
    "Scan afgerond": "Scan abgeschlossen",
    "Gescand op": "Gescannt am",
    "Totale score": "Gesamtnote",
    "Bekijk score-opbouw": "Punktaufbau anzeigen",
    "Weging": "Gewichtung",
    "Geslaagd": "Bestanden",
    "Niet geslaagd": "Nicht bestanden",
    "Onbekend": "Unbekannt",
    "Hoog": "Hoch",
    "Middel": "Mittel",
    "Laag": "Niedrig",
    "Makkelijk": "Einfach",
    "Moeilijk": "Schwierig",
    "Vertrouwen": "Vertrauen",
    "Impact": "Auswirkung",
    "Moeilijkheid": "Aufwand",
    "Concreet voorstel": "Konkreter Vorschlag",
    "Wat je concreet kunt verbeteren": "Was Sie konkret verbessern können",
    "Gebaseerd op:": "Basierend auf:",
    "Nieuwe scan starten": "Neuen Scan starten",  },
  "fr": {
    "van 100": "sur 100",
    "Niet gemeten": "Non mesuré",
    "Een stevige basis": "Une base solide",
    "Alleen onderdelen die de scan daadwerkelijk heeft beoordeeld krijgen een score.": "Seuls les éléments réellement évalués par l’analyse reçoivent une note.",
    "Geen resultaat gevonden.": "Aucun résultat trouvé.",
    "Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.": "Aucun élément non vérifié n’a été signalé pour cette analyse.",
    "Waar we het vonden": "Où nous l’avons trouvé",
    "Bekijk alle verbeterpunten — €29": "Voir tous les points d’amélioration — 29 €",
    "Website adres": "Adresse du site web",
    "Nieuwe scan": "Nouvelle analyse",
    "eenmalig": "paiement unique",
    "Wil je weten wat je écht kunt verbeteren?": "Vous voulez savoir ce que vous pouvez vraiment améliorer ?",
    "Maak van je scan een concreet verbeterplan.": "Transformez votre analyse en plan d’amélioration concret.",
    "Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: 10 concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen, een 30-dagen actieplan en het volledige rapport als PDF.": "Votre analyse gratuite montre où se trouvent les opportunités. Pour 29 €, vous recevez le plan d’amélioration complet : 10 points d’amélioration concrets, des priorités claires, des propositions d’IA, un plan d’action de 30 jours et le rapport complet en PDF.",
    "Uitleg waarom elk punt belangrijk is": "Explication de l’importance de chaque point",
    "Impact en moeilijkheid per verbetering": "Impact et difficulté de chaque amélioration",
    "Praktisch actieplan voor de komende 30 dagen": "Plan d’action pratique pour les 30 prochains jours",
    "Eenmalige betaling · geen abonnement": "Paiement unique · sans abonnement",
    "De zeven invalshoeken": "Les sept domaines",
    "Waar staat je website?": "Où se situe votre site web ?",
    "Wat we zagen": "Ce que nous avons constaté",
    "Waarom dit belangrijk is": "Pourquoi c’est important",
    "Wat de scan zag": "Ce que l’analyse a détecté",
    "E-mailadres gevonden": "Adresse e-mail trouvée",
    "Telefoonnummer gevonden": "Numéro de téléphone trouvé",
    "Adres- of locatiesignaal gevonden": "Adresse ou signal de localisation trouvé",
    "HTTPS actief": "HTTPS actif",
    "HTTP-status 200": "Statut HTTP 200",
    "Viewport-instelling gevonden": "Paramètre viewport trouvé",
    "Canonical-link gevonden": "Lien canonique trouvé",
    "Taalinstelling gevonden": "Paramètre de langue trouvé",
    "Compressie gevonden (gzip)": "Compression trouvée (gzip)",
    "robots.txt bereikbaar": "robots.txt accessible",
    "Sitemap bereikbaar": "Sitemap accessible",
    "Geen contactsignalen gerapporteerd.": "Aucun signal de contact signalé.",
    "Geen technische signalen gerapporteerd.": "Aucun signal technique signalé.",
    "Scan afgerond": "Analyse terminée",
    "Gescand op": "Analysé le",
    "Totale score": "Score global",
    "Bekijk score-opbouw": "Voir le détail du score",
    "Weging": "Pondération",
    "Geslaagd": "Réussi",
    "Niet geslaagd": "Non réussi",
    "Onbekend": "Inconnu",
    "Hoog": "Élevé",
    "Middel": "Moyen",
    "Laag": "Faible",
    "Makkelijk": "Facile",
    "Moeilijk": "Difficile",
    "Vertrouwen": "Confiance",
    "Impact": "Impact",
    "Moeilijkheid": "Difficulté",
    "Concreet voorstel": "Proposition concrète",
    "Wat je concreet kunt verbeteren": "Ce que vous pouvez améliorer concrètement",
    "Gebaseerd op:": "Basé sur :",
    "Nieuwe scan starten": "Lancer une nouvelle analyse",  },
  "es": {
    "van 100": "de 100",
    "Niet gemeten": "No medido",
    "Een stevige basis": "Una base sólida",
    "Alleen onderdelen die de scan daadwerkelijk heeft beoordeeld krijgen een score.": "Solo las áreas que el análisis ha evaluado realmente reciben una puntuación.",
    "Geen resultaat gevonden.": "No se ha encontrado ningún resultado.",
    "Voor deze scan zijn geen niet-gecontroleerde onderdelen gerapporteerd.": "No se han informado elementos sin comprobar para este análisis.",
    "Waar we het vonden": "Dónde lo encontramos",
    "Bekijk alle verbeterpunten — €29": "Ver todos los puntos de mejora — 29 €",
    "Website adres": "Dirección del sitio web",
    "Nieuwe scan": "Nuevo análisis",
    "eenmalig": "pago único",
    "Wil je weten wat je écht kunt verbeteren?": "¿Quieres saber qué puedes mejorar realmente?",
    "Maak van je scan een concreet verbeterplan.": "Convierte tu análisis en un plan de mejora concreto.",
    "Je gratis scan laat zien waar kansen liggen. Voor €29 krijg je het volledige verbeterplan: 10 concrete verbeterpunten, duidelijke prioriteiten, AI-voorstellen, een 30-dagen actieplan en het volledige rapport als PDF.": "Tu análisis gratuito muestra dónde hay oportunidades. Por 29 €, recibes el plan de mejora completo: 10 puntos de mejora concretos, prioridades claras, propuestas de IA, un plan de acción de 30 días y el informe completo en PDF.",
    "Uitleg waarom elk punt belangrijk is": "Explicación de por qué cada punto es importante",
    "Impact en moeilijkheid per verbetering": "Impacto y dificultad de cada mejora",
    "Praktisch actieplan voor de komende 30 dagen": "Plan de acción práctico para los próximos 30 días",
    "Eenmalige betaling · geen abonnement": "Pago único · sin suscripción",
    "De zeven invalshoeken": "Las siete áreas",
    "Waar staat je website?": "¿Cómo está tu sitio web?",
    "Wat we zagen": "Lo que hemos detectado",
    "Waarom dit belangrijk is": "Por qué es importante",
    "Wat de scan zag": "Lo que ha detectado el análisis",
    "E-mailadres gevonden": "Dirección de correo encontrada",
    "Telefoonnummer gevonden": "Número de teléfono encontrado",
    "Adres- of locatiesignaal gevonden": "Dirección o señal de ubicación encontrada",
    "HTTPS actief": "HTTPS activo",
    "HTTP-status 200": "Estado HTTP 200",
    "Viewport-instelling gevonden": "Configuración de viewport encontrada",
    "Canonical-link gevonden": "Enlace canónico encontrado",
    "Taalinstelling gevonden": "Configuración de idioma encontrada",
    "Compressie gevonden (gzip)": "Compresión encontrada (gzip)",
    "robots.txt bereikbaar": "robots.txt disponible",
    "Sitemap bereikbaar": "Sitemap disponible",
    "Geen contactsignalen gerapporteerd.": "No se han informado señales de contacto.",
    "Geen technische signalen gerapporteerd.": "No se han informado señales técnicas.",
    "Scan afgerond": "Análisis completado",
    "Gescand op": "Analizado el",
    "Totale score": "Puntuación total",
    "Bekijk score-opbouw": "Ver desglose de la puntuación",
    "Weging": "Ponderación",
    "Geslaagd": "Superado",
    "Niet geslaagd": "No superado",
    "Onbekend": "Desconocido",
    "Hoog": "Alto",
    "Middel": "Medio",
    "Laag": "Bajo",
    "Makkelijk": "Fácil",
    "Moeilijk": "Difícil",
    "Vertrouwen": "Confianza",
    "Impact": "Impacto",
    "Moeilijkheid": "Dificultad",
    "Concreet voorstel": "Propuesta concreta",
    "Wat je concreet kunt verbeteren": "Lo que puedes mejorar concretamente",
    "Gebaseerd op:": "Basado en:",
    "Nieuwe scan starten": "Iniciar un nuevo análisis",  }
};

function translatePattern(value: string, locale: Locale): string {
  if (locale === "nl") return value;

  const patterns: Array<[RegExp, Record<"en" | "de" | "fr" | "es", string>]> = [
    [/^(\\d+) van de (\\d+) belangrijkste verbeterpunten gezien\\.$/, {
      en: "$1 of $2 most important improvement points seen.",
      de: "$1 von $2 wichtigsten Verbesserungspunkten gesehen.",
      fr: "$1 des $2 principaux points d’amélioration affichés.",
      es: "$1 de los $2 principales puntos de mejora vistos.",
    }],
    [/^Er staan nog (\\d+) verbeterpunten klaar\\. Je krijgt daarnaast concrete voorstellen, prioriteiten, impact, moeilijkheid, een 30-dagen actieplan en het volledige rapport als PDF\\.$/, {
      en: "$1 improvement points remain. You also get concrete suggestions, priorities, impact, difficulty, a 30-day action plan and the full report as a PDF.",
      de: "Noch $1 Verbesserungspunkte sind verfügbar. Außerdem erhalten Sie konkrete Vorschläge, Prioritäten, Auswirkungen, Aufwand, einen 30-Tage-Aktionsplan und den vollständigen Bericht als PDF.",
      fr: "Il reste $1 points d’amélioration. Vous recevez également des propositions concrètes, les priorités, l’impact, la difficulté, un plan d’action de 30 jours et le rapport complet en PDF.",
      es: "Quedan $1 puntos de mejora. También recibirás propuestas concretas, prioridades, impacto, dificultad, un plan de acción de 30 días y el informe completo en PDF.",
    }],
    [/^(\\d+) van de (\\d+) onderdelen zijn gecontroleerd\\.$/, {
      en: "$1 of $2 areas were checked.",
      de: "$1 von $2 Bereichen wurden geprüft.",
      fr: "$1 des $2 éléments ont été contrôlés.",
      es: "$1 de $2 elementos han sido comprobados.",
    }],
    [/^Kwaliteit gemeten: (.+)$/, {
      en: "Measured quality: $1",
      de: "Gemessene Qualität: $1",
      fr: "Qualité mesurée : $1",
      es: "Calidad medida: $1",
    }],
    [/^Uitgevoerd: (.+)$/, {
      en: "Executed: $1",
      de: "Ausgeführt: $1",
      fr: "Exécuté : $1",
      es: "Ejecuté: $1",
    }],
    [/^Meetdekking: (.+)$/, {
      en: "Coverage: $1",
      de: "Messabdeckung: $1",
      fr: "Couverture des mesures : $1",
      es: "Cobertura de medición: $1",
    }],
    [/^Gewicht totaal: (.+)$/, {
      en: "Total weight: $1",
      de: "Gesamtgewicht: $1",
      fr: "Poids total : $1",
      es: "Peso total: $1",
    }],
    [/^(\\d+) belangrijke (check kon|checks konden) we niet betrouwbaar beoordelen\\.$/, {
      en: "$1 important check(s) could not be reliably assessed.",
      de: "$1 wichtige Prüfung(en) konnten nicht zuverlässig bewertet werden.",
      fr: "$1 contrôle(s) important(s) n’ont pas pu être évalué(s) de manière fiable.",
      es: "$1 comprobación(es) importante(s) no pudieron evaluarse de forma fiable.",
    }],
    [/^(\\d+) geslaagd · (\\d+) niet geslaagd · (\\d+) onbekend · (\\d+) uitgevoerd$/, {
      en: "$1 passed · $2 not passed · $3 unknown · $4 executed",
      de: "$1 bestanden · $2 nicht bestanden · $3 unbekannt · $4 ausgeführt",
      fr: "$1 réussis · $2 non réussis · $3 inconnus · $4 exécutés",
      es: "$1 superados · $2 no superados · $3 desconocidos · $4 ejecutados",
    }],
    [/^(.+) scoremeting(en)? uitgevoerd$/, {
      en: "$1 score measurement$2 executed",
      de: "$1 Punktmessung$2 ausgeführt",
      fr: "$1 mesure$2 du score exécutée(s)",
      es: "$1 medición(es) de puntuación ejecutada(s)",
    }],
    [/^De totaalscore weegt Conversie en vindbaarheid in Google elk voor 20%, Mobiel en Techniek elk voor 15%, en de overige onderdelen elk voor 10%\\.$/, {
      en: "The overall score weights Conversion and Google visibility at 20% each, Mobile and Technology at 15% each, and the remaining areas at 10% each.",
      de: "Die Gesamtnote gewichtet Konversion und Sichtbarkeit bei Google mit jeweils 20 %, Mobil und Technik mit jeweils 15 % und die übrigen Bereiche mit jeweils 10 %.",
      fr: "Le score global pondère la conversion et la visibilité sur Google à 20 % chacune, le mobile et la technique à 15 % chacune, et les autres éléments à 10 % chacun.",
      es: "La puntuación global pondera la conversión y la visibilidad en Google con un 20 % cada una, móvil y técnica con un 15 % cada una y las demás áreas con un 10 % cada una.",
    }],
    [/^Bezig sinds (\\d+) sec\\.$/, {
      en: "Running for $1 sec.",
      de: "Läuft seit $1 Sek.",
      fr: "En cours depuis $1 s.",
      es: "En curso desde $1 s.",
    }],
    [/^Impact: (.+)$/, {
      en: "Impact: $1",
      de: "Auswirkung: $1",
      fr: "Impact : $1",
      es: "Impacto: $1",
    }],
    [/^Impact (.+)$/, {
      en: "Impact $1",
      de: "Auswirkung $1",
      fr: "Impact $1",
      es: "Impacto $1",
    }],
    [/^Moeilijkheid (.+)$/, {
      en: "Difficulty $1",
      de: "Aufwand $1",
      fr: "Difficulté $1",
      es: "Dificultad $1",
    }],
    [/^Vertrouwen (.+)$/, {
      en: "Confidence $1",
      de: "Vertrauen $1",
      fr: "Confiance $1",
      es: "Confianza $1",
    }],
    [/^Weging (.+)$/, {
      en: "Weight $1",
      de: "Gewichtung $1",
      fr: "Pondération $1",
      es: "Ponderación $1",
    }],
    [/^([0-9.,]+) tekens$/, {
      en: "$1 characters",
      de: "$1 Zeichen",
      fr: "$1 caractères",
      es: "$1 caracteres",
    }],
    [/^([0-9.,]+) ms$/, {
      en: "$1 ms",
      de: "$1 ms",
      fr: "$1 ms",
      es: "$1 ms",
    }],
    [/^([0-9.,]+) KB$/, {
      en: "$1 KB",
      de: "$1 KB",
      fr: "$1 Ko",
      es: "$1 KB",
    }],
  ];

  for (const [pattern, translations] of patterns) {
    if (pattern.test(value)) {
      return translations[locale].replace(/\$(\d+)/g, (_, index) => {
        const match = value.match(pattern);
        return match?.[Number(index)] ?? "";
      });
    }
  }
  return value;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function translateText(value: string, locale: Locale): string {
  if (locale === "nl") return value;
  const normalized = normalize(value);

  if (locale === "en") {
    const exact = translations[normalized];
    if (exact) return value.trim() === value ? exact : value.replace(normalized, exact);
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

  const intl = { ...internationalTranslations[locale], ...additionalInternationalTranslations[locale], ...finalInternationalTranslations[locale] };
  const patterned = translatePattern(normalized, locale);
  if (patterned !== normalized) {
    return value.trim() === value ? patterned : value.replace(normalized, patterned);
  }
  if (intl[normalized]) {
    return value.trim() === value ? intl[normalized] : value.replace(normalized, intl[normalized]);
  }

  const english = translations[normalized];
  if (english && intl[english]) {
    return value.trim() === value ? intl[english] : value.replace(normalized, intl[english]);
  }

  return value;
}

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "nl";

  // Language-specific URLs must always determine the locale.
  // This prevents localStorage/browser language from making /nl pages render in English
  // (or /en pages render in Dutch), which is especially important for SEO crawlers.
  const pathname = window.location.pathname;
  if (pathname === "/nl" || pathname.startsWith("/nl/")) return "nl";
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/de" || pathname.startsWith("/de/")) return "de";
  if (pathname === "/fr" || pathname.startsWith("/fr/")) return "fr";
  if (pathname === "/es" || pathname.startsWith("/es/")) return "es";

  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (queryLocale === "nl" || queryLocale === "en" || queryLocale === "de" || queryLocale === "fr" || queryLocale === "es") {
    window.localStorage.setItem("sitecheck-language", queryLocale);
    return queryLocale as Locale;
  }

  const saved = window.localStorage.getItem("sitecheck-language");
  if (saved === "nl" || saved === "en" || saved === "de" || saved === "fr" || saved === "es") return saved as Locale;
  const browserLanguage = navigator.language.toLowerCase();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (browserLanguage.startsWith("nl") || timezone === "Europe/Amsterdam" || timezone === "Europe/Brussels") {
    return "nl";
  }
  if (browserLanguage.startsWith("de")) return "de";
  if (browserLanguage.startsWith("fr")) return "fr";
  if (browserLanguage.startsWith("es")) return "es";
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
      const supported = ["nl", "en", "de", "fr", "es"];
      const first = path.split("/").filter(Boolean)[0];
      if (path === "/" || supported.includes(first) && path.split("/").filter(Boolean).length === 1) {
        window.history.pushState({}, "", `/${next}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } else if (supported.includes(first)) {
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
      {(["nl", "en", "de", "fr", "es"] as Locale[]).map((code, index) => (
        <span key={code}>
          {index > 0 && <span aria-hidden="true"> | </span>}
          <button type="button" className={locale === code ? "active" : ""} onClick={() => setLocale(code)}>{code.toUpperCase()}</button>
        </span>
      ))}
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