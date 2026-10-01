import { useLanguage, LanguageSwitcher } from '@/lib/i18n';

type Locale = 'nl' | 'en';

const legalContent = {
  nl: {
    privacy: {
      title: 'Privacyverklaring',
      intro: 'SJOOM AI Services, handelend onder de naam SiteCheck AI, verwerkt persoonsgegevens alleen voor zover dat nodig is om SiteCheck AI te laten werken, betalingen af te handelen en betaalde rapporten te leveren.',
      sections: [
        ['Wie is verantwoordelijk?', 'SJOOM AI Services (KvK 42178075), Oliemolenstraat 12, 5402 LJ Uden, is verantwoordelijk voor de verwerking van persoonsgegevens binnen SiteCheck AI. Contact: info@sjoom.ai.'],
        ['Welke gegevens verwerken we?', 'Bij een scan verwerken we het door jou opgegeven websiteadres en de gegevens die nodig zijn om de scan en het resultaat beschikbaar te maken. Bij een aankoop kan Stripe je e-mailadres en betaalgegevens verwerken. Voor het versturen van een betaald rapport kan Resend het e-mailadres en de noodzakelijke berichtgegevens verwerken. SiteCheck AI ontvangt geen volledige betaalkaartgegevens.'],
        ['Waarvoor gebruiken we gegevens?', 'We gebruiken gegevens om de website-analyse uit te voeren, je scanresultaat beschikbaar te stellen, betalingen te verwerken, een betaald rapport te leveren en ondersteuning te bieden wanneer dat nodig is.'],
        ['Rechtsgrond', 'Afhankelijk van de verwerking baseren we ons op het uitvoeren van de overeenkomst of maatregelen vóór het sluiten daarvan, een wettelijke verplichting of ons gerechtvaardigd belang om de dienst veilig en werkend te houden.'],
        ['Delen met andere partijen', 'Voor onderdelen van de dienstverlening gebruiken we gespecialiseerde dienstverleners, waaronder Stripe voor betalingen en Resend voor e-mail. Zij verwerken gegevens voor de onderdelen waarvoor zij worden ingeschakeld. We verkopen persoonsgegevens niet.'],
        ['Bewaartermijn', 'Scanresultaten worden niet onbeperkt bewaard. We verwijderen gegevens zodra ze niet meer nodig zijn voor het doel waarvoor ze zijn verzameld, rekening houdend met eventuele wettelijke verplichtingen en noodzakelijke administratie. We werken aan automatische bewaartermijnen voor scanresultaten.'],
        ['Jouw rechten', 'Je kunt, voor zover de AVG daarin voorziet, vragen om inzage, correctie, verwijdering, beperking of overdraagbaarheid van persoonsgegevens en bezwaar maken tegen bepaalde verwerkingen. Neem hiervoor contact op via info@sjoom.ai. We kunnen om voldoende informatie vragen om je verzoek te kunnen behandelen.'],
        ['Klacht', 'Je kunt een klacht indienen bij de Autoriteit Persoonsgegevens als je vindt dat je persoonsgegevens niet correct worden verwerkt.'],
        ['Wijzigingen', 'Deze privacyverklaring kan worden aangepast wanneer SiteCheck AI of de manier waarop gegevens worden verwerkt verandert. De actuele versie staat op deze pagina.'],
      ],
    },
    terms: {
      title: 'Algemene voorwaarden',
      intro: 'Deze voorwaarden gelden voor het gebruik van SiteCheck AI en voor de aankoop van het betaalde volledige rapport van SJOOM AI Services.',
      sections: [
        ['1. Identiteit', 'SJOOM AI Services (KvK 42178075), Oliemolenstraat 12, 5402 LJ Uden, info@sjoom.ai, biedt SiteCheck AI aan.'],
        ['2. Dienst', 'SiteCheck AI analyseert een door de gebruiker opgegeven webpagina en vertaalt beschikbare signalen naar begrijpelijke bevindingen en aanbevelingen. De scan is een geautomatiseerde analyse en is geen garantie voor SEO-resultaten, omzet, conversie of posities in zoekmachines.'],
        ['3. Gratis scan', 'De eerste scan kan gratis worden aangeboden. De inhoud, beschikbaarheid en technische werking kunnen zonder voorafgaande aankondiging worden aangepast zolang wettelijke rechten van klanten daardoor niet worden beperkt.'],
        ['4. Volledig rapport', 'Het volledige rapport kost €29 eenmalig, tenzij op het moment van aankoop een andere prijs wordt vermeld. Het is geen abonnement. De betaalde dienst bevat de extra verbeterpunten, aanbevelingen en het PDF-rapport zoals tijdens het aankoopproces omschreven.'],
        ['5. Betaling', 'Betalingen worden verwerkt via Stripe. SiteCheck AI verwerkt zelf geen volledige betaalkaartgegevens. Na een succesvolle betaling wordt het betaalde rapport beschikbaar gemaakt en kan het rapport per e-mail worden aangeboden.'],
        ['6. Herroepingsrecht', 'Voor consumenten geldt in beginsel een wettelijke bedenktijd van 14 dagen bij online aankopen. Wanneer een dienst op verzoek van de consument al tijdens de bedenktijd wordt uitgevoerd, kunnen wettelijke regels gelden voor het al geleverde deel. SiteCheck AI verstrekt vóór de aankoop informatie over het herroepingsrecht en de wijze waarop dit kan worden uitgeoefend.'],
        ['7. Herroeping', 'Een consument kan een aankoop binnen de wettelijke termijn herroepen door dit ondubbelzinnig aan SJOOM AI Services te melden via info@sjoom.ai of via de online herroepingsfunctie van SiteCheck AI. Vermeld bij voorkeur het scan- of aankoopkenmerk en het e-mailadres dat bij de aankoop is gebruikt.'],
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
        ['Tracking en analytics', 'We plaatsen op dit moment geen eigen trackingcookies voor advertentiedoeleinden. Als dat in de toekomst verandert, wordt het cookiebeleid aangepast en wordt waar nodig vooraf toestemming gevraagd.'],
        ['Meer informatie', 'Voor vragen over cookies of vergelijkbare technieken kun je contact opnemen via info@sjoom.ai.'],
      ],
    },
    withdraw: {
      title: 'Aankoop herroepen',
      intro: 'Wil je een online aankoop van het SiteCheck AI-rapport binnen je wettelijke bedenktijd ongedaan maken? Gebruik hieronder de gegevens waarmee we je aankoop kunnen terugvinden.',
      sections: [
        ['Zo werkt het', 'Vul je naam, e-mailadres en indien bekend het scan- of aankoopnummer in. Je verzoek wordt als herroepingsverzoek aan SJOOM AI Services voorgelegd. Je kunt je herroeping ook rechtstreeks melden via info@sjoom.ai.'],
        ['Let op', 'Of en welk bedrag wordt terugbetaald, hangt af van de wettelijke regels en van de vraag of je uitdrukkelijk hebt gevraagd om de dienst tijdens de bedenktijd te laten starten.'],
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy Policy',
      intro: 'SJOOM AI Services, operating SiteCheck AI, processes personal data only where needed to operate SiteCheck AI, handle payments and deliver paid reports.',
      sections: [
        ['Who is responsible?', 'SJOOM AI Services (Chamber of Commerce 42178075), Oliemolenstraat 12, 5402 LJ Uden, Netherlands, is responsible for personal-data processing within SiteCheck AI. Contact: info@sjoom.ai.'],
        ['What data do we process?', 'For a scan we process the website address you provide and data needed to make the scan and result available. For a purchase, Stripe may process your email address and payment details. To deliver a paid report by email, Resend may process your email address and necessary message data. SiteCheck AI does not receive full payment-card details.'],
        ['Why do we use data?', 'We use data to run the website analysis, make scan results available, process payments, deliver paid reports and provide support when necessary.'],
        ['Legal basis', 'Depending on the processing, we rely on performance of a contract or pre-contractual steps, a legal obligation, or our legitimate interest in keeping the service secure and operational.'],
        ['Sharing with other parties', 'We use specialist service providers for parts of the service, including Stripe for payments and Resend for email delivery. They process data for the services for which they are engaged. We do not sell personal data.'],
        ['Retention', 'Scan results are not kept indefinitely. We delete data when it is no longer needed for the purpose for which it was collected, taking legal obligations and necessary records into account. We are implementing automated retention periods for scan results.'],
        ['Your rights', 'Where provided by the GDPR, you may request access, correction, deletion, restriction or portability of personal data and object to certain processing. Contact info@sjoom.ai. We may ask for sufficient information to process your request.'],
        ['Complaints', 'You may lodge a complaint with the Dutch Data Protection Authority if you believe your personal data is not being processed correctly.'],
        ['Changes', 'This privacy policy may be updated when SiteCheck AI or its data processing changes. The current version is published on this page.'],
      ],
    },
    terms: {
      title: 'Terms and Conditions',
      intro: 'These terms apply to the use of SiteCheck AI and the purchase of the paid full report from SJOOM AI Services.',
      sections: [
        ['1. Provider', 'SJOOM AI Services (Chamber of Commerce 42178075), Oliemolenstraat 12, 5402 LJ Uden, Netherlands, info@sjoom.ai, operates SiteCheck AI.'],
        ['2. Service', 'SiteCheck AI analyzes a webpage supplied by the user and turns available signals into understandable findings and recommendations. The scan is an automated analysis and does not guarantee SEO results, revenue, conversion or search-engine rankings.'],
        ['3. Free scan', 'The first scan may be offered free of charge. Content, availability and technical operation may change without prior notice as long as mandatory customer rights are not restricted.'],
        ['4. Full report', 'The full report costs €29 one time unless another price is shown at checkout. It is not a subscription. The paid service includes the additional improvement points, recommendations and PDF report described during checkout.'],
        ['5. Payment', 'Payments are processed by Stripe. SiteCheck AI does not process full payment-card details itself. After successful payment, the paid report is made available and may be delivered by email.'],
        ['6. Withdrawal right', 'Consumers generally have a statutory 14-day withdrawal period for online purchases. Where a service starts during that period at the consumer’s request, statutory rules may apply to the part already supplied. SiteCheck AI provides information about withdrawal rights and how to exercise them before purchase.'],
        ['7. Withdrawal', 'A consumer may withdraw within the statutory period by clearly notifying SJOOM AI Services via info@sjoom.ai or through SiteCheck AI’s online withdrawal function. Preferably include the scan or purchase reference and the email address used for the purchase.'],
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
        ['Tracking and analytics', 'We currently do not place our own tracking cookies for advertising purposes. If this changes, the cookie policy will be updated and consent will be requested where required.'],
        ['More information', 'For questions about cookies or similar technologies, contact info@sjoom.ai.'],
      ],
    },
    withdraw: {
      title: 'Withdraw a purchase',
      intro: 'Would you like to withdraw your online purchase of a SiteCheck AI report within your statutory withdrawal period? Use the details below so we can identify the purchase.',
      sections: [
        ['How it works', 'Enter your name, email address and, if known, the scan or purchase reference. Your request will be submitted as a withdrawal request to SJOOM AI Services. You can also notify us directly at info@sjoom.ai.'],
        ['Please note', 'Whether and how much is refunded depends on applicable statutory rules and on whether you expressly asked us to start the service during the withdrawal period.'],
      ],
    },
  },
} satisfies Record<Locale, Record<string, { title: string; intro: string; sections: [string, string][] }>>;

export default function LegalPage({ type }: { type: 'privacy' | 'terms' | 'cookies' | 'withdraw' }) {
  const { locale } = useLanguage();
  const content = legalContent[locale][type];
  const home = locale === 'nl' ? '/nl' : '/en';

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
            <form className="legal-withdraw-form" action="mailto:info@sjoom.ai" method="post" encType="text/plain">
              <label>{locale === 'nl' ? 'Naam' : 'Name'}<input name="name" required /></label>
              <label>{locale === 'nl' ? 'E-mailadres' : 'Email address'}<input name="email" type="email" required /></label>
              <label>{locale === 'nl' ? 'Scan- of aankoopnummer (indien bekend)' : 'Scan or purchase reference (if known)'}<input name="reference" /></label>
              <label>{locale === 'nl' ? 'Bericht' : 'Message'}<textarea name="message" rows={5} required /></label>
              <button type="submit" className="upgrade-main-button">{locale === 'nl' ? 'Herroeping versturen' : 'Submit withdrawal'}</button>
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
