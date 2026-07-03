import type { Metadata } from "next";
import { Cairo, Cormorant_Garamond, Croissant_One, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppFrame } from "@/components/layout/AppFrame";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { getDictionary, isLocale, isRTL } from "@/lib/i18n";
import { getCachedPublicSettings } from "@/lib/settings";
import { getStoreCategories } from "@/lib/storefront";
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

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-editorial",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "AyVella",
    template: "%s | AyVella"
  },
  description: "AyVella modest fashion and lifestyle shopping across the UAE.",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/ayvella-mark.svg",
    shortcut: "/brand/ayvella-mark.svg",
    apple: "/brand/ayvella-mark.svg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AyVella",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AyVella",
    title: "AyVella - UAE Online Fashion",
    description: "AyVella modest fashion and lifestyle shopping across the UAE",
  },
  twitter: {
    card: "summary",
    title: "AyVella - UAE Online Fashion",
    description: "AyVella modest fashion and lifestyle shopping across the UAE",
  },
};

async function getFrameSettings() {
  const [settingsResult, categoriesResult] = await Promise.allSettled([
    getCachedPublicSettings(),
    getStoreCategories()
  ]);
  const settings = settingsResult.status === "fulfilled" ? settingsResult.value : null;
  const navigationCategories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];

  if (settingsResult.status === "rejected") {
    console.error("Public settings unavailable. Rendering storefront defaults.", settingsResult.reason);
  }

  const themeSettings = normalizeThemeSettings(settings?.themeSettings);

  return {
    storeNameEn: settings?.storeNameEn ?? "AyVella",
    storeNameAr: settings?.storeNameAr ?? "آي فيلا",
    logo: settings?.logo ?? "/brand/ayvella-logo.svg",
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
    storefrontContent: themeSettings.storefrontContent,
    navigationCategories: navigationCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      nameEn: category.name.en,
      nameAr: category.name.ar,
      parentCategoryId: category.parentCategory ?? null
    }))
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
      className={`${inter.variable} ${cairo.variable} ${croissantOne.variable} ${cormorant.variable}`}
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
