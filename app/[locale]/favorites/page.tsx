import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FavouritesPageContent } from "@/components/product/FavouritesPageContent";
import { isLocale } from "@/lib/i18n";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "Favourites" : "Favourites",
    description: "Saved favourite products."
  };
}

export default function FavouritesPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <FavouritesPageContent locale={params.locale} />;
}
