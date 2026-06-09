"use client";

import { CreditCard, HandCoins, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [payment, setPayment] = useState<"stripe" | "cod">("stripe");
  const [loading, setLoading] = useState(false);
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const currency = usePreferencesStore((state) => state.currency);
  const shipping = subtotal === 0 || subtotal >= 250 ? 0 : 20;
  const total = subtotal + shipping;

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      shippingAddress: {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        street: String(formData.get("street") ?? ""),
        city: String(formData.get("city") ?? ""),
        emirate: String(formData.get("emirate") ?? ""),
        country: String(formData.get("country") ?? "UAE")
      },
      paymentMethod: payment === "cod" ? "COD" : "STRIPE",
      currency,
      couponCode: String(formData.get("couponCode") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined
    };

    try {
      const endpoint = payment === "stripe" ? "/api/payment/checkout" : "/api/orders";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Checkout failed");
      }

      if (payment === "stripe") {
        if (!result.checkoutUrl) {
          throw new Error("Stripe checkout URL was not returned.");
        }

        window.location.href = result.checkoutUrl;
        return;
      }

      clearCart();
      toast.success("Order placed");
      router.push(`/${locale}/order-confirmation/${result.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name", label: "Full name", type: "text", autoComplete: "name" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
    { name: "street", label: "Street address", type: "text", autoComplete: "street-address" },
    { name: "city", label: "City", type: "text", autoComplete: "address-level2", defaultValue: "Dubai" },
    { name: "emirate", label: "Emirate", type: "text", autoComplete: "address-level1", defaultValue: "Dubai" },
    { name: "country", label: "Country", type: "text", autoComplete: "country-name", defaultValue: "UAE" }
  ];

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
              {fields.map((field) => (
                <label key={field.name} className="grid gap-2 text-sm font-semibold text-navy">
                  {field.label}
                  <input
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    defaultValue={field.defaultValue}
                    required
                    className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                Notes
                <textarea
                  name="notes"
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
            <label className="grid gap-2 text-sm font-semibold text-navy">
              {dictionary.cart.coupon}
              <input
                name="couponCode"
                placeholder="DUBAI50"
                className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
              />
            </label>
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
          <Button type="submit" className="mt-6 w-full" disabled={items.length === 0 || loading}>
            <ShieldCheck size={18} />
            {loading ? "Processing..." : payment === "stripe" ? dictionary.checkout.stripe : dictionary.checkout.cod}
          </Button>
        </aside>
      </form>
    </main>
  );
}
