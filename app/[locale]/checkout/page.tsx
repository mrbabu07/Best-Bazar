import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutPageContent } from "@/components/cart/CheckoutPageContent";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPaymentAvailability } from "@/lib/payment-settings";
import { prisma } from "@/lib/prisma";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "الدفع" : "Checkout",
    description: "Checkout form with shipping and payment options."
  };
}

export default async function CheckoutPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const paymentAvailability = await getPaymentAvailability();
  const activeCoupons = await prisma.coupon.count({
    where: {
      isActive: true,
      expiryDate: { gte: new Date() }
    }
  });

  return (
    <CheckoutPageContent
      locale={params.locale}
      dictionary={getDictionary(params.locale)}
      paymentAvailability={paymentAvailability}
      couponOffersAvailable={activeCoupons > 0}
    />
  );
}
