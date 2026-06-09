import type { Locale } from "@/lib/types";

export type CurrencyCode = "AED" | "BDT" | "USD";

export const currencyOptions: Array<{
  code: CurrencyCode;
  label: string;
  symbol: string;
  rateFromAED: number;
}> = [
  { code: "AED", label: "AED", symbol: "د.إ", rateFromAED: 1 },
  { code: "BDT", label: "BDT", symbol: "৳", rateFromAED: 33.5 },
  { code: "USD", label: "USD", symbol: "$", rateFromAED: 0.272 }
];

export const currencyRates: Record<CurrencyCode, number> = {
  AED: 1,
  BDT: 33.5,
  USD: 0.272
};

export function convertFromAED(amount: number, currency: CurrencyCode) {
  return amount * currencyRates[currency];
}

export function formatCurrency(amountInAED: number, currency: CurrencyCode, locale: Locale) {
  const converted = convertFromAED(amountInAED, currency);
  const numberLocale = locale === "ar" ? "ar-AE" : "en-US";

  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "BDT" ? 0 : 2
  }).format(converted);
}
