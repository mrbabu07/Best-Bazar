"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import type { StorefrontFrameProps } from "@/components/layout/types";
import { WhatsAppQuickButton } from "@/components/layout/WhatsAppQuickButton";
import { safeResponseJson } from "@/lib/safe-json";
import { normalizeThemeSettings, storefrontThemeStyle } from "@/lib/theme-config";
import { usePreferencesStore } from "@/store/preferences-store";
import { normalizeCurrencyRates } from "@/utils/currency";
import { normalizeShippingSettings } from "@/utils/shipping";

export function StorefrontFrame({ children, locale, dictionary, settings }: StorefrontFrameProps) {
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);
  const [liveSettings, setLiveSettings] = useState(settings);

  useEffect(() => {
    let active = true;
    const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

    setStorefrontSettings({
      currencyRates: settings.currencyRates,
      shippingSettings: settings.shippingSettings
    });
    setLiveSettings(settings);

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

        const nextCurrencyRates = normalizeCurrencyRates({
          AED: 1,
          BDT: data?.aedToBdt,
          USD: data?.aedToUsd
        });
        const nextShippingSettings = normalizeShippingSettings({
          freeShippingThreshold: data?.freeShippingThreshold,
          shippingRates: data?.shippingRates
        });

        setLiveSettings((current) => ({
          ...current,
          announcementEn: text(data?.announcementEn, current.announcementEn),
          announcementAr: text(data?.announcementAr, current.announcementAr),
          announcementActive:
            typeof data?.announcementActive === "boolean" ? data.announcementActive : current.announcementActive,
          phone: text(data?.phone, current.phone),
          whatsapp: text(data?.whatsapp, current.whatsapp),
          email: text(data?.storeEmail, current.email),
          address: text(data?.address, current.address),
          instagram: text(data?.instagram, current.instagram),
          facebook: text(data?.facebook, current.facebook),
          tiktok: text(data?.tiktok, current.tiktok),
          currencyRates: nextCurrencyRates,
          shippingSettings: nextShippingSettings,
          themeSettings: normalizeThemeSettings(data?.themeSettings ?? current.themeSettings)
        }));
        setStorefrontSettings({
          currencyRates: nextCurrencyRates,
          shippingSettings: nextShippingSettings
        });
      } catch {
        // Keep the server-rendered settings if the live refresh cannot complete.
      }
    };

    void refreshSettings();

    return () => {
      active = false;
    };
  }, [setStorefrontSettings, settings]);

  return (
    <div
      className={`storefront-theme min-h-screen theme-buttons-${liveSettings.themeSettings.buttonStyle} theme-cards-${liveSettings.themeSettings.productCardStyle}`}
      style={storefrontThemeStyle(liveSettings.themeSettings)}
    >
      <Header locale={locale} dictionary={dictionary} settings={liveSettings} />
      <div className="pb-20 lg:pb-0">{children}</div>
      <Footer locale={locale} dictionary={dictionary} settings={liveSettings} />
      <MobileBottomNav locale={locale} />
      <WhatsAppQuickButton locale={locale} phone={liveSettings.whatsapp} />
    </div>
  );
}
