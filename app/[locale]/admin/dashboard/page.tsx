import type { Metadata } from "next";
import { DollarSign, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/utils/currency";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard | Best Bazar"
};

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default async function AdminDashboardPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const [
    monthRevenue,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalProducts,
    lowStockProducts,
    recentOrders
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth() }, orderStatus: { not: OrderStatus.CANCELLED } },
      _sum: { total: true }
    }),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
    prisma.product.count(),
    prisma.product.findMany({
      where: { stock: { lte: 10 } },
      orderBy: { stock: "asc" },
      take: 5
    }),
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const today = startOfDay(new Date());
  const revenueSeries = await Promise.all(
    Array.from({ length: 12 }).map(async (_, index) => {
      const day = addDays(today, index - 11);
      const nextDay = addDays(day, 1);
      const result = await prisma.order.aggregate({
        where: {
          createdAt: { gte: day, lt: nextDay },
          orderStatus: { not: OrderStatus.CANCELLED }
        },
        _sum: { total: true }
      });

      return Number(result._sum.total ?? 0);
    })
  );
  const maxRevenue = Math.max(...revenueSeries, 1);

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.dashboard}
        title={dictionary.admin.dashboard}
        subtitle="Revenue, order, inventory, and fulfillment overview for the last 30 days."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={dictionary.admin.revenue}
          value={formatCurrency(Number(monthRevenue._sum.total ?? 0), "AED", locale)}
          detail="This month"
          icon={DollarSign}
          tone="gold"
        />
        <AdminMetricCard
          label={dictionary.admin.pendingOrders}
          value={String(pendingOrders)}
          detail={`${totalOrders} total orders`}
          icon={ShoppingCart}
          tone="blue"
        />
        <AdminMetricCard
          label={dictionary.admin.deliveredOrders}
          value={String(deliveredOrders)}
          detail="Completed successfully"
          icon={Truck}
          tone="green"
        />
        <AdminMetricCard
          label={dictionary.admin.lowStock}
          value={String(lowStockProducts.length)}
          detail={`${totalProducts} active products`}
          icon={PackageCheck}
          tone="red"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-navy">{dictionary.admin.revenueChart}</h2>
            <Badge tone="gold">30 days</Badge>
          </div>
          <div className="mt-6 flex h-72 items-end gap-2">
            {revenueSeries.map((value, index) => (
              <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-gold-600 to-gold-300"
                  style={{ height: `${Math.max((value / maxRevenue) * 100, 12)}%` }}
                />
                <span className="text-[10px] font-semibold text-neutral-400">{index + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">{dictionary.admin.lowStock}</h2>
          <div className="mt-4 grid gap-3">
            {lowStockProducts.length === 0 ? (
              <p className="rounded-md bg-paper p-3 text-sm font-semibold text-neutral-500">
                No low stock products.
              </p>
            ) : null}
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-4 rounded-md bg-paper p-3">
                <div>
                  <p className="font-semibold text-navy">{locale === "ar" ? product.nameAr : product.nameEn}</p>
                  <p className="text-xs text-neutral-500">{product.sku}</p>
                </div>
                <Badge tone={product.stock <= 5 ? "red" : "gold"}>{product.stock} left</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="text-lg font-bold text-navy">{dictionary.admin.recentOrders}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-5 py-4 font-bold text-navy">{order.orderNumber}</td>
                  <td className="px-5 py-4 text-neutral-600">{order.customerName}</td>
                  <td className="px-5 py-4">
                    <Badge tone={order.paymentStatus === "PAID" ? "green" : "gold"}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={order.orderStatus === "DELIVERED" ? "green" : "blue"}>
                      {order.orderStatus}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 font-bold text-navy">
                    {formatCurrency(Number(order.total), "AED", locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
