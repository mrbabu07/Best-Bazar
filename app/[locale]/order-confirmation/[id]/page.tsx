import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatCurrency, normalizeCurrencyRates } from "@/utils/currency";

type OrderConfirmationPageProps = {
  params: {
    locale: string;
    id: string;
  };
};

export function generateMetadata({ params }: OrderConfirmationPageProps): Metadata {
  return {
    title: params.locale === "ar" ? "تم تأكيد الطلب" : "Order confirmation",
    description: "Best Bazar order confirmation."
  };
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true }
    }),
    prisma.setting.findUnique({
      where: { id: "store-settings" },
      select: { aedToBdt: true, aedToUsd: true }
    })
  ]);

  if (!order) {
    notFound();
  }

  const currency = order.currency === "BDT" || order.currency === "USD" ? order.currency : "AED";
  const currencyRates = normalizeCurrencyRates({
    AED: 1,
    BDT: settings?.aedToBdt,
    USD: settings?.aedToUsd
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={26} />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-navy">
              {locale === "ar" ? "تم استلام طلبك" : "Your order is confirmed"}
            </h1>
            <p className="mt-2 text-neutral-600">
              {locale === "ar"
                ? "سنرسل لك تحديثات الطلب عند معالجة الشحنة."
                : "We will send order updates as your shipment is processed."}
            </p>
          </div>
          <div className="rounded-lg bg-paper p-4 text-sm">
            <p className="font-bold text-navy">{order.orderNumber}</p>
            <p className="mt-1 text-neutral-500">{order.customerEmail}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Payment</p>
            <Badge tone={order.paymentStatus === "PAID" ? "green" : "gold"} className="mt-2">
              {order.paymentStatus}
            </Badge>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Order</p>
            <Badge tone={order.orderStatus === "DELIVERED" ? "green" : "blue"} className="mt-2">
              {order.orderStatus}
            </Badge>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Total</p>
            <p className="mt-2 font-bold text-navy">{formatCurrency(Number(order.total), currency, locale, currencyRates)}</p>
          </div>
        </div>

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
                </span>
                <span className="font-bold text-navy">
                  {formatCurrency(Number(item.price) * item.quantity, currency, locale, currencyRates)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/shop`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-semibold text-navy shadow-soft transition hover:from-gold-400 hover:to-gold-200"
          >
            {dictionary.actions.continueShopping}
          </Link>
          <Link
            href={`/${locale}/account`}
            className="inline-flex h-11 items-center justify-center rounded-md border border-gold-200 bg-white px-5 text-sm font-bold text-navy hover:bg-gold-50"
          >
            {dictionary.nav.account}
          </Link>
        </div>
      </div>
    </main>
  );
}
