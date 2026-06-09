"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

type AppFrameProps = {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
};

export function AppFrame({ children, locale, dictionary }: AppFrameProps) {
  const pathname = usePathname();
  const isAdmin = pathname.includes(`/${locale}/admin`);

  return (
    <div className="min-h-screen">
      {isAdmin ? null : <Header locale={locale} dictionary={dictionary} />}
      {children}
      {isAdmin ? null : <Footer locale={locale} dictionary={dictionary} />}
    </div>
  );
}
