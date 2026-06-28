import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/Badge";
import { OrderTracker } from "@/components/order/OrderTracker";
import { OrderStatusRefresh } from "@/components/order/OrderStatusRefresh";
import { getOptionalServerSession } from "@/lib/auth-session";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { formatOrderStatus, formatPaymentStatus } from "@/lib/order-labels";
import { prisma } from "@/lib/prisma";
import { formatCurrency, normalizeCurrencyRates } from "@/utils/currency";

type OrderConfirmationPageProps = {
  params: {
    locale: string;
    id: string;
  };
  searchParams?: {
    token?: string;
  };
};

const confirmationCopy = {
  en: {
    title: "Your order is confirmed",
    subtitle: "We will send order updates as your shipment is processed.",
    payment: "Payment",
    order: "Order",
    total: "Total"
  },
  ar: {
    title: "تم استلام طلبك",
    subtitle: "سنرسل لك تحديثات الطلب عند معالجة الشحنة.",
    payment: "الدفع",
    order: "الطلب",
    total: "الإجمالي"
  }
} satisfies Record<
  Locale,
  {
    title: string;
    subtitle: string;
    payment: string;
    order: string;
    total: string;
  }
>;

export function generateMetadata({ params }: OrderConfirmationPageProps): Metadata {
  return {
    title: params.locale === "ar" ? "تم تأكيد الطلب" : "Order confirmation",
    description: "Best Mart order confirmation."
  };
}

export default async function OrderConfirmationPage({ params, searchParams }: OrderConfirmationPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const labels = confirmationCopy[locale];
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true }
    }),
    prisma.setting.findUnique({
      where: { id: "store-settings" },
      select: { aedToBdt: true, aedToUsd: true, trn: true }
    })
  ]);

  if (!order) {
    notFound();
  }

  const hasValidToken = Boolean(order.accessToken && searchParams?.token === order.accessToken);
  const session = hasValidToken ? null : await getOptionalServerSession();
  const isOrderOwner = Boolean(order.userId && session?.user.id === order.userId);
  const isAdmin = session?.user.role === "admin";

  if (!hasValidToken && !isOrderOwner && !isAdmin) {
    notFound();
  }

  const currency = order.currency === "BDT" || order.currency === "USD" ? order.currency : "AED";
  const currencyRates = normalizeCurrencyRates({
    AED: 1,
    BDT: settings?.aedToBdt,
    USD: settings?.aedToUsd
  });
  const totals = [
    { label: dictionary.common.subtotal, value: Number(order.subtotal), tone: "normal" },
    { label: dictionary.common.shipping, value: Number(order.shippingCost), tone: "normal" },
    { label: dictionary.common.discount, value: -Number(order.discount), tone: "normal" },
    ...(Number(order.vatAmount) > 0
      ? [{ label: `VAT included (${Number(order.vatRate).toFixed(2)}%)`, value: Number(order.vatAmount), tone: "normal" }]
      : []),
    { label: dictionary.common.total, value: Number(order.total), tone: "strong" }
  ];
  const addressLines = [
    order.street,
    order.tower,
    order.apartment,
    order.city,
    order.emirate,
    order.country
  ].filter(Boolean);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <OrderStatusRefresh />
      <BackButton label={locale === "ar" ? "رجوع" : "Back"} fallbackHref={`/${locale}/shop`} className="mb-5" />
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={26} />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-navy">
              {labels.title}
            </h1>
            <p className="mt-2 text-neutral-600">
              {labels.subtitle}
            </p>
          </div>
          <div className="rounded-lg bg-paper p-4 text-sm">
            <p className="font-bold text-navy">{order.orderNumber}</p>
            <p className="mt-1 text-neutral-500">{order.customerEmail}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">{labels.payment}</p>
            <Badge tone={order.paymentStatus === "PAID" ? "green" : "gold"} className="mt-2">
              {formatPaymentStatus(order.paymentStatus, locale)}
            </Badge>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">{labels.order}</p>
            <Badge tone={order.orderStatus === "DELIVERED" ? "green" : "blue"} className="mt-2">
              {formatOrderStatus(order.orderStatus, locale)}
            </Badge>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">{labels.total}</p>
            <p className="mt-2 font-bold text-navy">{formatCurrency(Number(order.total), currency, locale, currencyRates)}</p>
          </div>
        </div>

        {/* Real-time Order Tracking */}
        <div className="mt-6">
          <OrderTracker orderId={order.id} currentStatus={order.orderStatus} />
        </div>

        <section className="mt-8 rounded-md border border-neutral-200 p-4">
          <h2 className="text-lg font-bold text-navy">
            Delivery address
          </h2>
          <p className="mt-2 text-sm font-semibold text-neutral-700">{order.customerName}</p>
          <p className="mt-1 text-sm text-neutral-600">{order.customerPhone}</p>
          <p className="mt-1 text-sm text-neutral-600">{addressLines.join(", ")}</p>
          {order.deliverySlot ? (
            <p className="mt-2 text-sm font-bold text-gold-700">Delivery estimate: {order.deliverySlot}</p>
          ) : null}
          {settings?.trn ? (
            <p className="mt-2 text-sm font-semibold text-neutral-600">Seller TRN: {settings.trn}</p>
          ) : null}
        </section>

        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
            <PackageCheck size={20} className="text-gold-700" />
            {dictionary.cart.summary}
          </h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 rounded-md bg-paper p-3 text-sm">
                <span className="font-semibold text-neutral-700">
                  {item.quantity} x {locale === "ar" ? item.nameAr : item.nameEn}
                  {item.variantNameEn ? ` / ${locale === "ar" ? item.variantNameAr ?? item.variantNameEn : item.variantNameEn}` : ""}
                </span>
                <span className="font-bold text-navy">
                  {formatCurrency(Number(item.price) * item.quantity, currency, locale, currencyRates)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2 border-t border-neutral-200 pt-5 text-sm">
            {totals.map((item) => (
              <div
                key={item.label}
                className={item.tone === "strong" ? "flex justify-between text-base" : "flex justify-between"}
              >
                <span className={item.tone === "strong" ? "font-bold text-navy" : "text-neutral-500"}>
                  {item.label}
                </span>
                <span className={item.tone === "strong" ? "font-bold text-navy" : "font-semibold text-navy"}>
                  {formatCurrency(item.value, currency, locale, currencyRates)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/shop`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            {dictionary.actions.continueShopping}
          </Link>
          <Link
            href={`/${locale}/account`}
            className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-900 bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
          >
            {dictionary.nav.account}
          </Link>
        </div>
      </div>
    </main>
  );
}
