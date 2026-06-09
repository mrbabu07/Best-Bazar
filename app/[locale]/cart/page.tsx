import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { getDictionary, isLocale } from "@/lib/i18n";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "سلة التسوق" : "Shopping cart",
    description: "Review cart items and apply coupon codes."
  };
}

export default function CartPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <CartPageContent locale={params.locale} dictionary={getDictionary(params.locale)} />;
}
