"use client";

import { CreditCard, HandCoins, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";
import { defaultShippingSettings, getShippingCost } from "@/utils/shipping";
import { Button } from "@/components/ui/Button";

type CheckoutPageContentProps = {
  locale: Locale;
  dictionary: Dictionary;
  stripeEnabled: boolean;
};

type CheckoutFieldName = "name" | "email" | "phone" | "street" | "city" | "emirate" | "country";

type CheckoutField = {
  name: CheckoutFieldName;
  label: string;
  type: string;
  autoComplete: string;
  defaultValue?: string;
};

const checkoutCopy = {
  en: {
    couponRequired: "Enter a coupon code.",
    couponInvalid: "Coupon is not valid.",
    couponApplied: "Coupon applied",
    checking: "Checking...",
    processing: "Processing...",
    orderPlaced: "Order placed",
    checkoutFailed: "Checkout failed",
    stripeUrlMissing: "Stripe checkout URL was not returned.",
    notes: "Notes",
    applied: (code: string) => `${code} applied`,
    fields: {
      name: "Full name",
      email: "Email",
      phone: "Phone",
      street: "Street address",
      city: "City",
      emirate: "Emirate",
      country: "Country"
    }
  },
  ar: {
    couponRequired: "أدخل رمز القسيمة.",
    couponInvalid: "رمز القسيمة غير صالح.",
    couponApplied: "تم تطبيق القسيمة",
    checking: "جار التحقق...",
    processing: "جار المعالجة...",
    orderPlaced: "تم إنشاء الطلب",
    checkoutFailed: "فشل إتمام الطلب",
    stripeUrlMissing: "لم يتم إنشاء رابط الدفع عبر سترايب.",
    notes: "ملاحظات",
    applied: (code: string) => `تم تطبيق ${code}`,
    fields: {
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      street: "عنوان الشارع",
      city: "المدينة",
      emirate: "الإمارة",
      country: "الدولة"
    }
  }
} satisfies Record<
  Locale,
  {
    couponRequired: string;
    couponInvalid: string;
    couponApplied: string;
    checking: string;
    processing: string;
    orderPlaced: string;
    checkoutFailed: string;
    stripeUrlMissing: string;
    notes: string;
    applied: (code: string) => string;
    fields: Record<CheckoutFieldName, string>;
  }
>;

export function CheckoutPageContent({ locale, dictionary, stripeEnabled }: CheckoutPageContentProps) {
  const labels = checkoutCopy[locale];
  const router = useRouter();
  const hydrated = useHydrated();
  const [payment, setPayment] = useState<"stripe" | "cod">(stripeEnabled ? "stripe" : "cod");
  const [emirate, setEmirate] = useState("Dubai");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const storedItems = useCartStore((state) => state.items);
  const storedSubtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedCurrencyRates = usePreferencesStore((state) => state.currencyRates);
  const storedShippingSettings = usePreferencesStore((state) => state.shippingSettings);
  const items = hydrated ? storedItems : [];
  const subtotal = hydrated ? storedSubtotal : 0;
  const currency = hydrated ? storedCurrency : "AED";
  const currencyRates = hydrated ? storedCurrencyRates : defaultCurrencyRates;
  const shippingSettings = hydrated ? storedShippingSettings : defaultShippingSettings;
  const shipping = getShippingCost(shippingSettings, emirate, subtotal);
  const total = Math.max(subtotal + shipping - discount, 0);

  useEffect(() => {
    setAppliedCoupon("");
    setDiscount(0);
  }, [subtotal]);

  const updateCoupon = (value: string) => {
    setCoupon(value);

    if (appliedCoupon && value.trim().toUpperCase() !== appliedCoupon) {
      setAppliedCoupon("");
      setDiscount(0);
    }
  };

  const applyCoupon = async () => {
    const code = coupon.trim();

    if (!code) {
      toast.error(labels.couponRequired);
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
        throw new Error(labels.couponInvalid);
      }

      setAppliedCoupon(result.code ?? code.toUpperCase());
      setDiscount(Number(result.discount ?? 0));
      toast.success(labels.couponApplied);
    } catch (error) {
      setAppliedCoupon("");
      setDiscount(0);
      toast.error(error instanceof Error ? error.message : labels.couponInvalid);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      items: items.map((item) => ({
        productId: item.productId ?? item.id,
        variantId: item.variantId,
        quantity: item.quantity
      })),
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
      locale,
      couponCode: appliedCoupon || coupon.trim() || undefined,
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
        throw new Error(result.error ?? labels.checkoutFailed);
      }

      if (payment === "stripe") {
        if (!result.checkoutUrl) {
          throw new Error(labels.stripeUrlMissing);
        }

        window.location.href = result.checkoutUrl;
        return;
      }

      clearCart();
      toast.success(labels.orderPlaced);
      const tokenQuery = result.accessToken ? `?token=${encodeURIComponent(result.accessToken)}` : "";
      router.push(`/${locale}/order-confirmation/${result.id}${tokenQuery}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.checkoutFailed);
    } finally {
      setLoading(false);
    }
  };

  const fields: CheckoutField[] = [
    { name: "name", label: labels.fields.name, type: "text", autoComplete: "name" },
    { name: "email", label: labels.fields.email, type: "email", autoComplete: "email" },
    { name: "phone", label: labels.fields.phone, type: "tel", autoComplete: "tel" },
    { name: "street", label: labels.fields.street, type: "text", autoComplete: "street-address" },
    { name: "city", label: labels.fields.city, type: "text", autoComplete: "address-level2", defaultValue: "Dubai" },
    { name: "emirate", label: labels.fields.emirate, type: "text", autoComplete: "address-level1", defaultValue: "Dubai" },
    { name: "country", label: labels.fields.country, type: "text", autoComplete: "country-name", defaultValue: "UAE" }
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
                    onChange={field.name === "emirate" ? (event) => setEmirate(event.target.value) : undefined}
                    required
                    className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
                  />
                </label>
              ))}
              <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                {labels.notes}
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
              {stripeEnabled ? (
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
              ) : null}
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
                    {item.variantName ? ` / ${getLocalized(item.variantName, locale)}` : ""}
                  </span>
                  <span className="font-semibold text-navy">
                    {formatCurrency(item.price * item.quantity, currency, locale, currencyRates)}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 grid gap-3 border-t border-neutral-200 pt-5 text-sm">
            <label className="grid gap-2 text-sm font-semibold text-navy">
              {dictionary.cart.coupon}
              <div className="flex gap-2">
                <input
                  name="couponCode"
                  value={coupon}
                  onChange={(event) => updateCoupon(event.target.value)}
                  placeholder="DUBAI50"
                  className="h-11 min-w-0 flex-1 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
                />
                <Button type="button" variant="secondary" onClick={applyCoupon} disabled={applyingCoupon || subtotal <= 0}>
                  {applyingCoupon ? labels.checking : dictionary.actions.apply}
                </Button>
              </div>
            </label>
            {appliedCoupon ? (
              <p className="text-xs font-semibold text-emerald-700">
                {labels.applied(appliedCoupon)}
              </p>
            ) : null}
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
            <div className="flex justify-between text-base">
              <span className="font-bold text-navy">{dictionary.common.total}</span>
              <span className="font-bold text-navy">{formatCurrency(total, currency, locale, currencyRates)}</span>
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={items.length === 0 || loading}>
            <ShieldCheck size={18} />
            {loading ? labels.processing : payment === "stripe" ? dictionary.checkout.stripe : dictionary.checkout.cod}
          </Button>
        </aside>
      </form>
    </main>
  );
}
