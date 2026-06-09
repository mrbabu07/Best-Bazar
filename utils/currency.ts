import type { Locale } from "@/lib/types";

export type CurrencyCode = "AED" | "BDT" | "USD";
export type CurrencyRates = Record<CurrencyCode, number>;

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

export const defaultCurrencyRates: CurrencyRates = {
  AED: 1,
  BDT: 33.5,
  USD: 0.272
};

function normalizeRate(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function normalizeCurrencyRates(rates?: Partial<Record<CurrencyCode, unknown>> | null): CurrencyRates {
  return {
    AED: 1,
    BDT: normalizeRate(rates?.BDT, defaultCurrencyRates.BDT),
    USD: normalizeRate(rates?.USD, defaultCurrencyRates.USD)
  };
}

export function convertFromAED(
  amount: number,
  currency: CurrencyCode,
  rates: CurrencyRates = defaultCurrencyRates
) {
  return amount * normalizeCurrencyRates(rates)[currency];
}

export function formatCurrency(
  amountInAED: number,
  currency: CurrencyCode,
  locale: Locale,
  rates: CurrencyRates = defaultCurrencyRates
) {
  const converted = convertFromAED(amountInAED, currency, rates);
  const numberLocale = locale === "ar" ? "ar-AE" : "en-US";

  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "BDT" ? 0 : 2
  }).format(converted);
}
