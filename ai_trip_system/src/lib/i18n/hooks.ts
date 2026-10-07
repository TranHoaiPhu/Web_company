import { useLanguage } from "@/context/LanguageContext";
import { Namespace, TranslationOptions } from "./types";
import { createTranslator } from "./index";

/**
 * Hook for translations with namespace
 * @param namespace - The translation namespace to use (default: "common")
 * @returns Object with t function and current language
 *
 * @example
 * const { t } = useTranslation("common");
 * <button>{t("buttons.save")}</button>
 */
export function useTranslation(namespace: Namespace = "common") {
  const { language } = useLanguage();

  const t = (key: string, options?: TranslationOptions) => {
    const translator = createTranslator(language, namespace);
    return translator(key, options);
  };

  return { t, language };
}
