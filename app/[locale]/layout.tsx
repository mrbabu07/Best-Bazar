import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
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

export default function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const isArabic = params.locale === "ar";

  return (
    <html
      lang={params.locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body className={isArabic ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"}>
        {children}
      </body>
    </html>
  );
}
