"use client";

import { CreditCard, HandCoins, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { formatCurrency } from "@/utils/currency";
import { Button } from "@/components/ui/Button";

type CheckoutPageContentProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function CheckoutPageContent({ locale, dictionary }: CheckoutPageContentProps) {
  const [payment, setPayment] = useState<"stripe" | "cod">("stripe");
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const currency = usePreferencesStore((state) => state.currency);
  const shipping = subtotal === 0 || subtotal >= 250 ? 0 : 20;
  const total = subtotal + shipping;

  const submitOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success(payment === "stripe" ? "Stripe checkout ready" : "COD order drafted");
    clearCart();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
          {dictionary.actions.checkout}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy">{dictionary.checkout.title}</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{dictionary.checkout.subtitle}</p>
      </div>

      <form onSubmit={submitOrder} className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <section className="grid gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-navy">{dictionary.checkout.shippingInfo}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {["Full name", "Phone", "Street address", "City", "Emirate", "Country"].map((label) => (
                <label key={label} className="grid gap-2 text-sm font-semibold text-navy">
                  {label}
                  <input
                    required
                    className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                Notes
                <textarea
                  rows={4}
                  className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm font-medium text-neutral-700"
                />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-navy">{dictionary.checkout.payment}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-4 hover:border-gold-300">
                <input
                  type="radio"
                  name="payment"
                  value="stripe"
                  checked={payment === "stripe"}
                  onChange={() => setPayment("stripe")}
                  className="accent-gold-500"
                />
                <CreditCard size={20} className="text-gold-700" />
                <span className="text-sm font-bold text-navy">{dictionary.checkout.stripe}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-4 hover:border-gold-300">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={payment === "cod"}
                  onChange={() => setPayment("cod")}
                  className="accent-gold-500"
                />
                <HandCoins size={20} className="text-gold-700" />
                <span className="text-sm font-bold text-navy">{dictionary.checkout.cod}</span>
              </label>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft lg:sticky lg:top-28">
          <h2 className="text-xl font-bold text-navy">{dictionary.cart.summary}</h2>
          <div className="mt-5 grid gap-4">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500">{dictionary.cart.emptySubtitle}</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-600">
                    {item.quantity} x {getLocalized(item.name, locale)}
                  </span>
                  <span className="font-semibold text-navy">
                    {formatCurrency(item.price * item.quantity, currency, locale)}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 grid gap-3 border-t border-neutral-200 pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">{dictionary.common.subtotal}</span>
              <span className="font-semibold text-navy">{formatCurrency(subtotal, currency, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{dictionary.common.shipping}</span>
              <span className="font-semibold text-navy">{formatCurrency(shipping, currency, locale)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-bold text-navy">{dictionary.common.total}</span>
              <span className="font-bold text-navy">{formatCurrency(total, currency, locale)}</span>
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={items.length === 0}>
            <ShieldCheck size={18} />
            {payment === "stripe" ? dictionary.checkout.stripe : dictionary.checkout.cod}
          </Button>
        </aside>
      </form>
    </main>
  );
}
