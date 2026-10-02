import { useLanguage, LanguageSwitcher } from '@/lib/i18n';

type Locale = 'nl' | 'en' | 'de' | 'fr' | 'es';

const legalContent = {
  nl: {
    privacy: {
      title: 'Privacyverklaring',
      intro: 'SJOOM AI Services, handelend onder de naam SiteCheck AI, verwerkt persoonsgegevens alleen voor zover dat nodig is om SiteCheck AI te laten werken, betalingen af te handelen en betaalde rapporten te leveren.',
      sections: [
        ['Wie is verantwoordelijk?', 'SJOOM AI Services (KvK 42178075), Oliemolenstraat 12, 5402 LJ Uden, is verantwoordelijk voor de verwerking van persoonsgegevens binnen SiteCheck AI. Contact: info@sjoomai.nl.'],
        ['Welke gegevens verwerken we?', 'Bij een scan verwerken we het door jou opgegeven websiteadres en de gegevens die nodig zijn om de scan en het resultaat beschikbaar te maken. Bij een aankoop kan Stripe je e-mailadres en betaalgegevens verwerken. Voor het versturen van een betaald rapport kan Resend het e-mailadres en de noodzakelijke berichtgegevens verwerken. SiteCheck AI ontvangt geen volledige betaalkaartgegevens.'],
        ['Waarvoor gebruiken we gegevens?', 'We gebruiken gegevens om de website-analyse uit te voeren, je scanresultaat beschikbaar te stellen, betalingen te verwerken, een betaald rapport te leveren en ondersteuning te bieden wanneer dat nodig is.'],
        ['Rechtsgrond', 'Afhankelijk van de verwerking baseren we ons op het uitvoeren van de overeenkomst of maatregelen vóór het sluiten daarvan, een wettelijke verplichting of ons gerechtvaardigd belang om de dienst veilig en werkend te houden.'],
        ['Delen met andere partijen', 'Voor onderdelen van de dienstverlening gebruiken we gespecialiseerde dienstverleners, waaronder Stripe voor betalingen en Resend voor e-mail. Zij verwerken gegevens voor de onderdelen waarvoor zij worden ingeschakeld. We verkopen persoonsgegevens niet.'],
        ['Bewaartermijn', 'Scanresultaten worden niet onbeperkt bewaard. Gratis scanrecords worden automatisch na 30 dagen verwijderd. Betaalde scans en rapporten worden automatisch na 365 dagen verwijderd, tenzij een langere bewaartermijn wettelijk verplicht is of redelijkerwijs nodig is voor een juridische vordering of administratieve verplichting. Daarna worden de scangegevens uit SiteCheck AI verwijderd.'],
        ['Jouw rechten', 'Je kunt, voor zover de AVG daarin voorziet, vragen om inzage, correctie, verwijdering, beperking of overdraagbaarheid van persoonsgegevens en bezwaar maken tegen bepaalde verwerkingen. Neem hiervoor contact op via info@sjoomai.nl. We kunnen om voldoende informatie vragen om je verzoek te kunnen behandelen.'],
        ['Klacht', 'Je kunt een klacht indienen bij de Autoriteit Persoonsgegevens als je vindt dat je persoonsgegevens niet correct worden verwerkt.'],
        ['Wijzigingen', 'Deze privacyverklaring kan worden aangepast wanneer SiteCheck AI of de manier waarop gegevens worden verwerkt verandert. De actuele versie staat op deze pagina.'],
      ],
    },
    terms: {
      title: 'Algemene voorwaarden',
      intro: 'Deze voorwaarden gelden voor het gebruik van SiteCheck AI en voor de aankoop van het betaalde volledige rapport van SJOOM AI Services.',
      sections: [
        ['1. Identiteit', 'SJOOM AI Services (KvK 42178075), Oliemolenstraat 12, 5402 LJ Uden, info@sjoomai.nl, biedt SiteCheck AI aan.'],
        ['2. Dienst', 'SiteCheck AI analyseert een door de gebruiker opgegeven webpagina en vertaalt beschikbare signalen naar begrijpelijke bevindingen en aanbevelingen. De scan is een geautomatiseerde analyse en is geen garantie voor SEO-resultaten, omzet, conversie of posities in zoekmachines.'],
        ['3. Gratis scan', 'De eerste scan kan gratis worden aangeboden. De inhoud, beschikbaarheid en technische werking kunnen zonder voorafgaande aankondiging worden aangepast zolang wettelijke rechten van klanten daardoor niet worden beperkt.'],
        ['4. Volledig rapport', 'Het volledige rapport kost €29 eenmalig, tenzij op het moment van aankoop een andere prijs wordt vermeld. Het is geen abonnement. De betaalde dienst bevat de extra verbeterpunten, aanbevelingen en het PDF-rapport zoals tijdens het aankoopproces omschreven.'],
        ['5. Betaling', 'Betalingen worden verwerkt via Stripe. SiteCheck AI verwerkt zelf geen volledige betaalkaartgegevens. Na een succesvolle betaling wordt het betaalde rapport beschikbaar gemaakt en kan het rapport per e-mail worden aangeboden.'],
        ['6. Herroepingsrecht', 'Voor consumenten geldt in beginsel een wettelijke bedenktijd van 14 dagen bij online aankopen. Wanneer een dienst op verzoek van de consument al tijdens de bedenktijd wordt uitgevoerd, kunnen wettelijke regels gelden voor het al geleverde deel. SiteCheck AI verstrekt vóór de aankoop informatie over het herroepingsrecht en de wijze waarop dit kan worden uitgeoefend.'],
        ['7. Herroeping', 'Een consument kan een aankoop binnen de wettelijke termijn herroepen door dit ondubbelzinnig aan SJOOM AI Services te melden via info@sjoomai.nl of via de online herroepingsfunctie van SiteCheck AI. Vermeld bij voorkeur het scan- of aankoopkenmerk en het e-mailadres dat bij de aankoop is gebruikt.'],
        ['8. Gebruik en verantwoordelijkheid', 'Je bent verantwoordelijk voor het rechtmatig aanleveren van het webadres dat je laat analyseren. Je mag SiteCheck AI niet gebruiken voor onrechtmatige doeleinden, misbruik, geautomatiseerde overbelasting of pogingen om beveiliging te omzeilen.'],
        ['9. Beschikbaarheid en fouten', 'We streven naar een betrouwbare dienst, maar kunnen geen ononderbroken beschikbaarheid garanderen. Als de betaalde dienst aantoonbaar niet werkt zoals redelijkerwijs mag worden verwacht, zoeken we binnen de wettelijke regels naar een passende oplossing.'],
        ['10. Intellectueel eigendom', 'De software, vormgeving, teksten en techniek van SiteCheck AI blijven eigendom van SJOOM AI Services of de betreffende rechthebbenden. Het betaalde rapport mag door de klant voor eigen bedrijfsdoeleinden worden gebruikt en gedeeld binnen de eigen organisatie.'],
        ['11. Aansprakelijkheid', 'SiteCheck AI is een hulpmiddel voor analyse en besluitvorming. Aan aanbevelingen kunnen geen gegarandeerde bedrijfs-, SEO- of omzetresultaten worden ontleend. Voor zover wettelijk toegestaan is aansprakelijkheid beperkt tot directe schade en tot het bedrag dat voor de betreffende betaalde dienst is betaald, behoudens gevallen waarin een beperking wettelijk niet is toegestaan.'],
        ['12. Recht en bevoegde rechter', 'Op de overeenkomst is Nederlands recht van toepassing. Voor zover de wet dit toestaat worden geschillen voorgelegd aan de bevoegde rechter in Nederland. Consumenten behouden de dwingendrechtelijke bescherming die hun op grond van toepasselijke wetgeving toekomt.'],
      ],
    },
    cookies: {
      title: 'Cookiebeleid',
      intro: 'SiteCheck AI gebruikt op dit moment geen advertentie- of trackingcookies voor gepersonaliseerde advertenties.',
      sections: [
        ['Noodzakelijke opslag', 'De website kan noodzakelijke browseropslag gebruiken om een scan veilig aan de juiste browser te koppelen. Zo kan een scanresultaat na het starten van een scan beschikbaar blijven zonder dat je een account hoeft aan te maken.'],
        ['Betalingen', 'Wanneer je naar Stripe gaat om te betalen, kan Stripe eigen cookies en vergelijkbare technieken gebruiken. De verwerking op de betaalpagina valt mede onder het privacy- en cookiebeleid van Stripe.'],
        ['Externe inhoud', 'SiteCheck AI gebruikt Google Fonts voor de vormgeving. Wanneer externe bronnen worden geladen, kan je browser daarmee verbinding maken.'],
        ['Bezoekersmeting', 'Na toestemming gebruikt SiteCheck AI beperkte bezoekersmeting om sessies en gebruik van de website te begrijpen. Daarbij wordt een browserwaarde opgeslagen en ontvangt onze server technische requestgegevens die nodig zijn voor de melding. We gebruiken dit niet voor gepersonaliseerde advertenties.'],
        ['Meer informatie', 'Voor vragen over cookies of vergelijkbare technieken kun je contact opnemen via info@sjoomai.nl.'],
      ],
    },
    withdraw: {
      title: 'Aankoop herroepen',
      intro: 'Wil je een online aankoop van het SiteCheck AI-rapport binnen je wettelijke bedenktijd ongedaan maken? Gebruik hieronder de gegevens waarmee we je aankoop kunnen terugvinden.',
      sections: [
        ['Zo werkt het', 'Vul je naam, e-mailadres en indien bekend het scan- of aankoopnummer in. Je verzoek wordt als herroepingsverzoek aan SJOOM AI Services voorgelegd. Je kunt je herroeping ook rechtstreeks melden via info@sjoomai.nl.'],
        ['Let op', 'Of en welk bedrag wordt terugbetaald, hangt af van de wettelijke regels en van de vraag of je uitdrukkelijk hebt gevraagd om de dienst tijdens de bedenktijd te laten starten.'],
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy Policy',
      intro: 'SJOOM AI Services, operating SiteCheck AI, processes personal data only where needed to operate SiteCheck AI, handle payments and deliver paid reports.',
      sections: [
        ['Who is responsible?', 'SJOOM AI Services (Chamber of Commerce 42178075), Oliemolenstraat 12, 5402 LJ Uden, Netherlands, is responsible for personal-data processing within SiteCheck AI. Contact: info@sjoomai.nl.'],
        ['What data do we process?', 'For a scan we process the website address you provide and data needed to make the scan and result available. For a purchase, Stripe may process your email address and payment details. To deliver a paid report by email, Resend may process your email address and necessary message data. SiteCheck AI does not receive full payment-card details.'],
        ['Why do we use data?', 'We use data to run the website analysis, make scan results available, process payments, deliver paid reports and provide support when necessary.'],
        ['Legal basis', 'Depending on the processing, we rely on performance of a contract or pre-contractual steps, a legal obligation, or our legitimate interest in keeping the service secure and operational.'],
        ['Sharing with other parties', 'We use specialist service providers for parts of the service, including Stripe for payments and Resend for email delivery. They process data for the services for which they are engaged. We do not sell personal data.'],
        ['Retention', 'Scan results are not kept indefinitely. Free scan records are automatically deleted after 30 days. Paid scan and report records are automatically deleted after 365 days, unless a longer retention period is required by law or reasonably necessary for a legal claim or accounting obligation. After the applicable period, the scan data is deleted from SiteCheck AI.'],
        ['Your rights', 'Where provided by the GDPR, you may request access, correction, deletion, restriction or portability of personal data and object to certain processing. Contact info@sjoomai.nl. We may ask for sufficient information to process your request.'],
        ['Complaints', 'You may lodge a complaint with the Dutch Data Protection Authority if you believe your personal data is not being processed correctly.'],
        ['Changes', 'This privacy policy may be updated when SiteCheck AI or its data processing changes. The current version is published on this page.'],
      ],
    },
    terms: {
      title: 'Terms and Conditions',
      intro: 'These terms apply to the use of SiteCheck AI and the purchase of the paid full report from SJOOM AI Services.',
      sections: [
        ['1. Provider', 'SJOOM AI Services (Chamber of Commerce 42178075), Oliemolenstraat 12, 5402 LJ Uden, Netherlands, info@sjoomai.nl, operates SiteCheck AI.'],
        ['2. Service', 'SiteCheck AI analyzes a webpage supplied by the user and turns available signals into understandable findings and recommendations. The scan is an automated analysis and does not guarantee SEO results, revenue, conversion or search-engine rankings.'],
        ['3. Free scan', 'The first scan may be offered free of charge. Content, availability and technical operation may change without prior notice as long as mandatory customer rights are not restricted.'],
        ['4. Full report', 'The full report costs €29 one time unless another price is shown at checkout. It is not a subscription. The paid service includes the additional improvement points, recommendations and PDF report described during checkout.'],
        ['5. Payment', 'Payments are processed by Stripe. SiteCheck AI does not process full payment-card details itself. After successful payment, the paid report is made available and may be delivered by email.'],
        ['6. Withdrawal right', 'Consumers generally have a statutory 14-day withdrawal period for online purchases. Where a service starts during that period at the consumer’s request, statutory rules may apply to the part already supplied. SiteCheck AI provides information about withdrawal rights and how to exercise them before purchase.'],
        ['7. Withdrawal', 'A consumer may withdraw within the statutory period by clearly notifying SJOOM AI Services via info@sjoomai.nl or through SiteCheck AI’s online withdrawal function. Preferably include the scan or purchase reference and the email address used for the purchase.'],
        ['8. Use and responsibility', 'You are responsible for lawfully providing the web address you submit for analysis. You may not use SiteCheck AI for unlawful purposes, abuse, automated overload or attempts to bypass security.'],
        ['9. Availability and errors', 'We aim to provide a reliable service but cannot guarantee uninterrupted availability. If the paid service demonstrably fails to work as reasonably expected, we will seek an appropriate solution within applicable law.'],
        ['10. Intellectual property', 'The software, design, texts and technology of SiteCheck AI remain the property of SJOOM AI Services or the relevant rights holders. The paid report may be used by the customer for their own business purposes and shared within their own organization.'],
        ['11. Liability', 'SiteCheck AI is an analysis and decision-support tool. Recommendations do not guarantee business, SEO or revenue results. To the extent permitted by law, liability is limited to direct damage and the amount paid for the relevant paid service, except where a limitation is not legally permitted.'],
        ['12. Law and jurisdiction', 'Dutch law applies to the agreement. To the extent permitted by law, disputes will be submitted to a competent court in the Netherlands. Consumers retain any mandatory protection granted by applicable law.'],
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      intro: 'SiteCheck AI does not currently use advertising or tracking cookies for personalized advertising.',
      sections: [
        ['Necessary storage', 'The website may use necessary browser storage to securely associate a scan with the browser that started it. This allows a scan result to remain available without requiring an account.'],
        ['Payments', 'When you go to Stripe to pay, Stripe may use its own cookies and similar technologies. Processing on the payment page is also governed by Stripe’s privacy and cookie policies.'],
        ['External content', 'SiteCheck AI uses Google Fonts for visual presentation. When external resources are loaded, your browser may connect to those services.'],
        ['Visitor measurement', 'After consent, SiteCheck AI uses limited visitor measurement to understand sessions and website usage. A browser value is stored and our server receives technical request data needed for the visitor alert. We do not use this for personalized advertising.'],
        ['More information', 'For questions about cookies or similar technologies, contact info@sjoomai.nl.'],
      ],
    },
    withdraw: {
      title: 'Withdraw a purchase',
      intro: 'Would you like to withdraw your online purchase of a SiteCheck AI report within your statutory withdrawal period? Use the details below so we can identify the purchase.',
      sections: [
        ['How it works', 'Enter your name, email address and, if known, the scan or purchase reference. Your request will be submitted as a withdrawal request to SJOOM AI Services. You can also notify us directly at info@sjoomai.nl.'],
        ['Please note', 'Whether and how much is refunded depends on applicable statutory rules and on whether you expressly asked us to start the service during the withdrawal period.'],
      ],
    },
  },
  de: {
    privacy: {
      title: 'Datenschutzerklärung',
      intro: 'SJOOM AI Services, tätig unter dem Namen SiteCheck AI, verarbeitet personenbezogene Daten nur, soweit dies für den Betrieb von SiteCheck AI, die Abwicklung von Zahlungen und die Bereitstellung kostenpflichtiger Berichte erforderlich ist.',
      sections: [
        ['Wer ist verantwortlich?', 'SJOOM AI Services (Handelskammer 42178075), Oliemolenstraat 12, 5402 LJ Uden, Niederlande, ist für die Verarbeitung personenbezogener Daten innerhalb von SiteCheck AI verantwortlich. Kontakt: info@sjoomai.nl.'],
        ['Welche Daten verarbeiten wir?', 'Bei einem Scan verarbeiten wir die von Ihnen angegebene Website-Adresse und die Daten, die erforderlich sind, um den Scan und das Ergebnis bereitzustellen. Bei einem Kauf kann Stripe Ihre E-Mail-Adresse und Zahlungsdaten verarbeiten. Für die Zustellung eines kostenpflichtigen Berichts per E-Mail kann Resend Ihre E-Mail-Adresse und erforderliche Nachrichtendaten verarbeiten. SiteCheck AI erhält keine vollständigen Zahlungskartendaten.'],
        ['Wofür verwenden wir Daten?', 'Wir verwenden Daten, um die Website-Analyse durchzuführen, Scan-Ergebnisse bereitzustellen, Zahlungen zu verarbeiten, kostenpflichtige Berichte zu liefern und bei Bedarf Support zu leisten.'],
        ['Rechtsgrundlage', 'Je nach Verarbeitung stützen wir uns auf die Vertragserfüllung oder vorvertragliche Maßnahmen, eine gesetzliche Verpflichtung oder unser berechtigtes Interesse, den Dienst sicher und funktionsfähig zu halten.'],
        ['Weitergabe an andere Parteien', 'Für Teile des Dienstes nutzen wir spezialisierte Dienstleister, darunter Stripe für Zahlungen und Resend für E-Mail-Versand. Sie verarbeiten Daten für die jeweiligen Aufgaben. Wir verkaufen keine personenbezogenen Daten.'],
        ['Aufbewahrung', 'Scan-Ergebnisse werden nicht unbegrenzt gespeichert. Datensätze kostenloser Scans werden nach 30 Tagen automatisch gelöscht. Bezahlte Scans und Berichte werden nach 365 Tagen automatisch gelöscht, sofern keine längere gesetzliche Aufbewahrungspflicht besteht oder dies für einen Rechtsanspruch oder eine administrative Pflicht angemessen erforderlich ist. Danach werden die Scan-Daten aus SiteCheck AI gelöscht.'],
        ['Ihre Rechte', 'Soweit die DSGVO dies vorsieht, können Sie Auskunft, Berichtigung, Löschung, Einschränkung oder Übertragbarkeit personenbezogener Daten verlangen und bestimmten Verarbeitungen widersprechen. Kontaktieren Sie info@sjoomai.nl. Wir können ausreichende Informationen zur Bearbeitung Ihrer Anfrage verlangen.'],
        ['Beschwerde', 'Sie können eine Beschwerde bei der zuständigen Datenschutzaufsichtsbehörde einreichen, wenn Sie der Ansicht sind, dass Ihre personenbezogenen Daten nicht korrekt verarbeitet werden.'],
        ['Änderungen', 'Diese Datenschutzerklärung kann angepasst werden, wenn sich SiteCheck AI oder die Datenverarbeitung ändert. Die aktuelle Version wird auf dieser Seite veröffentlicht.'],
      ],
    },
    terms: {
      title: 'Allgemeine Geschäftsbedingungen',
      intro: 'Diese Bedingungen gelten für die Nutzung von SiteCheck AI und den Kauf des kostenpflichtigen vollständigen Berichts von SJOOM AI Services.',
      sections: [
        ['1. Anbieter', 'SJOOM AI Services (Handelskammer 42178075), Oliemolenstraat 12, 5402 LJ Uden, Niederlande, info@sjoomai.nl, betreibt SiteCheck AI.'],
        ['2. Dienst', 'SiteCheck AI analysiert eine vom Nutzer angegebene Webseite und übersetzt verfügbare Signale in verständliche Ergebnisse und Empfehlungen. Der Scan ist eine automatisierte Analyse und garantiert keine SEO-Ergebnisse, Umsätze, Conversions oder Positionen in Suchmaschinen.'],
        ['3. Kostenloser Scan', 'Der erste Scan kann kostenlos angeboten werden. Inhalt, Verfügbarkeit und technische Funktion können ohne vorherige Ankündigung geändert werden, sofern gesetzliche Kundenrechte dadurch nicht eingeschränkt werden.'],
        ['4. Vollständiger Bericht', 'Der vollständige Bericht kostet einmalig 29 €, sofern beim Kauf kein anderer Preis angegeben wird. Es handelt sich nicht um ein Abonnement. Die kostenpflichtige Leistung umfasst die zusätzlichen Verbesserungspunkte, Empfehlungen und den beim Kauf beschriebenen PDF-Bericht.'],
        ['5. Zahlung', 'Zahlungen werden über Stripe abgewickelt. SiteCheck AI verarbeitet selbst keine vollständigen Zahlungskartendaten. Nach erfolgreicher Zahlung wird der kostenpflichtige Bericht bereitgestellt und kann per E-Mail zugestellt werden.'],
        ['6. Widerrufsrecht', 'Verbraucher haben bei Online-Käufen grundsätzlich ein gesetzliches Widerrufsrecht von 14 Tagen. Wenn eine Dienstleistung auf Wunsch des Verbrauchers bereits während dieser Frist beginnt, können gesetzliche Regeln für den bereits erbrachten Teil gelten. SiteCheck AI informiert vor dem Kauf über das Widerrufsrecht und dessen Ausübung.'],
        ['7. Widerruf', 'Ein Verbraucher kann innerhalb der gesetzlichen Frist widerrufen, indem er SJOOM AI Services eindeutig über info@sjoomai.nl oder die Online-Widerrufsfunktion von SiteCheck AI informiert. Bitte geben Sie nach Möglichkeit die Scan- oder Kaufreferenz und die beim Kauf verwendete E-Mail-Adresse an.'],
        ['8. Nutzung und Verantwortung', 'Sie sind dafür verantwortlich, die zur Analyse übermittelte Webadresse rechtmäßig bereitzustellen. SiteCheck AI darf nicht für rechtswidrige Zwecke, Missbrauch, automatisierte Überlastung oder Versuche zur Umgehung von Sicherheitsmaßnahmen verwendet werden.'],
        ['9. Verfügbarkeit und Fehler', 'Wir bemühen uns um einen zuverlässigen Dienst, können jedoch keine ununterbrochene Verfügbarkeit garantieren. Wenn die kostenpflichtige Leistung nachweislich nicht wie vernünftigerweise erwartet funktioniert, suchen wir im Rahmen des geltenden Rechts nach einer angemessenen Lösung.'],
        ['10. Geistiges Eigentum', 'Software, Design, Texte und Technik von SiteCheck AI bleiben Eigentum von SJOOM AI Services oder den jeweiligen Rechteinhabern. Der kostenpflichtige Bericht darf vom Kunden für eigene geschäftliche Zwecke verwendet und innerhalb der eigenen Organisation geteilt werden.'],
        ['11. Haftung', 'SiteCheck AI ist ein Analyse- und Entscheidungshilfsmittel. Empfehlungen garantieren keine geschäftlichen, SEO- oder Umsatzergebnisse. Soweit gesetzlich zulässig, ist die Haftung auf unmittelbare Schäden und den für die betreffende kostenpflichtige Leistung gezahlten Betrag begrenzt, außer soweit eine Begrenzung gesetzlich nicht zulässig ist.'],
        ['12. Recht und Gerichtsstand', 'Für die Vereinbarung gilt niederländisches Recht. Soweit gesetzlich zulässig, werden Streitigkeiten einem zuständigen Gericht in den Niederlanden vorgelegt. Verbraucher behalten den zwingenden Schutz, der ihnen nach dem anwendbaren Recht zusteht.'],
      ],
    },
    cookies: {
      title: 'Cookie-Richtlinie',
      intro: 'SiteCheck AI verwendet derzeit keine Werbe- oder Tracking-Cookies für personalisierte Werbung.',
      sections: [
        ['Notwendiger Speicher', 'Die Website kann notwendigen Browser-Speicher verwenden, um einen Scan sicher dem Browser zuzuordnen, mit dem er gestartet wurde. Dadurch kann das Scan-Ergebnis ohne Benutzerkonto verfügbar bleiben.'],
        ['Zahlungen', 'Wenn Sie zur Zahlung zu Stripe weitergeleitet werden, kann Stripe eigene Cookies und ähnliche Technologien verwenden. Die Verarbeitung auf der Zahlungsseite unterliegt auch den Datenschutz- und Cookie-Richtlinien von Stripe.'],
        ['Externe Inhalte', 'SiteCheck AI verwendet Google Fonts für die Darstellung. Beim Laden externer Ressourcen kann Ihr Browser eine Verbindung zu diesen Diensten herstellen.'],
        ['Besuchermessung', 'Nach Einwilligung verwendet SiteCheck AI eine begrenzte Besuchermessung, um Sitzungen und die Nutzung der Website zu verstehen. Dabei wird ein Browserwert gespeichert und unser Server erhält technische Request-Daten, die für die Besuchermeldung erforderlich sind. Dies wird nicht für personalisierte Werbung verwendet.'],
        ['Weitere Informationen', 'Bei Fragen zu Cookies oder ähnlichen Technologien kontaktieren Sie info@sjoomai.nl.'],
      ],
    },
    withdraw: {
      title: 'Kauf widerrufen',
      intro: 'Möchten Sie Ihren Online-Kauf eines SiteCheck AI-Berichts innerhalb der gesetzlichen Widerrufsfrist widerrufen? Verwenden Sie die folgenden Angaben, damit wir den Kauf zuordnen können.',
      sections: [
        ['So funktioniert es', 'Geben Sie Ihren Namen, Ihre E-Mail-Adresse und, sofern bekannt, die Scan- oder Kaufreferenz ein. Ihre Anfrage wird als Widerrufsanfrage an SJOOM AI Services übermittelt. Sie können den Widerruf auch direkt über info@sjoomai.nl erklären.'],
        ['Bitte beachten', 'Ob und in welcher Höhe eine Erstattung erfolgt, hängt von den gesetzlichen Bestimmungen und davon ab, ob Sie ausdrücklich verlangt haben, dass die Dienstleistung während der Widerrufsfrist beginnt.'],
      ],
    },
  },
  fr: {
    privacy: {
      title: 'Politique de confidentialité',
      intro: 'SJOOM AI Services, qui exploite SiteCheck AI, traite les données personnelles uniquement lorsque cela est nécessaire au fonctionnement de SiteCheck AI, au traitement des paiements et à la fourniture des rapports payants.',
      sections: [
        ['Qui est responsable ?', 'SJOOM AI Services (Chambre de commerce 42178075), Oliemolenstraat 12, 5402 LJ Uden, Pays-Bas, est responsable du traitement des données personnelles dans SiteCheck AI. Contact : info@sjoomai.nl.'],
        ['Quelles données traitons-nous ?', 'Pour un scan, nous traitons l’adresse du site que vous fournissez et les données nécessaires pour rendre le scan et son résultat disponibles. Lors d’un achat, Stripe peut traiter votre adresse e-mail et vos données de paiement. Pour envoyer un rapport payant par e-mail, Resend peut traiter votre adresse e-mail et les données nécessaires au message. SiteCheck AI ne reçoit pas les données complètes de votre carte bancaire.'],
        ['Pourquoi utilisons-nous ces données ?', 'Nous utilisons les données pour effectuer l’analyse du site, rendre les résultats disponibles, traiter les paiements, fournir les rapports payants et assurer l’assistance lorsque cela est nécessaire.'],
        ['Base juridique', 'Selon le traitement concerné, nous nous fondons sur l’exécution du contrat ou des mesures précontractuelles, une obligation légale ou notre intérêt légitime à maintenir le service sécurisé et opérationnel.'],
        ['Partage avec d’autres parties', 'Nous faisons appel à des prestataires spécialisés, notamment Stripe pour les paiements et Resend pour l’envoi d’e-mails. Ils traitent les données pour les services concernés. Nous ne vendons pas de données personnelles.'],
        ['Conservation', 'Les résultats des scans ne sont pas conservés indéfiniment. Les enregistrements des scans gratuits sont automatiquement supprimés après 30 jours. Les scans et rapports payants sont automatiquement supprimés après 365 jours, sauf si une durée plus longue est imposée par la loi ou raisonnablement nécessaire pour une réclamation juridique ou une obligation administrative.'],
        ['Vos droits', 'Lorsque le RGPD le prévoit, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données personnelles et vous opposer à certains traitements. Contactez info@sjoomai.nl. Nous pouvons demander des informations suffisantes pour traiter votre demande.'],
        ['Réclamation', 'Vous pouvez déposer une réclamation auprès de l’autorité néerlandaise de protection des données si vous estimez que vos données personnelles ne sont pas traitées correctement.'],
        ['Modifications', 'Cette politique peut être mise à jour lorsque SiteCheck AI ou ses traitements de données évoluent. La version actuelle est publiée sur cette page.'],
      ],
    },
    terms: {
      title: 'Conditions générales',
      intro: 'Ces conditions s’appliquent à l’utilisation de SiteCheck AI et à l’achat du rapport complet payant de SJOOM AI Services.',
      sections: [
        ['1. Fournisseur', 'SJOOM AI Services (Chambre de commerce 42178075), Oliemolenstraat 12, 5402 LJ Uden, Pays-Bas, info@sjoomai.nl, exploite SiteCheck AI.'],
        ['2. Service', 'SiteCheck AI analyse une page web fournie par l’utilisateur et transforme les signaux disponibles en résultats et recommandations compréhensibles. Le scan est une analyse automatisée et ne garantit aucun résultat SEO, chiffre d’affaires, conversion ou position dans les moteurs de recherche.'],
        ['3. Scan gratuit', 'Le premier scan peut être proposé gratuitement. Le contenu, la disponibilité et le fonctionnement technique peuvent être modifiés sans préavis, tant que les droits légaux des clients ne sont pas limités.'],
        ['4. Rapport complet', 'Le rapport complet coûte 29 € en paiement unique, sauf autre prix indiqué lors de l’achat. Il ne s’agit pas d’un abonnement. Le service payant comprend les points d’amélioration supplémentaires, les recommandations et le rapport PDF décrits lors de l’achat.'],
        ['5. Paiement', 'Les paiements sont traités par Stripe. SiteCheck AI ne traite pas lui-même les données complètes des cartes bancaires. Après un paiement réussi, le rapport payant est rendu disponible et peut être envoyé par e-mail.'],
        ['6. Droit de rétractation', 'Les consommateurs disposent en principe d’un délai légal de rétractation de 14 jours pour les achats en ligne. Lorsque le service commence à la demande du consommateur pendant cette période, les règles légales peuvent s’appliquer à la partie déjà fournie. SiteCheck AI fournit avant l’achat les informations relatives au droit de rétractation et à son exercice.'],
        ['7. Rétractation', 'Un consommateur peut se rétracter dans le délai légal en informant clairement SJOOM AI Services via info@sjoomai.nl ou la fonction de rétractation en ligne de SiteCheck AI. Indiquez de préférence la référence du scan ou de l’achat et l’adresse e-mail utilisée lors de l’achat.'],
        ['8. Utilisation et responsabilité', 'Vous êtes responsable de fournir légalement l’adresse web soumise à l’analyse. Vous ne devez pas utiliser SiteCheck AI à des fins illicites, pour un abus, une surcharge automatisée ou des tentatives de contournement de la sécurité.'],
        ['9. Disponibilité et erreurs', 'Nous visons un service fiable, mais ne pouvons pas garantir une disponibilité ininterrompue. Si le service payant ne fonctionne manifestement pas comme on peut raisonnablement l’attendre, nous chercherons une solution appropriée dans le respect de la loi applicable.'],
        ['10. Propriété intellectuelle', 'Les logiciels, la conception, les textes et la technologie de SiteCheck AI restent la propriété de SJOOM AI Services ou des titulaires de droits concernés. Le rapport payant peut être utilisé par le client à des fins professionnelles propres et partagé au sein de son organisation.'],
        ['11. Responsabilité', 'SiteCheck AI est un outil d’analyse et d’aide à la décision. Les recommandations ne garantissent aucun résultat commercial, SEO ou de chiffre d’affaires. Dans la mesure permise par la loi, la responsabilité est limitée aux dommages directs et au montant payé pour le service concerné, sauf lorsqu’une limitation n’est pas légalement autorisée.'],
        ['12. Droit applicable et juridiction', 'Le droit néerlandais s’applique au contrat. Dans la mesure permise par la loi, les litiges seront soumis à un tribunal compétent aux Pays-Bas. Les consommateurs conservent la protection impérative qui leur est accordée par la législation applicable.'],
      ],
    },
    cookies: {
      title: 'Politique relative aux cookies',
      intro: 'SiteCheck AI n’utilise actuellement pas de cookies publicitaires ou de suivi pour la publicité personnalisée.',
      sections: [
        ['Stockage nécessaire', 'Le site peut utiliser un stockage navigateur nécessaire pour associer de manière sécurisée un scan au navigateur qui l’a lancé. Cela permet de conserver le résultat sans créer de compte.'],
        ['Paiements', 'Lorsque vous êtes redirigé vers Stripe pour payer, Stripe peut utiliser ses propres cookies et technologies similaires. Le traitement sur la page de paiement est également régi par les politiques de confidentialité et de cookies de Stripe.'],
        ['Contenu externe', 'SiteCheck AI utilise Google Fonts pour la présentation visuelle. Lors du chargement de ressources externes, votre navigateur peut se connecter à ces services.'],
        ['Mesure des visites', 'Après consentement, SiteCheck AI utilise une mesure limitée des visites afin de comprendre les sessions et l’utilisation du site. Une valeur est stockée dans le navigateur et notre serveur reçoit les données techniques nécessaires à l’alerte de visite. Elles ne sont pas utilisées pour de la publicité personnalisée.'],
        ['Informations complémentaires', 'Pour toute question concernant les cookies ou technologies similaires, contactez info@sjoomai.nl.'],
      ],
    },
    withdraw: {
      title: 'Rétracter un achat',
      intro: 'Vous souhaitez vous rétracter d’un achat en ligne d’un rapport SiteCheck AI pendant votre délai légal de rétractation ? Utilisez les informations ci-dessous afin que nous puissions identifier l’achat.',
      sections: [
        ['Comment cela fonctionne', 'Indiquez votre nom, votre adresse e-mail et, si vous la connaissez, la référence du scan ou de l’achat. Votre demande sera transmise à SJOOM AI Services comme demande de rétractation. Vous pouvez également nous notifier directement via info@sjoomai.nl.'],
        ['À noter', 'Le montant et les conditions d’un éventuel remboursement dépendent des règles légales applicables et du fait que vous ayez expressément demandé le début du service pendant le délai de rétractation.'],
      ],
    },
  },
  es: {
    privacy: {
      title: 'Política de privacidad',
      intro: 'SJOOM AI Services, que opera SiteCheck AI, trata datos personales únicamente cuando es necesario para operar SiteCheck AI, gestionar pagos y proporcionar informes de pago.',
      sections: [
        ['¿Quién es responsable?', 'SJOOM AI Services (Cámara de Comercio 42178075), Oliemolenstraat 12, 5402 LJ Uden, Países Bajos, es responsable del tratamiento de datos personales dentro de SiteCheck AI. Contacto: info@sjoomai.nl.'],
        ['¿Qué datos tratamos?', 'Para un análisis tratamos la dirección del sitio web que proporcionas y los datos necesarios para ofrecer el análisis y su resultado. En una compra, Stripe puede tratar tu dirección de correo electrónico y los datos de pago. Para enviar un informe de pago por correo electrónico, Resend puede tratar tu dirección y los datos necesarios del mensaje. SiteCheck AI no recibe los datos completos de tu tarjeta.'],
        ['¿Para qué usamos los datos?', 'Usamos los datos para realizar el análisis web, poner los resultados a tu disposición, procesar pagos, entregar informes de pago y ofrecer asistencia cuando sea necesario.'],
        ['Base jurídica', 'Según el tratamiento, nos basamos en la ejecución del contrato o medidas precontractuales, una obligación legal o nuestro interés legítimo en mantener el servicio seguro y operativo.'],
        ['Compartir con terceros', 'Utilizamos proveedores especializados para partes del servicio, como Stripe para pagos y Resend para el envío de correo. Tratan los datos para los servicios que prestan. No vendemos datos personales.'],
        ['Conservación', 'Los resultados de los análisis no se conservan indefinidamente. Los registros de análisis gratuitos se eliminan automáticamente después de 30 días. Los análisis e informes de pago se eliminan automáticamente después de 365 días, salvo que la ley exija un periodo mayor o sea razonablemente necesario para una reclamación legal o una obligación administrativa.'],
        ['Tus derechos', 'Cuando lo establece el RGPD, puedes solicitar acceso, rectificación, eliminación, limitación o portabilidad de tus datos personales y oponerte a determinados tratamientos. Contacta con info@sjoomai.nl. Podemos solicitar información suficiente para tramitar tu solicitud.'],
        ['Reclamaciones', 'Puedes presentar una reclamación ante la autoridad neerlandesa de protección de datos si consideras que tus datos personales no se están tratando correctamente.'],
        ['Cambios', 'Esta política puede actualizarse cuando cambie SiteCheck AI o la forma en que se tratan los datos. La versión actual se publica en esta página.'],
      ],
    },
    terms: {
      title: 'Términos y condiciones',
      intro: 'Estas condiciones se aplican al uso de SiteCheck AI y a la compra del informe completo de pago de SJOOM AI Services.',
      sections: [
        ['1. Proveedor', 'SJOOM AI Services (Cámara de Comercio 42178075), Oliemolenstraat 12, 5402 LJ Uden, Países Bajos, info@sjoomai.nl, opera SiteCheck AI.'],
        ['2. Servicio', 'SiteCheck AI analiza una página web proporcionada por el usuario y convierte las señales disponibles en resultados y recomendaciones comprensibles. El análisis es automatizado y no garantiza resultados de SEO, ingresos, conversión ni posiciones en buscadores.'],
        ['3. Análisis gratuito', 'El primer análisis puede ofrecerse de forma gratuita. El contenido, la disponibilidad y el funcionamiento técnico pueden modificarse sin previo aviso siempre que no se limiten los derechos legales de los clientes.'],
        ['4. Informe completo', 'El informe completo cuesta 29 € en un único pago, salvo que en el momento de la compra se indique otro precio. No es una suscripción. El servicio de pago incluye los puntos de mejora adicionales, las recomendaciones y el informe PDF descritos durante la compra.'],
        ['5. Pago', 'Los pagos se procesan mediante Stripe. SiteCheck AI no procesa directamente los datos completos de las tarjetas. Tras un pago correcto, el informe de pago queda disponible y puede enviarse por correo electrónico.'],
        ['6. Derecho de desistimiento', 'Los consumidores tienen, en principio, un plazo legal de desistimiento de 14 días para las compras online. Si el servicio comienza a petición del consumidor durante ese plazo, pueden aplicarse las normas legales a la parte ya prestada. SiteCheck AI proporciona antes de la compra información sobre el derecho de desistimiento y cómo ejercerlo.'],
        ['7. Desistimiento', 'El consumidor puede desistir dentro del plazo legal notificándolo de forma inequívoca a SJOOM AI Services mediante info@sjoomai.nl o la función de desistimiento online de SiteCheck AI. Se recomienda indicar la referencia del análisis o compra y el correo utilizado para la compra.'],
        ['8. Uso y responsabilidad', 'Eres responsable de proporcionar legalmente la dirección web que sometes al análisis. No puedes utilizar SiteCheck AI para fines ilícitos, abusos, sobrecargas automatizadas o intentos de eludir la seguridad.'],
        ['9. Disponibilidad y errores', 'Buscamos ofrecer un servicio fiable, pero no podemos garantizar una disponibilidad ininterrumpida. Si el servicio de pago no funciona de forma demostrable como cabría esperar razonablemente, buscaremos una solución adecuada conforme a la legislación aplicable.'],
        ['10. Propiedad intelectual', 'El software, diseño, textos y tecnología de SiteCheck AI siguen siendo propiedad de SJOOM AI Services o de los titulares de derechos correspondientes. El cliente puede utilizar el informe de pago para sus propios fines empresariales y compartirlo dentro de su organización.'],
        ['11. Responsabilidad', 'SiteCheck AI es una herramienta de análisis y apoyo a la toma de decisiones. Las recomendaciones no garantizan resultados empresariales, de SEO o de ingresos. En la medida permitida por la ley, la responsabilidad se limita a los daños directos y al importe pagado por el servicio correspondiente, salvo cuando una limitación no esté permitida legalmente.'],
        ['12. Ley y jurisdicción', 'El acuerdo se rige por la legislación neerlandesa. En la medida permitida por la ley, las controversias se someterán a un tribunal competente de los Países Bajos. Los consumidores conservan la protección imperativa que les otorgue la legislación aplicable.'],
      ],
    },
    cookies: {
      title: 'Política de cookies',
      intro: 'Actualmente SiteCheck AI no utiliza cookies publicitarias ni de seguimiento para publicidad personalizada.',
      sections: [
        ['Almacenamiento necesario', 'El sitio puede utilizar almacenamiento necesario del navegador para asociar de forma segura un análisis con el navegador que lo inició. Así, el resultado puede seguir disponible sin crear una cuenta.'],
        ['Pagos', 'Cuando accedes a Stripe para pagar, Stripe puede utilizar sus propias cookies y tecnologías similares. El tratamiento en la página de pago también está sujeto a las políticas de privacidad y cookies de Stripe.'],
        ['Contenido externo', 'SiteCheck AI utiliza Google Fonts para la presentación visual. Al cargar recursos externos, tu navegador puede conectarse con esos servicios.'],
        ['Medición de visitas', 'Tras el consentimiento, SiteCheck AI utiliza una medición limitada de visitas para comprender las sesiones y el uso del sitio. Se guarda un valor en el navegador y nuestro servidor recibe los datos técnicos necesarios para la alerta de visita. No se utilizan para publicidad personalizada.'],
        ['Más información', 'Para preguntas sobre cookies o tecnologías similares, contacta con info@sjoomai.nl.'],
      ],
    },
    withdraw: {
      title: 'Desistir de una compra',
      intro: '¿Quieres desistir de una compra online de un informe de SiteCheck AI dentro de tu plazo legal de desistimiento? Utiliza los datos siguientes para que podamos identificar la compra.',
      sections: [
        ['Cómo funciona', 'Introduce tu nombre, dirección de correo electrónico y, si la conoces, la referencia del análisis o compra. Tu solicitud se enviará a SJOOM AI Services como solicitud de desistimiento. También puedes comunicarlo directamente mediante info@sjoomai.nl.'],
        ['Importante', 'El importe y las condiciones de un posible reembolso dependen de las normas legales aplicables y de si solicitaste expresamente que el servicio comenzara durante el plazo de desistimiento.'],
      ],
    },
  },
} satisfies Partial<Record<Locale, Record<string, { title: string; intro: string; sections: [string, string][] }>>>;

export default function LegalPage({ type }: { type: 'privacy' | 'terms' | 'cookies' | 'withdraw' }) {
  const { locale } = useLanguage();
  const content = legalContent[locale]?.[type] ?? legalContent.en[type];
  const home = locale === 'nl' ? '/nl' : locale === 'en' ? '/en' : `/${locale}`;

  return (
    <main className="site-shell min-h-[100dvh]">
      <nav className="nav-wrap">
        <div className="page-frame flex items-center justify-between">
          <a className="brand-mark" href={home}>
            <span className="brand-name">SiteCheck <span>AI</span></span>
          </a>
          <div className="nav-actions"><LanguageSwitcher /></div>
        </div>
      </nav>
      <section className="section">
        <div className="page-frame legal-page">
          <div className="section-kicker">SJOOM AI Services · SiteCheck AI</div>
          <h1>{content.title}</h1>
          <p className="legal-intro">{content.intro}</p>
          {content.sections.map(([heading, body]) => (
            <section className="legal-section" key={heading}>
              <h2>{heading}</h2>
              <p>{body}</p>
            </section>
          ))}
          {type === 'withdraw' && (
            <form className="legal-withdraw-form" action="mailto:info@sjoomai.nl" method="post" encType="text/plain">
              <label>{locale === 'nl' ? 'Naam' : locale === 'de' ? 'Name' : locale === 'fr' ? 'Nom' : locale === 'es' ? 'Nombre' : 'Name'}<input name="name" required /></label>
              <label>{locale === 'nl' ? 'E-mailadres' : locale === 'de' ? 'E-Mail-Adresse' : locale === 'fr' ? 'Adresse e-mail' : locale === 'es' ? 'Correo electrónico' : 'Email address'}<input name="email" type="email" required /></label>
              <label>{locale === 'nl' ? 'Scan- of aankoopnummer (indien bekend)' : locale === 'de' ? 'Scan- oder Kaufreferenz (falls bekannt)' : locale === 'fr' ? 'Référence du scan ou de l’achat (si connue)' : locale === 'es' ? 'Referencia del análisis o compra (si se conoce)' : 'Scan or purchase reference (if known)'}<input name="reference" /></label>
              <label>{locale === 'nl' ? 'Bericht' : locale === 'de' ? 'Nachricht' : locale === 'fr' ? 'Message' : locale === 'es' ? 'Mensaje' : 'Message'}<textarea name="message" rows={5} required /></label>
              <button type="submit" className="upgrade-main-button">{locale === 'nl' ? 'Herroeping versturen' : locale === 'de' ? 'Widerruf senden' : locale === 'fr' ? 'Envoyer la demande de rétractation' : locale === 'es' ? 'Enviar desistimiento' : 'Submit withdrawal'}</button>
            </form>
          )}
        </div>
      </section>
      <footer className="footer">
        <div className="page-frame footer-inner">
          <span>© {new Date().getFullYear()} SiteCheck AI</span>
          <span><a href={home}>{locale === 'nl' ? 'Home' : 'Home'}</a></span>
        </div>
      </footer>
    </main>
  );
}
