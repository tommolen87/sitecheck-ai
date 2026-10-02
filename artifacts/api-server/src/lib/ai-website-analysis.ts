import OpenAI from "openai";
import type { ScanAnalysisResult, WebsiteAiContext } from "./website-analysis";
import { languageName, type Locale } from "./locale";

export type AiRecommendation = {
  title: string;
  whatFound: string;
  whyImportant: string;
  whatToImprove: string;
  proposal: string | null;
  impact: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
  confidence: "high" | "medium" | "low";
  basedOnChecks: string[];
};

type RawSelection = {
  issueId: string;
  title: string;
  whatFound: string;
  whyImportant: string;
  whatToImprove: string;
  confidence: "high" | "medium" | "low";
  proposal: string | null;
};

const AI_MAX_INPUT_CHARS = 60_000;
const AI_MAX_OUTPUT_TOKENS = 4_096;
const AI_DAILY_CALL_LIMIT = 100;
const aiDailyUsage = { day: "", calls: 0 };

function reserveAiCall(): void {
  const day = new Date().toISOString().slice(0, 10);
  if (aiDailyUsage.day !== day) {
    aiDailyUsage.day = day;
    aiDailyUsage.calls = 0;
  }
  if (aiDailyUsage.calls >= AI_DAILY_CALL_LIMIT) {
    throw new Error("Daily AI analysis limit reached.");
  }
  aiDailyUsage.calls += 1;
}

function limitText(value: unknown, maxChars: number): string {
  return typeof value === "string" ? value.slice(0, maxChars) : "";
}

const outputSchema = {
  name: "sitecheck_ai_recommendations",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["recommendations"],
    properties: {
      recommendations: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["issueId", "title", "whatFound", "whyImportant", "whatToImprove", "confidence", "proposal"],
          properties: {
            issueId: { type: "string" },
            title: { type: "string" },
            whatFound: { type: "string" },
            whyImportant: { type: "string" },
            whatToImprove: { type: "string" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            proposal: { type: "string" },
          },
        },
      },
    },
  },
} as const;

