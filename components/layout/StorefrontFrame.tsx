"use client";

import { useEffect } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { StorefrontFrameProps } from "@/components/layout/types";
import { WhatsAppQuickButton } from "@/components/layout/WhatsAppQuickButton";
import { storefrontThemeStyle } from "@/lib/theme-config";
import { usePreferencesStore } from "@/store/preferences-store";

export function StorefrontFrame({ children, locale, dictionary, settings }: StorefrontFrameProps) {
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);

  useEffect(() => {
    setStorefrontSettings({
      currencyRates: settings.currencyRates,
      shippingSettings: settings.shippingSettings
    });
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
