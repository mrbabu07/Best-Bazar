import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { Download, Search } from "lucide-react";
import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderStatusSelect } from "@/components/admin/AdminOrderStatusSelect";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPrintButton } from "@/components/admin/AdminPrintButton";
import { BulkParcelLabelPrint } from "@/components/admin/BulkParcelLabelPrint";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getDictionary, isLocale } from "@/lib/i18n";
import { fallbackProductImage, safeRemoteImage } from "@/lib/images";
import { formatOrderItemDetails, getOrderItemDetails, type PrintableOrderItem } from "@/lib/order-item-label";
import { prisma } from "@/lib/prisma";
import { formatCurrency, normalizeCurrencyRates, type CurrencyCode } from "@/utils/currency";

export const metadata: Metadata = {
  title: "Order Management | AyVella"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  district?: string | null;
  area?: string | null;
  tower?: string | null;
  apartment?: string | null;
  city: string;
  emirate: string;
  country: string;
}) {
  return [order.apartment, order.tower, order.street, order.area, order.district, order.city, order.emirate, order.country]
    .filter(Boolean)
    .join(", ");
}

function orderProductCodes(items: Array<{ productSku?: string | null; product?: { sku?: string | null } | null; variantSku?: string | null }>) {
  return Array.from(new Set(items.map((item) => item.productSku || item.product?.sku || item.variantSku).filter(Boolean))).join(" / ") || "NOT SET";
}

function orderVariantSummary(items: PrintableOrderItem[], locale: string) {
  return items.map((item) => {
    const details = getOrderItemDetails(item, locale);
    const code = details.code || details.variantCode || "NO CODE";
    return [details.name, details.color || "Default", details.size || "One size", `x${details.quantity}`, code]
      .filter(Boolean)
      .join(" / ");
  }).join(", ");
}

