export const SUPPORTED_LOCALES = ["nl", "en", "de", "fr", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(value: unknown): Locale {
  const locale = String(value ?? "").toLowerCase().split("-")[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "nl";
}

export function languageName(locale: Locale): string {
  return {
    nl: "Nederlands",
    en: "English",
    de: "Deutsch",
    fr: "Français",
    es: "Español",
  }[locale];
}
