import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderStatusSelect } from "@/components/admin/AdminOrderStatusSelect";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPrintButton } from "@/components/admin/AdminPrintButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatCurrency, normalizeCurrencyRates, type CurrencyCode } from "@/utils/currency";

export const metadata: Metadata = {
  title: "Order Management | Best Bazar"
};

type AdminOrdersPageProps = {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(searchParams: AdminOrdersPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function getCurrency(currency: string): CurrencyCode {
  return currency === "BDT" || currency === "USD" ? currency : "AED";
}

function formatAddress(order: {
  street: string;
  apartment?: string | null;
  tower?: string | null;
  city: string;
  emirate: string;
  country: string;
}) {
  return [order.street, order.tower, order.apartment, order.city, order.emirate, order.country]
    .filter(Boolean)
    .join(", ");
}

function buildOrderHref(locale: string, searchParams: AdminOrdersPageProps["searchParams"], selectedId: string) {
  const params = new URLSearchParams();

  for (const key of ["search", "status", "from", "to"]) {
    const value = readParam(searchParams, key);

    if (value) {
      params.set(key, value);
    }
  }

  params.set("selected", selectedId);
  return `/${locale}/admin/orders?${params.toString()}`;
}

function buildOrderWhere(searchParams: AdminOrdersPageProps["searchParams"]) {
  const search = readParam(searchParams, "search")?.trim();
  const status = readParam(searchParams, "status");
  const from = readParam(searchParams, "from");
  const to = readParam(searchParams, "to");
  const createdAt: Prisma.DateTimeFilter = {};

  if (from) {
    createdAt.gte = new Date(`${from}T00:00:00.000Z`);
  }

  if (to) {
    createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  return {
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
            { customerPhone: { contains: search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(status ? { orderStatus: status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {})
  } satisfies Prisma.OrderWhereInput;
}

export default async function AdminOrdersPage({ params, searchParams }: AdminOrdersPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const search = readParam(searchParams, "search") ?? "";
  const status = readParam(searchParams, "status") ?? "";
  const from = readParam(searchParams, "from") ?? "";
  const to = readParam(searchParams, "to") ?? "";
  const selectedId = readParam(searchParams, "selected");
  const where = buildOrderWhere(searchParams);
  const [orders, settings] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.setting.findUnique({
      where: { id: "store-settings" },
      select: { aedToBdt: true, aedToUsd: true }
    })
  ]);
  const selectedOrder = orders.find((order) => order.id === selectedId) ?? orders[0];
  const currencyRates = normalizeCurrencyRates({
    AED: 1,
    BDT: settings?.aedToBdt,
    USD: settings?.aedToUsd
  });
  const selectedTotals = selectedOrder
    ? [
        { label: dictionary.common.subtotal, value: Number(selectedOrder.subtotal), tone: "normal" },
        { label: dictionary.common.shipping, value: Number(selectedOrder.shippingCost), tone: "normal" },
        { label: dictionary.common.discount, value: -Number(selectedOrder.discount), tone: "normal" },
        { label: dictionary.common.total, value: Number(selectedOrder.total), tone: "strong" }
      ]
    : [];

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.orders}
        title={dictionary.admin.orders}
        subtitle="Search, filter, review order details, update status, and print invoices."
      />

      <form
        action={`/${locale}/admin/orders`}
        className="mb-5 grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_180px_160px_160px_auto]"
      >
        <label className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search order or customer"
            className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm rtl:pl-3 rtl:pr-10"
          />
        </label>
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
        >
          <option value="">All statuses</option>
          {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          name="from"
          type="date"
          defaultValue={from}
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
          aria-label="From date"
        />
        <input
          name="to"
          type="date"
          defaultValue={to}
          className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
          aria-label="To date"
        />
        <Button type="submit" variant="secondary">{dictionary.actions.apply}</Button>
      </form>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
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
                {orders.map((order) => (
                  <tr key={order.id} className={order.id === selectedOrder?.id ? "bg-gold-50/70" : undefined}>
                    <td className="px-5 py-4 font-bold text-navy">
                      <Link
                        href={buildOrderHref(locale, searchParams, order.id)}
                        className="hover:text-gold-700"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      <p className="font-semibold text-navy">{order.customerName}</p>
                      <p className="mt-1 text-xs text-neutral-500">{order.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={order.paymentStatus === "PAID" ? "green" : "gold"}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <AdminOrderStatusSelect orderId={order.id} initialStatus={order.orderStatus} />
                    </td>
                    <td className="px-5 py-4 font-bold text-navy">
                      {formatCurrency(Number(order.total), getCurrency(order.currency), locale, currencyRates)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          {selectedOrder ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-navy">{selectedOrder.orderNumber}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{selectedOrder.customerEmail}</p>
                </div>
                <AdminPrintButton label={dictionary.actions.print} />
              </div>
              <div className="mt-5 grid gap-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                    <span className="text-neutral-600">
                      {item.quantity} x {locale === "ar" ? item.nameAr : item.nameEn}
                      {item.variantNameEn ? ` / ${locale === "ar" ? item.variantNameAr ?? item.variantNameEn : item.variantNameEn}` : ""}
                    </span>
                    <span className="font-bold text-navy">
                      {formatCurrency(
                        Number(item.price) * item.quantity,
                        getCurrency(selectedOrder.currency),
                        locale,
                        currencyRates
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-2 border-t border-neutral-200 pt-5 text-sm">
                {selectedTotals.map((item) => (
                  <div
                    key={item.label}
                    className={item.tone === "strong" ? "flex justify-between text-base" : "flex justify-between"}
                  >
                    <span className={item.tone === "strong" ? "font-bold text-navy" : "text-neutral-500"}>
                      {item.label}
                    </span>
                    <span className={item.tone === "strong" ? "font-bold text-navy" : "font-semibold text-navy"}>
                      {formatCurrency(item.value, getCurrency(selectedOrder.currency), locale, currencyRates)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-2 border-t border-neutral-200 pt-5 text-sm">
                <p className="font-bold text-navy">{selectedOrder.customerName}</p>
                <p className="text-neutral-600">{selectedOrder.customerPhone}</p>
                <p className="text-neutral-600">
                  {formatAddress(selectedOrder)}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-neutral-500">No orders yet.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
