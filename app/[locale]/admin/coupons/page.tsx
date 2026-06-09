import type { Metadata } from "next";
import { Plus, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/utils/currency";

export const metadata: Metadata = {
  title: "Coupon Management | Best Bazar"
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

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.coupons}
        title={dictionary.admin.coupons}
        subtitle="Create percent or fixed discounts with expiry dates, usage caps, and order minimums."
        action={
          <Button>
            <Plus size={17} />
            Add coupon
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Min order</th>
                  <th className="px-5 py-3">Usage</th>
                  <th className="px-5 py-3">Expiry</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-5 py-4 font-bold text-navy">{coupon.code}</td>
                    <td className="px-5 py-4 text-neutral-600">
                      {coupon.discountType === "PERCENT"
                        ? `${coupon.discountValue}%`
                        : formatCurrency(Number(coupon.discountValue), "AED", locale)}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {formatCurrency(Number(coupon.minOrderAmount), "AED", locale)}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {coupon.usedCount}/{coupon.maxUses}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">{coupon.expiryDate.toISOString().slice(0, 10)}</td>
                    <td className="px-5 py-4">
                      <Badge tone={coupon.isActive ? "green" : "red"}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50"
                        aria-label="Delete coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Coupon editor</h2>
          <div className="mt-5 grid gap-4">
            {["Code", "Discount value", "Minimum order", "Max uses", "Expiry date"].map((label) => (
              <label key={label} className="grid gap-2 text-sm font-semibold text-navy">
                {label}
                <input className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Discount type
              <select className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm">
                <option>percent</option>
                <option>fixed</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" className="accent-gold-500" defaultChecked />
              Active
            </label>
            <Button>{dictionary.actions.save}</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
