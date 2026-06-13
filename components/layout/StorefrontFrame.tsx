"use client";

import { useEffect } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { StorefrontFrameProps } from "@/components/layout/types";
import { WhatsAppQuickButton } from "@/components/layout/WhatsAppQuickButton";
import { safeResponseJson } from "@/lib/safe-json";
import { storefrontThemeStyle } from "@/lib/theme-config";
import { usePreferencesStore } from "@/store/preferences-store";
import { normalizeCurrencyRates } from "@/utils/currency";
import { normalizeShippingSettings } from "@/utils/shipping";

export function StorefrontFrame({ children, locale, dictionary, settings }: StorefrontFrameProps) {
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);

  useEffect(() => {
    let active = true;

    setStorefrontSettings({
      currencyRates: settings.currencyRates,
      shippingSettings: settings.shippingSettings
    });

    const refreshSettings = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = await safeResponseJson<Record<string, unknown>>(response, {});

        if (!active) {
          return;
        }

        setStorefrontSettings({
          currencyRates: normalizeCurrencyRates({
            AED: 1,
            BDT: data?.aedToBdt,
            USD: data?.aedToUsd
          }),
          shippingSettings: normalizeShippingSettings({
            freeShippingThreshold: data?.freeShippingThreshold,
            shippingRates: data?.shippingRates
          })
        });
      } catch {
        // Keep the server-rendered settings if the live refresh cannot complete.
      }
    };

    void refreshSettings();

    return () => {
      active = false;
    };
  }, [setStorefrontSettings, settings.currencyRates, settings.shippingSettings]);

  return (
    <div
      className={`storefront-theme min-h-screen theme-buttons-${settings.themeSettings.buttonStyle} theme-cards-${settings.themeSettings.productCardStyle}`}
      style={storefrontThemeStyle(settings.themeSettings)}
    >
      <Header locale={locale} dictionary={dictionary} settings={settings} />
      {children}
      <Footer locale={locale} dictionary={dictionary} settings={settings} />
      <WhatsAppQuickButton locale={locale} phone={settings.whatsapp} />
    </div>
  );
}
