"use client";

import { CalendarClock, CreditCard, HandCoins, Landmark, ShieldCheck, Wallet, WalletCards } from "lucide-react";
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
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";

type CheckoutPageContentProps = {
  locale: Locale;
  dictionary: Dictionary;
  paymentAvailability: {
    stripe: boolean;
    tabby: boolean;
    tamara: boolean;
    paypal: boolean;
    cod: boolean;
    bankTransfer: boolean;
    bankTransferInstructions: string;
  };
};

type CheckoutFieldName = "name" | "email" | "phone" | "street" | "apartment" | "tower" | "city" | "country";

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
    stripeUrlMissing: "Payment checkout URL was not returned.",
    notes: "Notes",
    shippingArea: "Shipping area",
    delivery: "Delivery",
    applied: (code: string) => `${code} applied`,
    fields: {
      name: "Full name",
      email: "Email",
      phone: "Phone",
      street: "Street address",
      city: "City",
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
    shippingArea: "منطقة الشحن",
    delivery: "التوصيل",
    applied: (code: string) => `تم تطبيق ${code}`,
    fields: {
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      street: "عنوان الشارع",
      city: "المدينة",
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
    shippingArea: string;
    delivery: string;
    applied: (code: string) => string;
    fields: Record<Exclude<CheckoutFieldName, "apartment" | "tower">, string>;
  }
>;

type PaymentOptionKey = "stripe" | "cod" | "tabby" | "tamara" | "paypal" | "bank_transfer";

export function CheckoutPageContent({ locale, dictionary, paymentAvailability }: CheckoutPageContentProps) {
  const labels = checkoutCopy[locale];
  const router = useRouter();
  const hydrated = useHydrated();
  const initialPayment: PaymentOptionKey =
    paymentAvailability.stripe ? "stripe" : paymentAvailability.cod ? "cod" : "bank_transfer";
  const [payment, setPayment] = useState<PaymentOptionKey>(initialPayment);
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
  const shippingOptions = shippingSettings.shippingRates;
  const selectedShippingRate =
    shippingOptions.find((rate) => rate.emirate.trim().toLowerCase() === emirate.trim().toLowerCase()) ??
    shippingOptions[0];
  const selectedEmirate = selectedShippingRate?.emirate ?? emirate;
  const shipping = getShippingCost(shippingSettings, selectedEmirate, subtotal);
  const total = Math.max(subtotal + shipping - discount, 0);
  const shippingSummary = selectedShippingRate?.deliveryDays
    ? `${labels.delivery}: ${selectedShippingRate.deliveryDays}`
    : labels.delivery;
  const deliverySlotOptions =
    selectedEmirate.trim().toLowerCase() === "dubai"
      ? ["Today 6 PM - 10 PM", "Tomorrow 9 AM - 1 PM", "Tomorrow 1 PM - 5 PM", "Tomorrow 5 PM - 9 PM"]
      : ["Standard delivery 10 AM - 6 PM", "Evening delivery 5 PM - 9 PM"];

  const paymentMethod = () => {
    if (payment === "cod") {
      return "COD";
    }

    if (payment === "tabby") {
      return "TABBY";
    }

    if (payment === "tamara") {
      return "TAMARA";
    }

    if (payment === "paypal") {
      return "PAYPAL";
    }

    if (payment === "bank_transfer") {
      return "BANK_TRANSFER";
    }

    return "STRIPE";
  };

  const paymentButtonLabel = () => {
    if (payment === "stripe") {
      return dictionary.checkout.stripe;
    }

    if (payment === "cod") {
      return dictionary.checkout.cod;
    }

    if (payment === "tabby") {
      return "Pay with Tabby";
    }

    if (payment === "tamara") {
      return "Pay with Tamara";
    }

    if (payment === "paypal") {
      return "Pay with PayPal";
    }

    return "Place bank transfer order";
  };

  const paymentOptions = [
    {
      key: "stripe" as const,
      label: "Card payment",
      detail: "Visa, Mastercard, Apple Pay, and Google Pay through Stripe.",
      icon: CreditCard,
      enabled: paymentAvailability.stripe
    },
    {
      key: "cod" as const,
      label: dictionary.checkout.cod,
      detail: "Pay cash when your Dubai delivery arrives.",
      icon: HandCoins,
      enabled: paymentAvailability.cod
    },
    {
      key: "tabby" as const,
      label: "Tabby",
      detail: "Pay in installments through Tabby hosted checkout.",
      icon: WalletCards,
      enabled: paymentAvailability.tabby
    },
    {
      key: "tamara" as const,
      label: "Tamara",
      detail: "Pay later through Tamara hosted checkout.",
      icon: CalendarClock,
      enabled: paymentAvailability.tamara
    },
    {
      key: "paypal" as const,
      label: "PayPal",
      detail: "PayPal wallet hosted approval and capture.",
      icon: Wallet,
      enabled: paymentAvailability.paypal
    },
    {
      key: "bank_transfer" as const,
      label: "Bank transfer",
      detail: paymentAvailability.bankTransferInstructions || "Manual transfer after order confirmation.",
      icon: Landmark,
      enabled: paymentAvailability.bankTransfer
    }
  ];

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
        apartment: String(formData.get("apartment") ?? ""),
        tower: String(formData.get("tower") ?? ""),
        city: String(formData.get("city") ?? ""),
        emirate: String(formData.get("emirate") ?? ""),
        country: String(formData.get("country") ?? "UAE")
      },
      deliverySlot: String(formData.get("deliverySlot") ?? "") || undefined,
      paymentMethod: paymentMethod(),
      currency,
      locale,
      couponCode: appliedCoupon || coupon.trim() || undefined,
      notes: String(formData.get("notes") ?? "") || undefined
    };

    try {
      const usesHostedCheckout = ["stripe", "tabby", "tamara", "paypal"].includes(payment);
      const endpoint = usesHostedCheckout ? "/api/payment/checkout" : "/api/orders";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? labels.checkoutFailed);
      }

      if (usesHostedCheckout) {
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
    {
      name: "tower",
      label: "Building / tower",
      type: "text",
      autoComplete: "address-line2"
    },
    {
      name: "apartment",
      label: "Apartment / villa no.",
      type: "text",
      autoComplete: "address-line3"
    },
    { name: "city", label: labels.fields.city, type: "text", autoComplete: "address-level2", defaultValue: "Dubai" },
    { name: "country", label: labels.fields.country, type: "text", autoComplete: "country-name", defaultValue: "UAE" }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <BackButton label={locale === "ar" ? "رجوع" : "Back"} fallbackHref={`/${locale}/cart`} className="mb-4" />
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
          {dictionary.actions.checkout}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy">{dictionary.checkout.title}</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{dictionary.checkout.subtitle}</p>
      </div>

      <form onSubmit={submitOrder} className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <section className="grid gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-xl font-bold text-navy">{dictionary.checkout.shippingInfo}</h2>
              <div className="rounded-md bg-gold-50 px-3 py-2 text-xs font-semibold text-navy">
                <p>Guest checkout</p>
                <p className="mt-1 text-neutral-500">
                  No account needed. We will email your order link.
                </p>
              </div>
            </div>
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
              <div className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                {labels.shippingArea}
                <select
                  name="emirate"
                  value={selectedEmirate}
                  onChange={(event) => setEmirate(event.target.value)}
                  required
                  className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
                >
                  {shippingOptions.map((rate) => (
                    <option key={rate.emirate} value={rate.emirate}>
                      {rate.emirate}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-gold-50 px-3 py-2 text-xs font-semibold text-navy sm:flex-row sm:items-center sm:justify-between">
                  <span>{shippingSummary}</span>
                  <span>{formatCurrency(shipping, currency, locale, currencyRates)}</span>
                </div>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-navy sm:col-span-2">
                Delivery slot
                <select
                  name="deliverySlot"
                  required
                  className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
                >
                  {deliverySlotOptions.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
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
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {paymentOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <label
                    key={option.key}
                    title={option.detail}
                    className={`flex min-h-[64px] cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-3 hover:border-gold-300 ${
                      option.enabled ? "" : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.key}
                      checked={payment === option.key}
                      onChange={() => setPayment(option.key)}
                      disabled={!option.enabled}
                      className="shrink-0 accent-gold-500"
                    />
                    <Icon size={20} className="shrink-0 text-gold-700" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-navy">{option.label}</span>
                      {!option.enabled ? (
                        <span className="mt-1 block truncate text-xs font-semibold text-neutral-500">
                          Set env vars to enable
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-neutral-500">
              Dubai-ready methods are controlled by environment variables. Online methods redirect to hosted checkout when configured.
            </p>
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
              <span className="text-neutral-500">
                {dictionary.common.shipping} ({selectedEmirate})
              </span>
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
            {loading ? labels.processing : paymentButtonLabel()}
          </Button>
        </aside>
      </form>
    </main>
  );
}
