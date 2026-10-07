import { Language, Namespace, Translations } from "./types";

// Cache for loaded translations
const translationsCache: Record<Language, Partial<Translations>> = {
  vi: {},
  en: {},
};

/**
 * Load translation file for specific namespace
 */
export async function loadTranslation(
  language: Language,
  namespace: Namespace
): Promise<Record<string, unknown>> {
  try {
    const translations = await import(
      `../../../public/locales/${language}/${namespace}.json`
    );
    return translations.default || translations;
  } catch (error) {
    console.error(
      `Failed to load translation: ${language}/${namespace}`,
      error
    );
    return {};
  }
}

/**
 * Load all translations for a language
 */
export async function loadAllTranslations(
  language: Language
): Promise<Translations> {
  const namespaces: Namespace[] = [
    "common",
    "navigation",
    "auth",
    "booking",
    "tour",
    "profile",
    "payment",
    "errors",
    "validation",
    "home",
    "explore",
    "order",
    "map",
  ];

  const translations: Translations = {};

  await Promise.all(
    namespaces.map(async (namespace) => {
      translations[namespace] = await loadTranslation(language, namespace) as import("./types").TranslationNamespace;
    })
  );

  translationsCache[language] = translations;
  return translations;
}

/**
 * Get cached translations
 */
export function getCachedTranslations(
  language: Language
): Partial<Translations> {
  return translationsCache[language];
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(language?: Language) {
  if (language) {
    translationsCache[language] = {};
  } else {
    translationsCache.vi = {};
    translationsCache.en = {};
  }
}