function qrContactPayload(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  street: string;
  district?: string | null;
  area?: string | null;
  tower?: string | null;
  apartment?: string | null;
  city: string;
  emirate: string;
  country: string;
  items: PrintableOrderItem[];
  paymentMethod?: string;
  paymentStatus?: string;
  currency?: string;
  total?: unknown;
}) {
  const clean = (value: string | null | undefined) => String(value ?? "").replace(/[;\n\r]/g, " ").trim();
  const address = [order.apartment, order.tower, order.street, order.area, order.district, order.city, order.emirate, order.country].map(clean).filter(Boolean).join(", ");
  const productCodes = orderProductCodes(order.items);
  const itemSummary = order.items.map((item) => {
    const details = getOrderItemDetails(item, "en");
    return [details.code ? `Code ${details.code}` : "", details.variantCode ? `Variant ${details.variantCode}` : "", details.color, details.size, `x${details.quantity}`].filter(Boolean).join("/");
  }).join(", ");

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${clean(order.customerName)}`,
    `TEL;TYPE=CELL:${clean(order.customerPhone)}`,
    ...(clean(order.customerEmail) ? [`EMAIL:${clean(order.customerEmail)}`] : []),
    `ADR:;;${address};;;;`,
    `NOTE:Order ${clean(order.orderNumber)} | Product code ${clean(productCodes)} | Items ${clean(itemSummary)} | Total ${clean(order.currency)} ${String(order.total ?? "")}`,
    "END:VCARD"
  ].join("\n");
}

function parcelQrPayload(
  order: Parameters<typeof qrContactPayload>[0] & { id: string; accessToken?: string | null },
  locale: string,
  siteUrl: string
) {
  const isLocalSite = /https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(siteUrl);

  return order.accessToken && !isLocalSite
    ? `${siteUrl}/${locale}/parcel/${order.id}?token=${encodeURIComponent(order.accessToken)}`
    : qrContactPayload(order);
}

function formatDubaiDate(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai"
  }).format(value);
}

function formatCompactDate(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai"
  }).format(value);
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

function buildSalesExportHref(searchParams: AdminOrdersPageProps["searchParams"]) {
  const params = new URLSearchParams();

  for (const key of ["search", "status", "from", "to"]) {
    const value = readParam(searchParams, key);

    if (value) {
      params.set(key, value);
    }
  }

  return `/api/admin/reports/sales${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildStatusHref(locale: string, searchParams: AdminOrdersPageProps["searchParams"], nextStatus?: string) {
  const params = new URLSearchParams();

  for (const key of ["search", "from", "to"]) {
    const value = readParam(searchParams, key);

    if (value) {
      params.set(key, value);
    }
  }

  if (nextStatus) {
    params.set("status", nextStatus);
  }

  return `/${locale}/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
}

function buildOrderWhere(searchParams: AdminOrdersPageProps["searchParams"], options: { includeStatus?: boolean } = {}) {
  const search = readParam(searchParams, "search")?.trim();
  const status = readParam(searchParams, "status");
  const from = readParam(searchParams, "from");
  const to = readParam(searchParams, "to");
  const includeStatus = options.includeStatus ?? true;
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
    ...(includeStatus && status ? { orderStatus: status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {})
  } satisfies Prisma.OrderWhereInput;
}

function orderStatusTone(status: string): "gold" | "green" | "red" | "blue" | "neutral" {
  if (status === "DELIVERED") return "green";
  if (status === "CONFIRMED") return "green";
  if (status === "SHIPPED" || status === "PROCESSING") return "blue";
  if (status === "CANCELLED") return "red";
  if (status === "PENDING") return "gold";
  return "neutral";
}

function isNewOrder(createdAt: Date, status: string) {
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs <= 24 * 60 * 60 * 1000 && ["PENDING", "CONFIRMED"].includes(status);
}

export default async function AdminOrdersPage({ params, searchParams }: AdminOrdersPageProps) {
  noStore();
  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const siteUrl = host
    ? `${protocol}://${host}`
    : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3002").replace(/\/$/, "");
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
  const baseWhere = buildOrderWhere(searchParams, { includeStatus: false });
  const newOrderWhere = {
    ...baseWhere,
    createdAt: {
      ...(baseWhere.createdAt && typeof baseWhere.createdAt === "object" ? baseWhere.createdAt : {}),
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    orderStatus: { in: ["PENDING", "CONFIRMED"] }
  } satisfies Prisma.OrderWhereInput;
  const [orders, settings, allFilteredOrdersCount, pendingOrdersCount, confirmedOrdersCount, processingOrdersCount, shippedOrdersCount, deliveredOrdersCount, cancelledOrdersCount, newOrdersCount] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                sku: true,
                brand: true
              }
            },
            variant: {
              select: {
                colorNameEn: true,
                colorNameAr: true,
                sizeNameEn: true,
                sizeNameAr: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.setting.findUnique({
      where: { id: "store-settings" },
      select: { aedToBdt: true, aedToUsd: true, trn: true }
    }),
    prisma.order.count({ where: baseWhere }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: "PENDING" } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: "CONFIRMED" } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: "PROCESSING" } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: "SHIPPED" } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: "DELIVERED" } }),
    prisma.order.count({ where: { ...baseWhere, orderStatus: "CANCELLED" } }),
    prisma.order.count({ where: newOrderWhere })
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
        ...(Number(selectedOrder.vatAmount) > 0
          ? [
              {
                label: `VAT included (${Number(selectedOrder.vatRate).toFixed(2)}%)`,
                value: Number(selectedOrder.vatAmount),
                tone: "normal"
              }
            ]
          : []),
        { label: dictionary.common.total, value: Number(selectedOrder.total), tone: "strong" }
      ]
    : [];
  const statusCards = [
    { label: "All", value: allFilteredOrdersCount, href: buildStatusHref(locale, searchParams), active: !status, tone: "neutral" as const },
    { label: "Pending/New", value: pendingOrdersCount, href: buildStatusHref(locale, searchParams, "PENDING"), active: status === "PENDING", tone: "gold" as const },
    { label: "Confirmed", value: confirmedOrdersCount, href: buildStatusHref(locale, searchParams, "CONFIRMED"), active: status === "CONFIRMED", tone: "green" as const },
    { label: "Processing", value: processingOrdersCount, href: buildStatusHref(locale, searchParams, "PROCESSING"), active: status === "PROCESSING", tone: "blue" as const },
    { label: "Shipped", value: shippedOrdersCount, href: buildStatusHref(locale, searchParams, "SHIPPED"), active: status === "SHIPPED", tone: "blue" as const },
    { label: "Delivered", value: deliveredOrdersCount, href: buildStatusHref(locale, searchParams, "DELIVERED"), active: status === "DELIVERED", tone: "green" as const },
    { label: "Cancelled", value: cancelledOrdersCount, href: buildStatusHref(locale, searchParams, "CANCELLED"), active: status === "CANCELLED", tone: "red" as const }
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.orders}
        title={dictionary.admin.orders}
        subtitle="Search, filter, review order details, update status, and print invoices."
        action={
          <a
            href={buildSalesExportHref(searchParams)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gold-200 bg-white px-5 text-sm font-bold text-navy hover:bg-gold-50"
          >
            <Download size={17} />
            Export CSV
          </a>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {statusCards.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`rounded-lg border p-4 shadow-soft transition hover:border-gold-300 hover:bg-gold-50/50 ${
              item.active ? "border-gold-300 bg-gold-50" : "border-neutral-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-navy">{item.label}</p>
              <Badge tone={item.tone}>{item.value}</Badge>
            </div>
            <p className="mt-2 text-xs font-semibold text-neutral-500">
              {item.label === "Pending/New"
                ? `${newOrdersCount} new in last 24h`
                : item.label === "All"
                  ? "Current filtered orders"
                  : `${item.label} orders`}
            </p>
          </Link>
        ))}
      </section>

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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_560px]">
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3"><p className="text-sm font-bold text-navy">Select orders for parcel labels</p><BulkParcelLabelPrint /></div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
                <tr>
                  <th className="px-3 py-3">Print</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Delivery</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={
                      order.id === selectedOrder?.id
                        ? "bg-gold-50/70"
                        : isNewOrder(order.createdAt, order.orderStatus)
                          ? "bg-sky-50/50"
                          : undefined
                    }
                  >
                    <td className="px-3 py-4"><input type="checkbox" data-parcel-order={encodeURIComponent(JSON.stringify({ orderNumber: order.orderNumber, date: formatDubaiDate(order.createdAt, locale), customerName: order.customerName, phone: order.customerPhone, address: formatAddress(order), productCode: orderProductCodes(order.items), products: order.items.map((item) => formatOrderItemDetails(item, locale, { includeCode: false })).join(", "), variantSummary: orderVariantSummary(order.items, locale), payment: order.paymentMethod, subtotal: formatCurrency(Number(order.subtotal), getCurrency(order.currency), locale, currencyRates), deliveryFee: formatCurrency(Number(order.shippingCost), getCurrency(order.currency), locale, currencyRates), total: formatCurrency(Number(order.total), getCurrency(order.currency), locale, currencyRates), note: order.notes ?? "", qrPayload: parcelQrPayload(order, locale, siteUrl) }))} className="h-4 w-4 accent-black" /></td>
                    <td className="px-5 py-4 font-bold text-navy">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={buildOrderHref(locale, searchParams, order.id)}
                          className="hover:text-gold-700"
                        >
                          {order.orderNumber}
                        </Link>
                        {isNewOrder(order.createdAt, order.orderStatus) ? <Badge tone="blue">New</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        {formatCompactDate(order.createdAt, locale)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">{order.items.length} item(s)</p>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      <p className="font-semibold text-navy">{order.customerName}</p>
                      <p className="mt-1 text-xs text-neutral-500">{order.customerEmail}</p>
                      <p className="mt-1 text-xs text-neutral-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-neutral-500">
                      <p className="text-sm font-bold text-navy">{order.emirate}</p>
                      <p className="mt-1">{order.city}</p>
                      {order.deliveryEstimate ? <p className="mt-1 font-semibold text-gold-700">{order.deliveryEstimate}</p> : null}
                      {order.deliverySlot ? <p className="mt-1 text-neutral-500">{order.deliverySlot}</p> : null}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={order.paymentStatus === "PAID" ? "green" : "gold"}>
                        {order.paymentStatus}
                      </Badge>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">{order.paymentMethod}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</Badge>
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

        <aside className="admin-print-target rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          {selectedOrder ? (
            <>
              <div className="mb-5 hidden border-b border-neutral-200 pb-4 admin-print-block">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Tax invoice</p>
                    <h1 className="mt-1 text-2xl font-bold text-navy">AyVella</h1>
                    {settings?.trn ? (
                      <p className="mt-1 text-sm font-semibold text-neutral-600">TRN: {settings.trn}</p>
                    ) : null}
                  </div>
                  <div className="text-right text-sm font-semibold text-neutral-600">
                    <p>{selectedOrder.orderNumber}</p>
                    <p className="mt-1">{formatDubaiDate(selectedOrder.createdAt, locale)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-navy">{selectedOrder.orderNumber}</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Placed {formatDubaiDate(selectedOrder.createdAt, locale)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isNewOrder(selectedOrder.createdAt, selectedOrder.orderStatus) ? <Badge tone="blue">New order</Badge> : null}
                    <Badge tone={orderStatusTone(selectedOrder.orderStatus)}>Order: {selectedOrder.orderStatus}</Badge>
                    <Badge tone={selectedOrder.paymentStatus === "PAID" ? "green" : "gold"}>
                      Payment: {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AdminPrintButton label="Print parcel label" targetSelector=".admin-parcel-label" pageSize="label" />
                  <AdminPrintButton label={dictionary.actions.print} />
                </div>
              </div>

              <div className="admin-parcel-label hidden">
                <header className="parcel-header">
                  <p className="parcel-brand">AYVELLA</p>
                </header>
                <section className="parcel-recipient">
                  <p className="parcel-recipient-name">{selectedOrder.customerName}</p>
                  <p className="parcel-address">{formatAddress(selectedOrder)}</p>
                  <p className="parcel-phone">{selectedOrder.customerPhone}</p>
                  <p className="parcel-route">AY AE-{selectedOrder.emirate.toUpperCase().replace(/\s+/g, "-")}-{selectedOrder.orderNumber.slice(-6)}</p>
                </section>
                <section className="parcel-date-row"><p className="parcel-date">{formatDubaiDate(selectedOrder.createdAt, locale)}</p><div className="parcel-mark">AY</div></section>
                <section className="parcel-bottom">
                  <div className="parcel-codes">
                    <div className="parcel-product-code"><span>PRODUCT CODE</span><strong>{orderProductCodes(selectedOrder.items)}</strong></div>
                    <div className="parcel-variant"><span>PRODUCT / COLOR / SIZE / QTY / CODE</span><strong>{orderVariantSummary(selectedOrder.items, locale) || "DEFAULT / x1 / NO CODE"}</strong></div>
                    <div><span>PRODUCT</span><strong>{formatCurrency(Number(selectedOrder.subtotal), getCurrency(selectedOrder.currency), locale, currencyRates)}</strong></div>
                    <div><span>DELIVERY</span><strong>{formatCurrency(Number(selectedOrder.shippingCost), getCurrency(selectedOrder.currency), locale, currencyRates)}</strong></div>
                    <div className="parcel-total"><span>TOTAL</span><strong>{formatCurrency(Number(selectedOrder.total), getCurrency(selectedOrder.currency), locale, currencyRates)}</strong></div>
                  </div>
                  <div className="invoice-qr">
                    {/* eslint-disable-next-line @next/next/no-img-element -- copied into the isolated thermal-label document */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&ecc=L&margin=8&data=${encodeURIComponent(parcelQrPayload(selectedOrder, locale, siteUrl))}`} alt={`Customer and order QR code for ${selectedOrder.orderNumber}`} width="192" height="192" />
                    <p>{selectedOrder.orderNumber}</p>
                  </div>
                </section>
                <footer className="parcel-footer">SCAN FOR CUSTOMER &amp; ORDER DETAILS</footer>
              </div>

              <div className="invoice-meta-grid mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="invoice-card rounded-md border border-neutral-200 bg-paper p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Customer</p>
                  <p className="mt-2 font-bold text-navy">{selectedOrder.customerName}</p>
                  <p className="mt-1 text-neutral-600">{selectedOrder.customerPhone}</p>
                  {selectedOrder.customerEmail ? <p className="mt-1 text-neutral-600">{selectedOrder.customerEmail}</p> : null}
                </div>
                <div className="invoice-card rounded-md border border-neutral-200 bg-paper p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Payment</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={selectedOrder.paymentStatus === "PAID" ? "green" : "gold"}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                    <Badge>{selectedOrder.paymentMethod}</Badge>
                  </div>
                  {selectedOrder.paymentProviderReference ? (
                    <p className="mt-2 break-all text-xs font-semibold text-neutral-500">
                      Ref: {selectedOrder.paymentProviderReference}
                    </p>
                  ) : null}
                </div>
                <div className="invoice-card rounded-md border border-neutral-200 bg-paper p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Dubai delivery</p>
                  <p className="mt-2 font-semibold text-navy">{formatAddress(selectedOrder)}</p>
                  <div className="mt-2 grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
                    <p>Emirate: {selectedOrder.emirate}</p>
                    <p>City: {selectedOrder.city}</p>
                    {selectedOrder.district ? <p>District: {selectedOrder.district}</p> : null}
                    {selectedOrder.area ? <p>Community / area: {selectedOrder.area}</p> : null}
                    <p>Street / address: {selectedOrder.street}</p>
                    {selectedOrder.tower ? <p>Apartment/building: {selectedOrder.tower}</p> : null}
                    {selectedOrder.apartment ? <p>Unit/villa no.: {selectedOrder.apartment}</p> : null}
                    {selectedOrder.deliveryEstimate ? <p className="font-bold text-gold-700">Delivery estimate: {selectedOrder.deliveryEstimate}</p> : null}
                    {selectedOrder.deliverySlot ? <p>Preferred time: {selectedOrder.deliverySlot}</p> : null}
                  </div>
                  {selectedOrder.notes ? (
                    <p className="mt-3 rounded-md bg-white p-3 text-xs font-semibold text-neutral-600">
                      Customer note: {selectedOrder.notes}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="invoice-products mt-5 rounded-md border border-neutral-200">
                <div className="border-b border-neutral-200 bg-paper px-4 py-3">
                  <p className="text-sm font-bold text-navy">Ordered products</p>
                  <p className="mt-1 text-xs text-neutral-500 admin-print-hide">Images, variants, SKU, quantity, and line totals.</p>
                </div>
                {selectedOrder.items.map((item) => {
                  const details = getOrderItemDetails(item, locale);

                  return (
                  <div key={item.id} className="invoice-item grid gap-3 border-b border-neutral-100 p-4 last:border-b-0 sm:grid-cols-[72px_1fr_auto]">
                    <div className="invoice-image relative h-[72px] w-[72px] overflow-hidden rounded-md border border-neutral-200 bg-white">
                      <Image
                        src={safeRemoteImage(item.image, fallbackProductImage, { width: 160, height: 160, crop: "fill" })}
                        alt={locale === "ar" ? item.nameAr : item.nameEn}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="invoice-item-body min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-navy">{locale === "ar" ? item.nameAr : item.nameEn}</p>
                        <Badge tone={orderStatusTone(selectedOrder.orderStatus)}>
                          Product: {selectedOrder.orderStatus}
                        </Badge>
                      </div>
                      {item.product?.brand ? (
                        <p className="mt-1 text-xs font-semibold text-neutral-500">Brand: {item.product.brand}</p>
                      ) : null}
                      {item.variantNameEn ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600">
                          {item.variantColorHex ? (
                            <span
                              className="h-4 w-4 rounded-full border border-neutral-200"
                              style={{ backgroundColor: item.variantColorHex }}
                              aria-label="Variant color"
                            />
                          ) : null}
                          <span>{locale === "ar" ? item.variantNameAr ?? item.variantNameEn : item.variantNameEn}</span>
                        </div>
                      ) : null}
                      <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-neutral-200 bg-neutral-200 text-xs sm:grid-cols-5">
                        <div className="bg-white p-2"><span className="block text-[10px] font-bold uppercase text-neutral-400">Product code</span><strong className="mt-0.5 block break-all text-navy">{details.code || "Not set"}</strong></div>
                        <div className="bg-white p-2"><span className="block text-[10px] font-bold uppercase text-neutral-400">Variant code</span><strong className="mt-0.5 block break-all text-navy">{details.variantCode || "—"}</strong></div>
                        <div className="bg-white p-2"><span className="block text-[10px] font-bold uppercase text-neutral-400">Color</span><strong className="mt-0.5 block text-navy">{details.color || "—"}</strong></div>
                        <div className="bg-white p-2"><span className="block text-[10px] font-bold uppercase text-neutral-400">Size</span><strong className="mt-0.5 block text-navy">{details.size || "—"}</strong></div>
                        <div className="bg-white p-2"><span className="block text-[10px] font-bold uppercase text-neutral-400">Quantity</span><strong className="mt-0.5 block text-navy">{details.quantity}</strong></div>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs font-semibold text-neutral-500 sm:grid-cols-2 admin-print-hide">
                        <p>
                          Unit:{" "}
                          {formatCurrency(
                            Number(item.price),
                            getCurrency(selectedOrder.currency),
                            locale,
                            currencyRates
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="invoice-line-total text-left sm:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Line total</p>
                      <p className="mt-1 font-bold text-navy">
                        {formatCurrency(
                          Number(item.price) * item.quantity,
                          getCurrency(selectedOrder.currency),
                          locale,
                          currencyRates
                        )}
                      </p>
                    </div>
                  </div>
                  );
                })}
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
              {selectedOrder.internalNotes ? (
                <div className="mt-5 rounded-md border border-gold-200 bg-gold-50 p-4 text-sm admin-print-hide">
                  <p className="font-bold text-navy">Admin note</p>
                  <p className="mt-1 text-neutral-600">{selectedOrder.internalNotes}</p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm font-semibold text-neutral-500">No orders yet.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
