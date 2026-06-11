import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FriendlyNotFound } from "@/components/layout/FriendlyNotFound";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "404 | Best Bazar"
};

export default function MissingLocalizedRoute({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <FriendlyNotFound locale={params.locale} />;
}
