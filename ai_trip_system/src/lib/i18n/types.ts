export type Language = "vi" | "en";

export type Namespace =
  | "common"
  | "navigation"
  | "auth"
  | "booking"
  | "tour"
  | "profile"
  | "payment"
  | "errors"
  | "validation"
  | "home"
  | "explore"
  | "order"
  | "map";

export interface TranslationOptions {
  defaultValue?: string;
  params?: Record<string, string | number>;
  count?: number;
}

export interface TranslationNamespace {
  [key: string]: string | TranslationNamespace;
}

export interface Translations {
  [namespace: string]: TranslationNamespace;
}
