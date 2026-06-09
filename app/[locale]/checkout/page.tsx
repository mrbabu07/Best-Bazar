import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutPageContent } from "@/components/cart/CheckoutPageContent";
import { getDictionary, isLocale } from "@/lib/i18n";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "الدفع" : "Checkout",
    description: "Checkout form with shipping and payment options."
  };
}

export default function CheckoutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <CheckoutPageContent
      locale={params.locale}
      dictionary={getDictionary(params.locale)}
      stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY)}
    />
  );
}
