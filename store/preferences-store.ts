"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CurrencyCode } from "@/utils/currency";

type PreferencesState = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: "AED",
      setCurrency: (currency) => set({ currency })
    }),
    {
      name: "best-bazar-preferences",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