function getClient(): OpenAI | null {
  const managedKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const managedBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const directKey = process.env.OPENAI_API_KEY;

  if (managedKey && managedBaseUrl) {
    return new OpenAI({ apiKey: managedKey, baseURL: managedBaseUrl, timeout: 15_000, maxRetries: 1 });
  }
  if (directKey) {
    return new OpenAI({ apiKey: directKey, timeout: 15_000, maxRetries: 1 });
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSelection(value: unknown): RawSelection | null {
  if (
    !isRecord(value) ||
    Object.keys(value).some(
      (key) => key !== "issueId" && key !== "title" && key !== "whatFound" && key !== "whyImportant" && key !== "whatToImprove" && key !== "confidence" && key !== "proposal",
    )
  ) {
    return null;
  }
  if (
    typeof value.issueId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.whatFound !== "string" ||
    typeof value.whyImportant !== "string" ||
    typeof value.whatToImprove !== "string" ||
    !["high", "medium", "low"].includes(String(value.confidence)) ||
    (value.proposal !== null && typeof value.proposal !== "string")
  ) {
    return null;
  }
  return {
    issueId: value.issueId,
    title: value.title,
    whatFound: value.whatFound,
    whyImportant: value.whyImportant,
    whatToImprove: value.whatToImprove,
    confidence: value.confidence as RawSelection["confidence"],
    proposal: value.proposal as string | null,
  };
}

export async function generateAiRecommendations(
  analysis: ScanAnalysisResult,
  context: WebsiteAiContext,
  locale: Locale = "nl",
): Promise<AiRecommendation[] | null> {
  const client = getClient();

  if (!client) return null;
  if (analysis.issues.length === 0) return [];

  const failedLabels = new Set(
  analysis.categoryScores.flatMap((category) =>
    category.checks
      .filter((check) => check.status === "failed")
      .map((check) => check.label),
  ),
);

const eligibleIssues = analysis.issues.map((issue) => ({
  ...issue,
  relatedChecks: issue.relatedChecks.filter((label) =>
    failedLabels.has(label),
  ),
}));

if (eligibleIssues.length === 0) return null;

  reserveAiCall();

  const payload = {
    url: context.url,
    page: {
      title: analysis.detectedFacts.pageTitle,
      metaDescription: analysis.detectedFacts.metaDescription,
      headings: Array.isArray(analysis.detectedFacts.headings) ? analysis.detectedFacts.headings.slice(0, 40).map((value) => limitText(value, 300)) : [],
      visibleHomepageText: limitText(context.visibleTextSnippet, 12_000),
      callsToAction: Array.isArray(analysis.detectedFacts.callsToAction) ? analysis.detectedFacts.callsToAction.slice(0, 30).map((value) => limitText(value, 300)) : [],
      primaryCta: analysis.detectedFacts.primaryCta,
      valuePropositionSignal: analysis.detectedFacts.valuePropositionSignal,
      targetAudienceSignal: analysis.detectedFacts.targetAudienceSignal,
    },
    conversionContext: {
      primaryCta: analysis.detectedFacts.primaryCta,
      callsToAction: analysis.detectedFacts.callsToAction,
      valuePropositionSignal: analysis.detectedFacts.valuePropositionSignal,
      targetAudienceSignal: analysis.detectedFacts.targetAudienceSignal,
    },
    scores: analysis.categoryScores.map((category) => ({
      key: category.key,
      label: category.label,
      score: category.score,
      coveragePercent: category.coveragePercent,
    })),
    deterministicRecommendations: eligibleIssues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      measuredFact: issue.fact,
      whyItMatters: issue.whyItMatters,
      action: issue.recommendation,
      impact: issue.impact,
      difficulty: issue.difficulty,
      basedOnFailedChecks: issue.relatedChecks.slice(0, 20).map((value) => limitText(value, 300)),
    })),
  };
  
  const payloadJson = JSON.stringify(payload);
  if (payloadJson.length > AI_MAX_INPUT_CHARS) {
    throw new Error("AI input exceeds the configured size limit.");
  }

  console.log("AI INPUT ISSUES", eligibleIssues.map((issue) => issue.id));
  
  const response = await client.chat.completions.create({
    model: "gpt-5.4-mini",
    max_completion_tokens: AI_MAX_OUTPUT_TOKENS,
    response_format: {
      type: "json_schema",
      json_schema: outputSchema,
    },
    messages: [
      {
  role: "system",
  content: `
    Je bent de senior website-auditor van SiteCheck AI.

    Je verrijkt bestaande, door SiteCheck AI gemeten verbeterpunten. De gewenste rapporttaal is ${languageName(locale)}.

    BELANGRIJK:
    De lijst deterministicRecommendations is leidend.
    Je mag GEEN nieuwe problemen toevoegen en GEEN bestaande problemen verwijderen.

    Je taak is om ieder bestaand verbeterpunt duidelijker, concreter en bruikbaarder te maken voor een ondernemer.

    REGELS:

    1. Behoud ieder item uit deterministicRecommendations.
    2. Maak maximaal 10 aanbevelingen.
    3. Verzin nooit nieuwe problemen.
    4. Verzin nooit feiten over het bedrijf.
    5. Gebruik uitsluitend informatie uit de aangeleverde scan.
    6. Als iets niet betrouwbaar is gemeten, presenteer het niet als een feit.
    7. Houd verschillende onderwerpen daadwerkelijk gescheiden.
    8. Geef per aanbeveling één duidelijk probleem.
    9. Schrijf in de gewenste rapporttaal: natuurlijk, professioneel ${languageName(locale)}.
    10. Schrijf voor een ondernemer en niet voor een developer.
    11. Gebruik geen technische vaktaal tenzij die nodig is om de aanbeveling te begrijpen.
    12. Gebruik afkortingen zoals CTA, SEO en H1 niet losstaand in de klanttekst. In Engels gebruik je bijvoorbeeld "call-to-action button", "visibility in Google" en "main heading". Leg technische termen direct in gewone taal uit.
    13. Verander geen scores.
    13. Verander impact en difficulty niet.
    14. Houd de bestaande issueId exact hetzelfde.
    15. Geef bij proposal een concrete verbetering die daadwerkelijk uit de scan kan worden afgeleid.
    16. Maak proposal zo concreet mogelijk. Als de scan voldoende bronmateriaal bevat, schrijf dan een direct bruikbare voorbeeldtekst of concrete wijziging in plaats van alleen te beschrijven wat de ondernemer moet doen.
    17. Bij een ontbrekende meta description: schrijf, als de paginatitel en zichtbare homepage-inhoud dit toelaten, een concrete kandidaat-meta description. Begin met "Voorsteltekst:" en gebruik uitsluitend informatie die uit de scan blijkt.
    18. Bij een ontbrekende of te algemene CTA: geef, als bestaande CTA's en zichtbare homepage-inhoud voldoende context bieden, één concreet alternatief. Begin met "Voorstel:" en verzin geen nieuwe dienst, prijs of aanbod.
    19. Bij een onduidelijke waardepropositie of doelgroep: geef alleen een voorbeeldzin als de scan daarvoor voldoende feitelijke inhoud bevat. Markeer die als "Voorbeeld:" en vul geen ontbrekende bedrijfsinformatie zelf in.
    20. Bij technische verbeteringen zoals alt-teksten, structured data, social sharing of links: geef een concrete implementatieactie die een ondernemer of webbouwer direct kan uitvoeren, maar verzin geen niet-gemeten feiten.

    TAALKWALITEIT:

    21. Lees iedere gegenereerde titel en ieder tekstveld nog één keer na voordat je JSON teruggeeft. Er mogen geen grammaticale fouten, typefouten, kromme zinnen of onafgemaakte zinnen in staan.
    22. Nederlands moet natuurlijk en idiomatisch Nederlands zijn; vertaal geen Engelse zinsconstructies letterlijk. Let extra op werkwoordsvormen, enkelvoud/meervoud, lidwoorden en woordvolgorde.
    23. Engels moet natuurlijk en professioneel Engels zijn; vermijd Nederlandse zinsconstructies en letterlijke vertalingen. Gebruik consequent één vorm van Engels binnen hetzelfde rapport.
    24. Gebruik in beide talen volledige zinnen waar een toelichting wordt gegeven. Houd de formulering compact en begrijpelijk voor een ondernemer.
    25. Laat website-eigen namen, URLs, merknamen, concrete meetwaarden en letterlijk aangehaalde website-tekst ongewijzigd wanneer die feitelijk uit de scan komt.


    TITELS:

    Maak titels actiegericht en duidelijk.

    Gebruik bijvoorbeeld:

    - "Maak direct duidelijk wat je aanbiedt en voor wie"
    - "Herstel niet-werkende interne links"
    - "Voeg een afbeelding toe voor social sharing"
    - "Verlaag de responstijd van de eerste HTML"
    - "Maak duidelijk voor welke doelgroep de website bedoeld is"
    - "Laat klantreviews of ervaringen duidelijker zien"
    - "Maak de regionale relevantie explicieter"
    - "Voeg een duidelijke kaart- of routeverwijzing toe"
    - "Voeg LocalBusiness structured data toe"
    - "Controleer en herstel externe links"

    Gebruik dus liever niet:

    - "De waardepropositie is niet duidelijk vastgesteld"
    - "Gebroken interne links gevonden"
    - "Open Graph-afbeelding ontbreekt"

    De titel moet vooral duidelijk maken wat de ondernemer kan doen.

    BELANGRIJK ONDERSCHEID:

    Waardepropositie:
    Wat biedt het bedrijf aan en waarom is dat relevant voor de klant?

    Doelgroep:
    Voor wie is het aanbod bedoeld?

    Regiosignaal:
    Wordt duidelijk gemaakt in welke plaats/regio het bedrijf actief is?

    Locatiesignaal:
    Is er een fysieke locatie, kaart, route of andere locatieverwijzing?

    Interne links:
    Links binnen dezelfde website.

    Externe links:
    Links naar andere websites.

    Deze onderwerpen mogen niet met elkaar worden samengevoegd.

    WAAROM HET BELANGRIJK IS:

    Leg kort uit waarom het probleem relevant is voor bijvoorbeeld:

    - conversie;
    - begrijpelijkheid;
    - SEO;
    - lokale vindbaarheid;
    - vertrouwen;
    - gebruikservaring;
    - technische kwaliteit.

    Overdrijf het effect niet.

    VOORSTELLEN:

    Een proposal moet praktisch zijn.

    Bijvoorbeeld:

    "Maak bovenaan de pagina in één duidelijke zin zichtbaar wat het bedrijf aanbiedt, voor welke doelgroep en welke behoefte daarmee wordt opgelost."

    Gebruik alleen informatie die daadwerkelijk uit de website kan worden afgeleid.

    Als de scan bijvoorbeeld alleen kan vaststellen dat een waardepropositie ontbreekt, mag je niet zelf een specifieke dienst of doelgroep verzinnen.

    Voorbeeldteksten mogen wel worden gegeven, maar:

    - markeer ze duidelijk als voorbeeld;
    - presenteer ze nooit als bestaande bedrijfsinformatie;
    - verzin geen diensten, producten, prijzen, locaties, prestaties of contactmogelijkheden.

    CTA-REGELS:

    Gebruik bestaande CTA's als basis.

    Als er een bestaande CTA is, mag je een concreet alternatief voorstellen wanneer dit aantoonbaar aansluit op de bestaande website.

    Als er geen primaire CTA is en de scan geen concrete commerciële actie uit de website kan afleiden:

    - beschrijf het probleem;
    - geef eventueel een generiek CTA-voorbeeld;
    - introduceer geen nieuwe dienst, afspraak, offerte, verkoopactie of contactvorm als feit.

    LINKS:

    Bij interne links:
    Noem alleen daadwerkelijk gevonden niet-werkende interne links.

    Bij externe links:
    Noem alleen daadwerkelijk gevonden niet-bereikbare externe links.

    Houd deze twee onderwerpen volledig gescheiden.

    TECHNIEK:

    Bij responstijd:
    Beschrijf dit als een meting van de eerste HTML-respons.

    Zeg niet dat hiermee Core Web Vitals of de volledige snelheid van de website zijn gemeten.

    Bij Open Graph:
    Leg uit dat dit invloed heeft op hoe een pagina wordt weergegeven wanneer de URL via sociale platforms wordt gedeeld.

    Bij LocalBusiness:
    Leg uit dat structured data bedrijfs- en locatiegegevens gestructureerd aan zoekmachines kan doorgeven.

    BIJ ONTBREKENDE SIGNALEN:

    Een ontbrekend signaal betekent niet automatisch dat het bedrijf iets fout doet.

    Gebruik daarom formuleringen zoals:

    "De scan kon geen duidelijk signaal vaststellen."

    of:

    "Op basis van de gecontroleerde homepage werd geen duidelijk signaal gevonden."

    Vermijd absolute uitspraken zoals:

    "Het bedrijf heeft geen reviews."

    of:

    "De website heeft geen regionale klanten."

    PRIORITERING:

    De bestaande volgorde van deterministicRecommendations is de basis.

    Maak de inhoud per aanbeveling zo concreet mogelijk, maar verander de volgorde niet op basis van een eigen beoordeling.

    OUTPUT:

    Geef uitsluitend JSON volgens het aangeleverde schema.

    Voor iedere recommendation moet worden teruggegeven:

    - issueId
    - title
    - whatFound
    - whyImportant
    - whatToImprove
    - confidence
    - proposal

    Vertaal en herschrijf de vier inhoudelijke velden naar de gewenste rapporttaal, maar verander de feitelijke betekenis, prioriteit of volgorde niet.

    Geef voor ieder bestaand deterministicRecommendation precies één resultaat terug.

    Geen markdown.
    Geen uitleg buiten de JSON.
    Geen nieuwe issueId's.
    Geen nieuwe problemen.
    `
    },
      {
        role: "user",
        content: JSON.stringify({ ...payload, requestedLanguage: locale }),
      },
    ],
  });

  console.log("AI RESPONSE RECEIVED");

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no structured content.");
  const parsed: unknown = JSON.parse(content);
  if (
    !isRecord(parsed) ||
    Object.keys(parsed).some((key) => key !== "recommendations") ||
    !Array.isArray(parsed.recommendations) ||
    parsed.recommendations.length > 10
  ) {
    throw new Error("OpenAI returned an invalid recommendation object.");
  }

  const issuesById = new Map(eligibleIssues.map((issue) => [issue.id, issue]));

