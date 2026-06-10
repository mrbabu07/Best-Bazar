import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Cairo, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/layout/AppFrame";
import { getDictionary, isLocale, isRTL } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { normalizeCurrencyRates } from "@/utils/currency";
import { normalizeShippingSettings } from "@/utils/shipping";
import { Providers } from "./providers";
import "../globals.css";

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
  const settings = await prisma.setting.findUnique({
    where: { id: "store-settings" }
  });

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
    shippingSettings: normalizeShippingSettings(settings)
  };
}

const getCachedFrameSettings = unstable_cache(getFrameSettings, ["frame-settings"], {
  revalidate: 60,
  tags: ["settings"]
});

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
  const settings = await getCachedFrameSettings();

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
