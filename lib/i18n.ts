import ar from "@/public/locales/ar/common.json";
import en from "@/public/locales/en/common.json";
import type { Locale, LocalizedText } from "@/lib/types";

export type { Locale } from "@/lib/types";

export const locales = ["en", "ar"] as const;
export const defaultLocale: Locale = "en";

const dictionaries = {
  en,
  ar
};

export type Dictionary = typeof en;

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getLocalized(text: LocalizedText, locale: Locale) {
  return text[locale] || text.en;
}

export function isRTL(locale: Locale) {
  return locale === "ar";
}
