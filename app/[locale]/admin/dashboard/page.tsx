import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  DollarSign,
  Home,
  ImagePlus,
  PackageCheck,
  Plus,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  TicketPercent,
  Truck,
  Users
} from "lucide-react";
import { OrderStatus, Prisma } from "@prisma/client";
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
  const chartStart = addDays(today, -11);
  const chartEnd = addDays(today, 1);
  const revenueRows = await prisma.$queryRaw<Array<{ day: Date; total: Prisma.Decimal | null }>>(
    Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COALESCE(SUM(total), 0) AS total
      FROM "Order"
      WHERE "createdAt" >= ${chartStart}
        AND "createdAt" < ${chartEnd}
        AND "orderStatus" <> ${OrderStatus.CANCELLED}::"OrderStatus"
      GROUP BY day
      ORDER BY day ASC
    `
  );
  const revenueByDay = new Map(
    revenueRows.map((row) => [startOfDay(new Date(row.day)).toISOString(), Number(row.total ?? 0)])
  );
  const revenueSeries = Array.from({ length: 12 }).map((_, index) => {
    const day = addDays(today, index - 11);
    return revenueByDay.get(day.toISOString()) ?? 0;
  });
  const maxRevenue = Math.max(...revenueSeries, 1);
  const quickActions = [
    { label: "View storefront", href: `/${locale}`, icon: Home, tone: "primary" },
    { label: "Add product", href: `/${locale}/admin/products#product-editor`, icon: Plus, tone: "secondary" },
    { label: "Manage orders", href: `/${locale}/admin/orders`, icon: Truck, tone: "secondary" },
    { label: "Shipping settings", href: `/${locale}/admin/settings`, icon: Settings, tone: "secondary" }
  ];
  const controlGroups = [
    {
      title: locale === "ar" ? "إدارة الكتالوج" : "Catalog control",
      description: locale === "ar" ? "المنتجات والتصنيفات والمخزون." : "Products, categories, and inventory.",
      icon: Boxes,
      links: [
        { label: dictionary.admin.products, href: `/${locale}/admin/products`, icon: PackageCheck },
        { label: dictionary.admin.categories, href: `/${locale}/admin/categories`, icon: Tags }
      ]
    },
    {
      title: locale === "ar" ? "إدارة الطلبات" : "Order control",
      description: locale === "ar" ? "الطلبات والتحديثات والتقييمات." : "Orders, fulfillment, and reviews.",
      icon: ShoppingCart,
      links: [
        { label: dictionary.admin.orders, href: `/${locale}/admin/orders`, icon: Truck },
        { label: dictionary.admin.reviews, href: `/${locale}/admin/reviews`, icon: Star }
      ]
    },
    {
      title: locale === "ar" ? "العملاء والعروض" : "Customers and promos",
      description: locale === "ar" ? "المستخدمون والقسائم والعروض." : "Users, coupons, and campaigns.",
      icon: Users,
      links: [
        { label: dictionary.admin.users, href: `/${locale}/admin/users`, icon: Users },
        { label: dictionary.admin.coupons, href: `/${locale}/admin/coupons`, icon: TicketPercent }
      ]
    },
    {
      title: locale === "ar" ? "واجهة المتجر" : "Storefront control",
      description: locale === "ar" ? "البانرات والإعدادات العامة." : "Hero banners and store settings.",
      icon: ImagePlus,
      links: [
        { label: locale === "ar" ? "البانرات" : "Banners", href: `/${locale}/admin/banners`, icon: ImagePlus },
        { label: dictionary.admin.settings, href: `/${locale}/admin/settings`, icon: Settings }
      ]
    }
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.dashboard}
        title={dictionary.admin.dashboard}
        subtitle="Revenue, order, inventory, and fulfillment overview for the last 30 days."
        action={
          <div className="flex flex-wrap gap-2">
            {quickActions.slice(0, 2).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.tone === "primary"
                      ? "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-navy px-4 text-sm font-bold text-white hover:bg-neutral-800"
                      : "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gold-200 bg-white px-4 text-sm font-bold text-navy hover:bg-gold-50"
                  }
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        }
      />

      <section className="mb-6 rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-700">
              {locale === "ar" ? "مركز التحكم" : "Control center"}
            </p>
            <h2 className="mt-2 text-xl font-bold text-navy">
              {locale === "ar" ? "كل جزء منفصل مثل لوحة تجارة إلكترونية" : "Separate ecommerce management areas"}
            </h2>
          </div>
          <Badge tone="gold">{locale === "ar" ? "إدارة سريعة" : "Quick manage"}</Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-neutral-200 bg-paper px-4 py-3 text-sm font-bold text-navy transition hover:border-gold-300 hover:bg-gold-50"
              >
                <span className="inline-flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-gold-700">
                    <Icon size={17} />
                  </span>
                  {item.label}
                </span>
                <span className="text-gold-700">-&gt;</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {controlGroups.map((group) => {
            const GroupIcon = group.icon;

            return (
              <div key={group.title} className="rounded-lg border border-neutral-200 bg-paper p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-gold-100 text-gold-800">
                    <GroupIcon size={19} />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy">{group.title}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{group.description}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {group.links.map((item) => {
                    const ItemIcon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex h-10 items-center justify-between gap-3 rounded-md bg-white px-3 text-sm font-bold text-navy transition hover:bg-gold-50"
                      >
                        <span className="inline-flex items-center gap-2">
                          <ItemIcon size={16} className="text-gold-700" />
                          {item.label}
                        </span>
                        <span className="text-gold-700">-&gt;</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
