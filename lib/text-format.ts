import type { Locale, LocalizedText } from "@/lib/types";
import { getLocalized } from "@/lib/i18n";

const lowerCaseSmallWords = new Set(["and", "or", "of", "the", "a", "an", "in", "on", "for", "to", "with"]);

export function titleCaseWords(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) => {
      if (!word) {
        return word;
      }

      const lower = word.toLowerCase();
      const shouldKeepLower = index > 0 && lowerCaseSmallWords.has(lower);
      const [first = "", ...rest] = lower;

      return shouldKeepLower ? lower : `${first.toUpperCase()}${rest.join("")}`;
    })
    .join(" ");
}

export function getDisplayName(name: LocalizedText, locale: Locale) {
  const value = getLocalized(name, locale);

  return locale === "en" ? titleCaseWords(value) : value;
}
