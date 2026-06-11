"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { storefrontThemeStyle, type ThemeSettings } from "@/lib/theme-config";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppQuickButton } from "@/components/layout/WhatsAppQuickButton";
import { usePreferencesStore } from "@/store/preferences-store";
import type { CurrencyRates } from "@/utils/currency";
import type { ShippingSettings } from "@/utils/shipping";

export type StorefrontFrameSettings = {
  storeNameEn: string;
  storeNameAr: string;
  announcementEn: string;
  announcementAr: string;
  announcementActive: boolean;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  currencyRates: CurrencyRates;
  shippingSettings: ShippingSettings;
  themeSettings: ThemeSettings;
};

type AppFrameProps = {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
  settings: StorefrontFrameSettings;
};

export function AppFrame({ children, locale, dictionary, settings }: AppFrameProps) {
  const pathname = usePathname();
  const isAdmin = pathname.includes(`/${locale}/admin`);
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);

  useEffect(() => {
    setStorefrontSettings({
      currencyRates: settings.currencyRates,
      shippingSettings: settings.shippingSettings
    });
  }, [setStorefrontSettings, settings.currencyRates, settings.shippingSettings]);

  return (
    <div
      className={isAdmin ? "min-h-screen" : `storefront-theme min-h-screen theme-buttons-${settings.themeSettings.buttonStyle} theme-cards-${settings.themeSettings.productCardStyle}`}
      style={isAdmin ? undefined : storefrontThemeStyle(settings.themeSettings)}
    >
      {isAdmin ? null : <Header locale={locale} dictionary={dictionary} settings={settings} />}
      {children}
      {isAdmin ? null : <Footer locale={locale} dictionary={dictionary} settings={settings} />}
      {isAdmin ? null : <WhatsAppQuickButton locale={locale} phone={settings.whatsapp} />}
    </div>
  );
}
