import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Boxes,
  Download,
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

type NumericLike = Prisma.Decimal | number | bigint | string | null | undefined;

type DashboardStatsRow = {
  monthRevenue: NumericLike;
  totalOrders: NumericLike;
  pendingOrders: NumericLike;
  deliveredOrders: NumericLike;
  totalProducts: NumericLike;
  lowStockCount: NumericLike;
  pendingReviews: NumericLike;
  totalCategories: NumericLike;
  totalUsers: NumericLike;
  activeCoupons: NumericLike;
  activeBanners: NumericLike;
};

type DashboardLowStockProduct = {
  id: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  stock: number;
};

type DashboardRecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  total: Prisma.Decimal;
};

type DashboardData = {
  monthRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  lowStockCount: number;
  pendingReviews: number;
  totalCategories: number;
  totalUsers: number;
  activeCoupons: number;
  activeBanners: number;
  revenueSeries: number[];
  lowStockProducts: DashboardLowStockProduct[];
  recentOrders: DashboardRecentOrder[];
};

function toNumber(value: NumericLike) {
  return Number(value ?? 0);
}

function emptyDashboardData(): DashboardData {
  return {
    monthRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    pendingReviews: 0,
    totalCategories: 0,
    totalUsers: 0,
    activeCoupons: 0,
    activeBanners: 0,
    revenueSeries: Array.from({ length: 12 }, () => 0),
    lowStockProducts: [],
    recentOrders: []
  };
}

async function readDashboardStats(): Promise<Omit<DashboardData, "revenueSeries" | "lowStockProducts" | "recentOrders">> {
  const [row] = await prisma.$queryRaw<DashboardStatsRow[]>(
    Prisma.sql`
      SELECT
        (SELECT COALESCE(SUM(total), 0) FROM "Order"
          WHERE "createdAt" >= ${startOfMonth()}
            AND "orderStatus" <> ${OrderStatus.CANCELLED}::"OrderStatus") AS "monthRevenue",
        (SELECT COUNT(*) FROM "Order") AS "totalOrders",
        (SELECT COUNT(*) FROM "Order"
          WHERE "orderStatus" = ${OrderStatus.PENDING}::"OrderStatus") AS "pendingOrders",
        (SELECT COUNT(*) FROM "Order"
          WHERE "orderStatus" = ${OrderStatus.DELIVERED}::"OrderStatus") AS "deliveredOrders",
        (SELECT COUNT(*) FROM "Product" WHERE "isActive" = true) AS "totalProducts",
        (SELECT COUNT(*) FROM "Product" WHERE "isActive" = true AND stock <= 10) AS "lowStockCount",
        (SELECT COUNT(*) FROM "Review" WHERE "isApproved" = false) AS "pendingReviews",
        (SELECT COUNT(*) FROM "Category") AS "totalCategories",
        (SELECT COUNT(*) FROM "User") AS "totalUsers",
        (SELECT COUNT(*) FROM "Coupon" WHERE "isActive" = true) AS "activeCoupons",
        (SELECT COUNT(*) FROM "Banner" WHERE "isActive" = true) AS "activeBanners"
    `
  );

  return {
    monthRevenue: toNumber(row?.monthRevenue),
    totalOrders: toNumber(row?.totalOrders),
    pendingOrders: toNumber(row?.pendingOrders),
    deliveredOrders: toNumber(row?.deliveredOrders),
    totalProducts: toNumber(row?.totalProducts),
    lowStockCount: toNumber(row?.lowStockCount),
    pendingReviews: toNumber(row?.pendingReviews),
    totalCategories: toNumber(row?.totalCategories),
    totalUsers: toNumber(row?.totalUsers),
    activeCoupons: toNumber(row?.activeCoupons),
    activeBanners: toNumber(row?.activeBanners)
  };
}

async function readRevenueSeries() {
  const today = startOfDay(new Date());
  const chartStart = addDays(today, -11);
  const chartEnd = addDays(today, 1);
  const revenueRows = await prisma.$queryRaw<Array<{ day: Date; total: NumericLike }>>(
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
    revenueRows.map((row) => [startOfDay(new Date(row.day)).toISOString(), toNumber(row.total)])
  );

  return Array.from({ length: 12 }).map((_, index) => {
    const day = addDays(today, index - 11);
    return revenueByDay.get(day.toISOString()) ?? 0;
  });
}

