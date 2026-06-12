import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminCouponManager } from "@/components/admin/AdminCouponManager";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Coupon Management | Best Mart"
};

export default async function AdminCouponsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }
  });
  const couponRows = coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: Number(coupon.minOrderAmount),
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    expiryDate: coupon.expiryDate.toISOString().slice(0, 10),
    isActive: coupon.isActive
  }));

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.coupons}
        title={dictionary.admin.coupons}
        subtitle="Create percent or fixed discounts with expiry dates, usage caps, and order minimums."
        action={
          <a
            href="#coupon-editor"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-semibold text-navy shadow-soft transition hover:from-gold-400 hover:to-gold-200"
          >
            <Plus size={17} />
            Add coupon
          </a>
        }
      />

      <AdminCouponManager locale={locale} coupons={couponRows} saveLabel={dictionary.actions.save} />
    </div>
  );
}
