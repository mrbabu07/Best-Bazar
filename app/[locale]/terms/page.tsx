import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { isLocale } from "@/lib/i18n";
import { getCachedPublicSettings } from "@/lib/settings";
import { normalizeThemeSettings } from "@/lib/theme-config";

export const metadata: Metadata = { title: "Terms and Conditions | AyVella" };

export default async function TermsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const settings = await getCachedPublicSettings();
  const content = normalizeThemeSettings(settings?.themeSettings).storefrontContent;
  const arabic = params.locale === "ar";
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><BackButton label="Back" fallbackHref={`/${params.locale}`} className="mb-5" /><article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-soft sm:p-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">{settings?.storeNameEn ?? "AyVella"}</p><h1 className="mt-2 text-3xl font-bold text-navy">{arabic ? content.termsTitleAr : content.termsTitleEn}</h1><p className="mt-8 whitespace-pre-line text-sm leading-7 text-neutral-700">{arabic ? content.termsBodyAr : content.termsBodyEn}</p></article></main>;
}
