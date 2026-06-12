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
  currency: CurrencyCode;
  currencyRates: CurrencyRates;
  shippingSettings: ShippingSettings;
  setCurrency: (currency: CurrencyCode) => void;
  setStorefrontSettings: (settings: {
    currencyRates: CurrencyRates;
    shippingSettings: ShippingSettings;
  }) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: "AED",
      currencyRates: defaultCurrencyRates,
      shippingSettings: defaultShippingSettings,
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
      partialize: (state) => ({ currency: state.currency })
    }
  )
);