async function loadDashboardData(): Promise<DashboardData> {
  const stats = await readDashboardStats();
  const revenueSeries = await readRevenueSeries();
  const lowStockProducts = await prisma.product.findMany({
    where: { isActive: true, stock: { lte: 10 } },
    select: { id: true, nameEn: true, nameAr: true, sku: true, stock: true },
    orderBy: { stock: "asc" },
    take: 5
  });
  const recentOrders = await prisma.order.findMany({
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      paymentStatus: true,
      orderStatus: true,
      total: true
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return {
    ...stats,
    revenueSeries,
    lowStockProducts,
    recentOrders
  };
}

async function loadDashboardDataWithRetry() {
  try {
    return await loadDashboardData();
  } catch (error) {
    console.error("Admin dashboard data load failed. Retrying once.", error);

    try {
      await prisma.$disconnect();
      return await loadDashboardData();
    } catch (retryError) {
      console.error("Admin dashboard data load failed after retry.", retryError);
      return emptyDashboardData();
    }
  }
}

export default async function AdminDashboardPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const {
    monthRevenue,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalProducts,
    lowStockCount,
    pendingReviews,
    totalCategories,
    totalUsers,
    activeCoupons,
    activeBanners,
    lowStockProducts,
    recentOrders,
    revenueSeries
  } = await loadDashboardDataWithRetry();
  const maxRevenue = Math.max(...revenueSeries, 1);
  const notificationCount = pendingOrders + lowStockCount + pendingReviews;

  const quickActions = [
    { label: "View storefront", href: `/${locale}`, icon: Home, tone: "primary" },
    { label: "Add product", href: `/${locale}/admin/products/new`, icon: Plus, tone: "secondary" },
    { label: "Export sales", href: "/api/admin/reports/sales", icon: Download, tone: "secondary" },
    { label: "Manage orders", href: `/${locale}/admin/orders`, icon: Truck, tone: "secondary", count: pendingOrders },
    { label: "Shipping settings", href: `/${locale}/admin/settings`, icon: Settings, tone: "secondary" }
  ] as const;

  const routeGroups = [
    {
      title: "Daily operations",
      description: "Routes for work that needs the fastest admin response.",
      icon: ShoppingCart,
      routes: [
        {
          title: "Orders",
          path: `/${locale}/admin/orders`,
          href: `/${locale}/admin/orders`,
          purpose: "Confirm orders, update delivery status, print invoices, and export sales.",
          actions: ["Pending orders", "Delivery status", "Invoice print", "Sales export"],
          icon: Truck,
          count: pendingOrders,
          countLabel: "pending",
          alert: true
        },
        {
          title: "Reviews",
          path: `/${locale}/admin/reviews`,
          href: `/${locale}/admin/reviews?status=pending`,
          purpose: "Approve, hide, delete, and search customer product reviews.",
          actions: ["Approve", "Hide/delete", "Search", "Product rating"],
          icon: Star,
          count: pendingReviews,
          countLabel: "waiting",
          alert: true
        }
      ]
    },
    {
      title: "Catalog setup",
      description: "Routes for products, variants, category sizes, stock, and product SEO.",
      icon: Boxes,
      routes: [
        {
          title: "Products",
          path: `/${locale}/admin/products`,
          href: `/${locale}/admin/products`,
          purpose: "Edit product info, color/size variants, images, stock, price, and SEO metadata.",
          actions: ["Variants", "Stock", "Images", "SEO/meta"],
          icon: PackageCheck,
          count: lowStockCount,
          countLabel: "low stock",
          alert: true,
          secondary: { label: "Add product", href: `/${locale}/admin/products/new` }
        },
        {
          title: "Categories",
          path: `/${locale}/admin/categories`,
          href: `/${locale}/admin/categories`,
          purpose: "Manage category structure, product type rules, size options, and storefront grouping.",
          actions: ["Category tree", "Size rules", "Product fields", "Shop grouping"],
          icon: Tags,
          count: totalCategories,
          countLabel: "categories"
        }
      ]
    },
    {
      title: "Customers and promotions",
      description: "Routes for customer accounts, roles, offers, and discount campaigns.",
      icon: Users,
      routes: [
        {
          title: "Users",
          path: `/${locale}/admin/users`,
          href: `/${locale}/admin/users`,
          purpose: "View customers, admin roles, account status, and customer order history.",
          actions: ["Customers", "Admin roles", "Ban/unban", "Order history"],
          icon: Users,
          count: totalUsers,
          countLabel: "users"
        },
        {
          title: "Coupons",
          path: `/${locale}/admin/coupons`,
          href: `/${locale}/admin/coupons`,
          purpose: "Create Dubai-ready discounts with usage limits, dates, and checkout eligibility.",
          actions: ["Discounts", "Expiry", "Usage limit", "Checkout rules"],
          icon: TicketPercent,
          count: activeCoupons,
          countLabel: "active"
        }
      ]
    },
    {
      title: "Storefront and settings",
      description: "Routes for what shoppers see and the business settings behind checkout.",
      icon: ImagePlus,
      routes: [
        {
          title: "Banners",
          path: `/${locale}/admin/banners`,
          href: `/${locale}/admin/banners`,
          purpose: "Control homepage hero slides, campaign images, buttons, and display order.",
          actions: ["Hero slides", "Campaign image", "CTA links", "Sort order"],
          icon: ImagePlus,
          count: activeBanners,
          countLabel: "active"
        },
        {
          title: "Settings",
          path: `/${locale}/admin/settings`,
          href: `/${locale}/admin/settings`,
          purpose: "Manage payments, shipping areas, delivery slots, VAT/TRN, theme, SEO, and support links.",
          actions: ["Payments", "Shipping", "VAT/TRN", "Theme UI"],
          icon: Settings
        }
      ]
    }
  ] as const;

  const notificationItems = [
    {
      label: "Pending orders",
      value: pendingOrders,
      detail: "Need confirmation",
      href: `/${locale}/admin/orders?status=PENDING`,
      icon: ShoppingCart,
      tone: pendingOrders > 0 ? "red" : "green"
    },
    {
      label: "Low stock products",
      value: lowStockCount,
      detail: "Stock at 10 or less",
      href: `/${locale}/admin/products`,
      icon: AlertTriangle,
      tone: lowStockCount > 0 ? "gold" : "green"
    },
    {
      label: "Pending reviews",
      value: pendingReviews,
      detail: "Need approval",
      href: `/${locale}/admin/reviews?status=pending`,
      icon: Star,
      tone: pendingReviews > 0 ? "gold" : "green"
    }
  ] as const;

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.dashboard}
        title="Admin route guide"
        subtitle="Open the dashboard and know exactly which admin route handles each ecommerce task."
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-700">Route map</p>
            <h2 className="mt-2 text-xl font-bold text-navy">Choose the right admin area faster</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-neutral-500">
              Each card shows the route, the job it controls, and the exact actions available inside that page.
            </p>
          </div>
          <Badge tone={notificationCount > 0 ? "red" : "green"}>{notificationCount} needs attention</Badge>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {quickActions.map((item) => {
              const Icon = item.icon;
              const count = "count" in item ? item.count ?? 0 : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-neutral-200 bg-paper px-4 py-3 text-sm font-bold text-navy transition hover:border-gold-300 hover:bg-gold-50"
                >
                  <span className="inline-flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-gold-700">
                      <Icon size={17} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {count > 0 ? <Badge tone="red">{count > 99 ? "99+" : count}</Badge> : null}
                    <span className="text-gold-700">-&gt;</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <div id="notifications" className="scroll-mt-24 rounded-md border border-gold-100 bg-gold-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-gold-800" />
                <h3 className="font-bold text-navy">Notifications</h3>
              </div>
              <Badge tone={notificationCount > 0 ? "red" : "green"}>{notificationCount}</Badge>
            </div>
            <div className="mt-3 grid gap-2">
              {notificationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm font-bold text-navy transition hover:bg-gold-100"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Icon size={16} className="shrink-0 text-gold-700" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="hidden text-xs font-semibold text-neutral-500 sm:inline">{item.detail}</span>
                      <Badge tone={item.tone}>{item.value}</Badge>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {routeGroups.map((group) => {
            const GroupIcon = group.icon;

            return (
              <div key={group.title} className="rounded-lg border border-neutral-200 bg-paper p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gold-100 text-gold-800">
                    <GroupIcon size={19} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy">{group.title}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{group.description}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {group.routes.map((route) => {
                    const RouteIcon = route.icon;
                    const routeCount = "count" in route ? route.count : undefined;
                    const countLabel = "countLabel" in route ? route.countLabel : "";
                    const isAlert = "alert" in route && route.alert && typeof routeCount === "number" && routeCount > 0;
                    const hasSecondary = "secondary" in route;

                    return (
                      <article key={route.href} className="flex min-h-64 flex-col rounded-md border border-neutral-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-neutral-100 text-gold-700">
                              <RouteIcon size={18} />
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-navy">{route.title}</h4>
                              <p className="mt-1 truncate rounded bg-paper px-2 py-1 font-mono text-[11px] font-semibold text-neutral-500">
                                {route.path}
                              </p>
                            </div>
                          </div>
                          {typeof routeCount === "number" ? (
                            <Badge tone={isAlert ? "red" : "blue"}>
                              {routeCount > 99 ? "99+" : routeCount} {countLabel}
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-4 text-sm font-semibold leading-6 text-neutral-600">{route.purpose}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {route.actions.map((action) => (
                            <span
                              key={action}
                              className="rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold text-gold-800"
                            >
                              {action}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex flex-wrap gap-2 pt-5">
                          <Link
                            href={route.href}
                            className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-navy px-3 text-sm font-bold text-white transition hover:bg-neutral-800"
                          >
                            Open route
                          </Link>
                          {hasSecondary ? (
                            <Link
                              href={route.secondary.href}
                              className="inline-flex h-10 items-center justify-center rounded-md border border-gold-200 px-3 text-sm font-bold text-navy transition hover:bg-gold-50"
                            >
                              {route.secondary.label}
                            </Link>
                          ) : null}
                        </div>
                      </article>
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
          value={formatCurrency(monthRevenue, "AED", locale)}
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
          value={String(lowStockCount)}
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
              <p className="rounded-md bg-paper p-3 text-sm font-semibold text-neutral-500">No low stock products.</p>
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
                    <Badge tone={order.paymentStatus === "PAID" ? "green" : "gold"}>{order.paymentStatus}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={order.orderStatus === "DELIVERED" ? "green" : "blue"}>{order.orderStatus}</Badge>
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
