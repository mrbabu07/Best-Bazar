import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTrackingForm } from "@/components/order/OrderTrackingForm";
import { BackButton } from "@/components/ui/BackButton";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Track Order | AyVella",
  description: "Track an AyVella order using the order number and checkout contact detail."
};

export default function TrackOrderPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton label="Back" fallbackHref={`/${params.locale}`} className="mb-5" />
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">Dubai order tracking</p>
        <h1 className="mt-2 text-3xl font-bold text-navy">Track your order</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">
          Check your order status without signing in. This works for guest checkout and account orders.
        </p>
      </div>
      <OrderTrackingForm locale={params.locale} />
    </main>
  );
}
