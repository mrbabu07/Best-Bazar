"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultCurrencyRates,
  normalizeCurrencyRates,
  type CurrencyCode,
  type CurrencyRates
} from "@/utils/currency";
import {
  defaultShippingSettings,
  normalizeShippingSettings,
  type ShippingSettings
} from "@/utils/shipping";

type PreferencesState = {
  colorMode: "light" | "dark";
  currency: CurrencyCode;
  currencyRates: CurrencyRates;
  shippingSettings: ShippingSettings;
  toggleColorMode: () => void;
  setCurrency: (currency: CurrencyCode) => void;
  setStorefrontSettings: (settings: {
    currencyRates: CurrencyRates;
    shippingSettings: ShippingSettings;
  }) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      colorMode: "light",
      currency: "AED",
      currencyRates: defaultCurrencyRates,
      shippingSettings: defaultShippingSettings,
      toggleColorMode: () =>
        set((state) => ({
          colorMode: state.colorMode === "dark" ? "light" : "dark"
        })),
      setCurrency: (currency) => set({ currency }),
      setStorefrontSettings: (settings) =>
        set({
          currencyRates: normalizeCurrencyRates(settings.currencyRates),
          shippingSettings: normalizeShippingSettings(settings.shippingSettings)
        })
    }),
    {
      name: "best-mart-preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ colorMode: state.colorMode, currency: state.currency })
    }
  )
);
