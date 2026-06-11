import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/layout/AppFrame";
import { getDictionary, isLocale, isRTL } from "@/lib/i18n";
import { getCachedPublicSettings } from "@/lib/settings";
import { normalizeThemeSettings } from "@/lib/theme-config";
import { normalizeCurrencyRates } from "@/utils/currency";
import { normalizeShippingSettings } from "@/utils/shipping";
import { Providers } from "./providers";
import "../globals.css";

export const preferredRegion = "iad1";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Best Bazar",
    template: "%s | Best Bazar"
  },
  description: "Luxury Dubai-based online shopping experience."
};

async function getFrameSettings() {
  const settings = await getCachedPublicSettings();
  return {
    storeNameEn: settings?.storeNameEn ?? "Best Bazar",
    storeNameAr: settings?.storeNameAr ?? "Best Bazar",
    announcementEn: settings?.announcementEn ?? "",
    announcementAr: settings?.announcementAr ?? "",
    announcementActive: settings?.announcementActive ?? false,
    phone: settings?.phone ?? "",
    whatsapp: settings?.whatsapp ?? "",
    email: settings?.storeEmail ?? "",
    address: settings?.address ?? "",
    instagram: settings?.instagram ?? "",
    facebook: settings?.facebook ?? "",
    currencyRates: normalizeCurrencyRates({
      AED: 1,
      BDT: settings?.aedToBdt,
      USD: settings?.aedToUsd
    }),
    shippingSettings: normalizeShippingSettings(settings),
    themeSettings: normalizeThemeSettings(settings?.themeSettings)
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const dictionary = getDictionary(params.locale);
  const isArabic = isRTL(params.locale);
  const settings = await getFrameSettings();

  return (
    <html
      lang={params.locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body className={isArabic ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"}>
        <Providers>
          <AppFrame locale={params.locale} dictionary={dictionary} settings={settings}>
            {children}
          </AppFrame>
        </Providers>
      </body>
    </html>
  );
}
