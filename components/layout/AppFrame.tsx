"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export type StorefrontFrameSettings = {
  storeNameEn: string;
  storeNameAr: string;
  announcementEn: string;
  announcementAr: string;
  announcementActive: boolean;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
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

  return (
    <div className="min-h-screen">
      {isAdmin ? null : <Header locale={locale} dictionary={dictionary} settings={settings} />}
      {children}
      {isAdmin ? null : <Footer locale={locale} dictionary={dictionary} settings={settings} />}
    </div>
  );
}
