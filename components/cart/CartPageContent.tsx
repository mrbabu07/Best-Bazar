"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { formatCurrency } from "@/utils/currency";
import { getShippingCost } from "@/utils/shipping";
import { Button } from "@/components/ui/Button";

type CartPageContentProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function CartPageContent({ locale, dictionary }: CartPageContentProps) {
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const subtotal = useCartStore((state) => state.subtotal());
  const currency = usePreferencesStore((state) => state.currency);
  const currencyRates = usePreferencesStore((state) => state.currencyRates);
  const shippingSettings = usePreferencesStore((state) => state.shippingSettings);
  const shipping = getShippingCost(shippingSettings, "Dubai", subtotal);
  const total = Math.max(subtotal + shipping - discount, 0);

  useEffect(() => {
    setAppliedCoupon("");
    setDiscount(0);
  }, [subtotal]);

  const applyCoupon = async () => {
    const code = coupon.trim();

    if (!code) {
      toast.error(locale === "ar" ? "أدخل رمز القسيمة." : "Enter a coupon code.");
      return;
    }

    setApplyingCoupon(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal })
      });
      const result = await response.json();

      if (!response.ok || !result.valid) {
        throw new Error(result.message ?? result.error ?? "Coupon is not valid.");
      }

      setAppliedCoupon(result.code ?? code.toUpperCase());
      setDiscount(Number(result.discount ?? 0));
      toast.success(locale === "ar" ? "تم تطبيق القسيمة" : "Coupon applied");
    } catch (error) {
      setAppliedCoupon("");
      setDiscount(0);
      toast.error(error instanceof Error ? error.message : "Coupon is not valid.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-10 shadow-soft">
          <h1 className="text-3xl font-bold text-navy">{dictionary.cart.emptyTitle}</h1>
          <p className="mt-3 text-neutral-600">{dictionary.cart.emptySubtitle}</p>
          <Link
            href={`/${locale}/shop`}
            className="mt-6 inline-flex h-11 items-center rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-bold text-navy shadow-soft hover:from-gold-400 hover:to-gold-200"
          >
            {dictionary.actions.continueShopping}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
          {dictionary.nav.cart}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy">{dictionary.cart.title}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="grid gap-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft sm:grid-cols-[120px_1fr_auto]"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
                <Image src={item.image} alt={getLocalized(item.name, locale)} fill sizes="120px" className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">
                  {item.brand}
                </p>
                <Link
                  href={`/${locale}/product/${item.slug}`}
                  className="mt-1 block text-lg font-bold text-navy hover:text-gold-700"
                >
                  {getLocalized(item.name, locale)}
                </Link>
                <p className="mt-2 font-semibold text-navy">
                  {formatCurrency(item.price, currency, locale, currencyRates)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <div className="inline-flex h-10 items-center overflow-hidden rounded-md border border-neutral-200 bg-white">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="grid h-full w-10 place-items-center hover:bg-gold-50"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="grid h-full min-w-10 place-items-center border-x border-neutral-200 px-3 text-sm font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="grid h-full w-10 place-items-center hover:bg-gold-50"
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-sale hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft lg:sticky lg:top-28">
          <h2 className="text-xl font-bold text-navy">{dictionary.cart.summary}</h2>
          <div className="mt-5 flex gap-2">
            <input
              value={coupon}
              onChange={(event) => setCoupon(event.target.value)}
              placeholder={dictionary.cart.coupon}
              className="h-11 min-w-0 flex-1 rounded-md border border-neutral-200 bg-paper px-3 text-sm"
            />
            <Button onClick={applyCoupon} variant="secondary" disabled={applyingCoupon}>
              {applyingCoupon ? (locale === "ar" ? "جار..." : "Checking...") : dictionary.actions.apply}
            </Button>
          </div>
          {appliedCoupon ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              {locale === "ar" ? `تم تطبيق ${appliedCoupon}` : `${appliedCoupon} applied`}
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">{dictionary.common.subtotal}</span>
              <span className="font-semibold text-navy">{formatCurrency(subtotal, currency, locale, currencyRates)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{dictionary.common.shipping}</span>
              <span className="font-semibold text-navy">{formatCurrency(shipping, currency, locale, currencyRates)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">{dictionary.common.discount}</span>
              <span className="font-semibold text-navy">-{formatCurrency(discount, currency, locale, currencyRates)}</span>
            </div>
            <div className="border-t border-neutral-200 pt-4 text-base">
              <div className="flex justify-between">
                <span className="font-bold text-navy">{dictionary.common.total}</span>
                <span className="font-bold text-navy">{formatCurrency(total, currency, locale, currencyRates)}</span>
              </div>
            </div>
          </div>
          <Link
            href={`/${locale}/checkout`}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-bold text-navy shadow-soft hover:from-gold-400 hover:to-gold-200"
          >
            {dictionary.actions.checkout}
          </Link>
        </aside>
      </div>
    </main>
  );
}
