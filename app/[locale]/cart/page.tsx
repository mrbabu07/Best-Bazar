import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { normalizeThemeSettings } from "@/lib/theme-config";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "سلة التسوق" : "Shopping cart",
    description: "Review cart items and apply coupon codes."
  };
}

export default async function CartPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const [activeCoupons, settings] = await Promise.all([
    prisma.coupon.count({
      where: {
        isActive: true,
        expiryDate: { gte: new Date() }
      }
    }),
    prisma.setting.findUnique({
      where: { id: "store-settings" },
      select: { themeSettings: true }
    })
  ]);
  const checkoutControls = normalizeThemeSettings(settings?.themeSettings).checkoutControls;

  return (
    <CartPageContent
      locale={params.locale}
      dictionary={getDictionary(params.locale)}
      couponOffersAvailable={checkoutControls.showCouponBox && activeCoupons > 0}
    />
  );
}
