import { Language, Namespace, TranslationOptions } from "./types";
import { getCachedTranslations } from "./translations";

/**
 * Get nested value from object using dot notation
 * Example: get(obj, "user.name") => obj.user.name
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Replace parameters in translation string
 * Example: "Hello {name}" with {name: "John"} => "Hello John"
 */
function replaceParams(
  text: string,
  params?: Record<string, string | number>
): string {
  if (!params) return text;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, text);
}

/**
 * Main translation function
 */
export function translate(
  language: Language,
  key: string,
  options?: TranslationOptions
): string {
  const { defaultValue, params } = options || {};

  // Parse key: "namespace:path.to.key"
  const [namespace, ...pathParts] = key.split(":");
  const path = pathParts.join(":");

  // Get translations for namespace
  const translations = getCachedTranslations(language);
  const namespaceTranslations = translations[namespace as Namespace];

  if (!namespaceTranslations) {
    console.warn(`Translation namespace not found: ${namespace}`);
    return defaultValue || key;
  }

  // Get translation value
  const value = getNestedValue(namespaceTranslations, path);

  if (value === undefined || value === null) {
    console.warn(`Translation key not found: ${key}`);
    return defaultValue || key;
  }

  // Replace params if provided
  return replaceParams(String(value), params);
}

/**
 * Create scoped translation function for a namespace
 */
export function createTranslator(language: Language, namespace: Namespace) {
  return (key: string, options?: TranslationOptions) => {
    return translate(language, `${namespace}:${key}`, options);
  };
}