const aiByIssueId = new Map<
  string,
  {
    confidence: "high" | "medium" | "low";
    proposal: string | null;
  }
>();

for (const value of parsed.recommendations) {
  const selection = validateSelection(value);

  if (!selection || !issuesById.has(selection.issueId)) {
    continue;
  }

  if (aiByIssueId.has(selection.issueId)) {
    continue;
  }

  aiByIssueId.set(selection.issueId, {
    title: selection.title,
    whatFound: selection.whatFound,
    whyImportant: selection.whyImportant,
    whatToImprove: selection.whatToImprove,
    confidence: selection.confidence,
    proposal: selection.proposal,
  });
}

const recommendations: AiRecommendation[] = eligibleIssues.map((issue) => {
  const ai = aiByIssueId.get(issue.id);

  return {
    title: ai?.title ?? issue.title,
    whatFound: ai?.whatFound ?? issue.fact,
    whyImportant: ai?.whyImportant ?? issue.whyItMatters,
    whatToImprove: ai?.whatToImprove ?? issue.recommendation,
    proposal: ai?.proposal ?? issue.recommendation,
    impact: issue.impact,
    difficulty: issue.difficulty,
    confidence: ai?.confidence ?? "medium",
    basedOnChecks: issue.relatedChecks,
  };
});

return recommendations;
}