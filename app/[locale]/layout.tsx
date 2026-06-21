import type { Metadata } from "next";
import { Cairo, Croissant_One, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/layout/AppFrame";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
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

const croissantOne = Croissant_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-croissant-one",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Best Mart",
    template: "%s | Best Mart"
  },
  description: "Luxury Dubai-based online shopping experience.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Best Mart",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Best Mart",
    title: "Best Mart - Dubai Online Shopping",
    description: "Luxury Dubai-based online shopping experience",
  },
  twitter: {
    card: "summary",
    title: "Best Mart - Dubai Online Shopping",
    description: "Luxury Dubai-based online shopping experience",
  },
};

async function getFrameSettings() {
  let settings: Awaited<ReturnType<typeof getCachedPublicSettings>> = null;

  try {
    settings = await getCachedPublicSettings();
  } catch (error) {
    console.error("Public settings unavailable. Rendering storefront defaults.", error);
  }

  const themeSettings = normalizeThemeSettings(settings?.themeSettings);

  return {
    storeNameEn: settings?.storeNameEn ?? "Best Mart",
    storeNameAr: settings?.storeNameAr ?? "Best Mart",
    announcementEn: settings?.announcementEn ?? "",
    announcementAr: settings?.announcementAr ?? "",
    announcementActive: settings?.announcementActive ?? false,
    phone: settings?.phone ?? "",
    whatsapp: settings?.whatsapp ?? "",
    email: settings?.storeEmail ?? "",
    address: settings?.address ?? "",
    instagram: settings?.instagram ?? "",
    facebook: settings?.facebook ?? "",
    tiktok: settings?.tiktok ?? "",
    currencyRates: normalizeCurrencyRates({
      AED: 1,
      BDT: settings?.aedToBdt,
      USD: settings?.aedToUsd
    }),
    shippingSettings: normalizeShippingSettings(settings),
    themeSettings,
    storefrontContent: themeSettings.storefrontContent
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
      className={`${inter.variable} ${cairo.variable} ${croissantOne.variable}`}
    >
      <body className={isArabic ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Providers>
          <AppFrame locale={params.locale} dictionary={dictionary} settings={settings}>
            {children}
          </AppFrame>
        </Providers>
      </body>
    </html>
  );
}
