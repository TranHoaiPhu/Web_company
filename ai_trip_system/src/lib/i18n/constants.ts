import { Language, Namespace } from "./types";

export const LANGUAGES: readonly Language[] = ["vi", "en"] as const;

export const DEFAULT_LANGUAGE: Language = "vi";

export const NAMESPACES: readonly Namespace[] = [
  "common",
  "navigation",
  "auth",
  "booking",
  "tour",
  "profile",
  "payment",
  "errors",
  "validation",
] as const;

export const LANGUAGE_NAMES: Record<Language, string> = {
  vi: "Tiếng Việt",
  en: "English",
};
