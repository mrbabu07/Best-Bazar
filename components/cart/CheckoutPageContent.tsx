"use client";

import { CreditCard, HandCoins, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import type { PublicPaymentAvailability } from "@/lib/payment-config";
import { safeResponseJson } from "@/lib/safe-json";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";
import { defaultShippingSettings, getShippingFee } from "@/utils/shipping";
import { cn } from "@/utils/cn";
import { fallbackProductImage, safeRemoteImage } from "@/lib/images";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";

const StripePaymentSection = dynamic(
  () => import("@/components/cart/StripePaymentSection").then((module) => module.StripePaymentSection),
  {
    ssr: false,
    loading: () => (
      <div className="mt-5 rounded-lg border border-gold-200 bg-gold-50 p-4 text-sm font-bold text-navy">
        Loading secure card form...
      </div>
    )
  }
);

type CheckoutPageContentProps = {
  locale: Locale;
  dictionary: Dictionary;
  paymentAvailability: PublicPaymentAvailability;
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

type PaymentOptionKey = "stripe" | "cod";

type StripePaymentState = {
  clientSecret: string;
  orderNumber: string;
  orderConfirmUrl: string;
};

export function CheckoutPageContent({ locale, dictionary, paymentAvailability }: CheckoutPageContentProps) {
  const labels = checkoutCopy[locale];
  const router = useRouter();
  const hydrated = useHydrated();
  const initialPayment: PaymentOptionKey =
    paymentAvailability.stripe
      ? "stripe"
      : paymentAvailability.cod
        ? "cod"
        : "cod";
  const [payment, setPayment] = useState<PaymentOptionKey>(initialPayment);
  const [emirate, setEmirate] = useState("Dubai");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stripePayment, setStripePayment] = useState<StripePaymentState | null>(null);
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
  const shippingQuote = getShippingFee(
    selectedEmirate,
    subtotal,
    shippingSettings.shippingRates,
    shippingSettings.freeShippingThreshold
  );
  const shipping = shippingQuote.fee;
  const total = Math.max(subtotal + shipping - discount, 0);
  const shippingSummary = shippingQuote.isFree
    ? `Shipping to ${shippingQuote.rate.emirate}: FREE shipping!`
    : `Shipping to ${shippingQuote.rate.emirate}: AED ${shipping.toFixed(0)} (${shippingQuote.estimatedDays} days)`;
  const deliverySlotOptions =
    selectedEmirate.trim().toLowerCase() === "dubai"
      ? ["Today 6 PM - 10 PM", "Tomorrow 9 AM - 1 PM", "Tomorrow 1 PM - 5 PM", "Tomorrow 5 PM - 9 PM"]
      : ["Standard delivery 10 AM - 6 PM", "Evening delivery 5 PM - 9 PM"];

  const paymentMethod = () => {
    if (payment === "cod") {
      return "COD";
    }

    return "STRIPE";
  };

  const paymentButtonLabel = () => {
    if (payment === "stripe") {
      return paymentAvailability.stripeLabel;
    }

    if (payment === "cod") {
      return paymentAvailability.codLabel;
    }

    return paymentAvailability.stripeLabel;
  };

  const paymentOptions = useMemo(
    () => [
      {
        key: "stripe" as const,
        label: paymentAvailability.stripeLabel,
        detail: paymentAvailability.stripeDetail,
        icon: CreditCard,
        enabled: paymentAvailability.stripe
      },
      {
        key: "cod" as const,
        label: paymentAvailability.codLabel || dictionary.checkout.cod,
        detail: shippingQuote.codAvailable
          ? paymentAvailability.codDetail
          : `COD is unavailable for ${shippingQuote.rate.emirate}.`,
        icon: HandCoins,
        enabled: paymentAvailability.cod && shippingQuote.codAvailable
      },
    ],
    [dictionary.checkout.cod, paymentAvailability, shippingQuote.codAvailable, shippingQuote.rate.emirate]
  );
  const visiblePaymentOptions = useMemo(
    () => paymentOptions.filter((option) => option.enabled),
    [paymentOptions]
  );
  const selectedPaymentOption = visiblePaymentOptions.find((option) => option.key === payment);

  useEffect(() => {
    setAppliedCoupon("");
    setDiscount(0);
  }, [subtotal]);

  useEffect(() => {
    setStripePayment(null);
  }, [appliedCoupon, discount, emirate, payment, subtotal]);

  useEffect(() => {
    if (payment === "cod" && !shippingQuote.codAvailable) {
      const nextPayment: PaymentOptionKey = paymentAvailability.stripe
        ? "stripe"
        : "cod";

      setPayment(nextPayment);
    }
  }, [
    payment,
    paymentAvailability.stripe,
    shippingQuote.codAvailable
  ]);

  useEffect(() => {
    if (selectedPaymentOption?.enabled) {
      return;
    }

    const nextPayment = visiblePaymentOptions[0]?.key;

    if (nextPayment) {
      setPayment(nextPayment);
    }
  }, [selectedPaymentOption, visiblePaymentOptions]);

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
      const result = await safeResponseJson<{ valid?: boolean; code?: string; discount?: number }>(response, {});

      if (!response.ok || !result?.valid) {
        throw new Error(labels.couponInvalid);
      }

      setAppliedCoupon(result?.code ?? code.toUpperCase());
      setDiscount(Number(result?.discount ?? 0));
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
      const usesPaymentEndpoint = payment === "stripe";
      const endpoint = usesPaymentEndpoint ? "/api/payment/checkout" : "/api/orders";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await safeResponseJson<{
        error?: string;
        id?: string;
        accessToken?: string;
        checkoutUrl?: string;
        clientSecret?: string;
        orderConfirmUrl?: string;
        orderId?: string;
        orderNumber?: string;
      }>(response, {});

      if (!response.ok) {
        throw new Error(result?.error ?? labels.checkoutFailed);
      }

      if (payment === "stripe") {
        if (result.clientSecret && result.orderConfirmUrl) {
          setStripePayment({
            clientSecret: result.clientSecret,
            orderNumber: result.orderNumber ?? result.orderId ?? "order",
            orderConfirmUrl: result.orderConfirmUrl
          });
          toast.success("Enter your card details below.");
          return;
        }

        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
          return;
        }

        throw new Error(labels.stripeUrlMissing);
      }

      if (!result?.id) {
        throw new Error("Order was placed but the confirmation link was not returned.");
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
    <main className="bg-paper/60">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
        <BackButton label={locale === "ar" ? "رجوع" : "Back"} fallbackHref={`/${locale}/cart`} className="mb-4" />
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
          {dictionary.actions.checkout}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">{dictionary.checkout.title}</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">{dictionary.checkout.subtitle}</p>
          </div>
          <div className="rounded-md border border-gold-200 bg-white px-4 py-3 text-sm font-bold text-navy shadow-soft">
            Secure Dubai checkout
          </div>
      </div>

      <form onSubmit={submitOrder} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="grid gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white">
                  1
                </span>
                <div>
                  <h2 className="text-xl font-bold text-navy">{dictionary.checkout.shippingInfo}</h2>
                  <p className="mt-1 text-sm font-semibold text-neutral-500">Contact and delivery address</p>
                </div>
              </div>
              <div className="rounded-md bg-gold-50 px-3 py-2 text-xs font-semibold text-navy">
                <p>Guest checkout</p>
                <p className="mt-1 text-neutral-500">
                  No account needed. We will email your order link.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <label
                  key={field.name}
                  className={cn(
                    "grid gap-2 text-sm font-semibold text-navy",
                    ["name", "email", "street"].includes(field.name) && "sm:col-span-2"
                  )}
                >
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
                {!shippingQuote.codAvailable ? (
                  <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-sale">
                    COD is unavailable for {shippingQuote.rate.emirate}. Please choose card payment.
                  </p>
                ) : null}
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

          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white">
                2
              </span>
              <div>
                <h2 className="text-xl font-bold text-navy">{dictionary.checkout.payment}</h2>
                <p className="mt-1 text-sm font-semibold text-neutral-500">Choose payment method</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {visiblePaymentOptions.map((option) => {
                const Icon = option.icon;
                const selected = payment === option.key;

                return (
                  <label
                    key={option.key}
                    title={option.detail}
                    className={cn(
                      "group relative flex min-h-[78px] cursor-pointer items-center gap-3 overflow-hidden rounded-lg border bg-white p-3.5 transition",
                      "hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-soft",
                      selected && "border-gold-500 bg-gold-50 shadow-soft ring-1 ring-gold-200",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.key}
                      checked={payment === option.key}
                      onChange={() => setPayment(option.key)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-md border transition",
                        selected
                          ? "border-navy bg-navy text-white"
                          : "border-gold-100 bg-paper text-gold-700 group-hover:bg-gold-50",
                      )}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-navy">{option.label}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
                        {option.detail}
                      </span>
                      <span
                        className="mt-2 inline-flex h-6 max-w-full items-center rounded-md bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700"
                      >
                        <span className="truncate">Available</span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "absolute right-3 top-3 h-4 w-4 rounded-full border transition rtl:left-3 rtl:right-auto",
                        selected ? "border-gold-700 bg-gold-500 shadow-[inset_0_0_0_3px_white]" : "border-neutral-300 bg-white"
                      )}
                      aria-hidden="true"
                    />
                  </label>
                );
              })}
              {!visiblePaymentOptions.length ? (
                <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-bold text-sale sm:col-span-2">
                  No payment method is currently available. Please contact support or enable a payment method from admin settings.
                </div>
              ) : null}
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-neutral-500">
              Payment visibility is controlled by admin settings. Only cash on delivery and Stripe card payment are supported.
            </p>
            {payment === "cod" && paymentAvailability.codDetail ? (
              <div className="mt-4 rounded-lg border border-neutral-200 bg-paper p-4 text-sm font-semibold leading-6 text-navy">
                {paymentAvailability.codDetail}
              </div>
            ) : null}
            {stripePayment ? (
              <StripePaymentSection
                clientSecret={stripePayment.clientSecret}
                orderNumber={stripePayment.orderNumber}
                returnUrl={stripePayment.orderConfirmUrl}
                publishableKey={paymentAvailability.stripePublishableKey}
              />
            ) : null}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5 shadow-soft lg:sticky lg:top-28">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-navy">{dictionary.cart.summary}</h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">{items.length} item(s) in cart</p>
            </div>
            <span className="rounded-md bg-gold-50 px-3 py-2 text-xs font-bold text-gold-800">AED</span>
          </div>
          <div className="mt-5 grid max-h-[360px] gap-4 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500">{dictionary.cart.emptySubtitle}</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="grid grid-cols-[64px_1fr_auto] gap-3 text-sm">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border border-neutral-200 bg-paper">
                    <Image
                      src={safeRemoteImage(item.image, fallbackProductImage, { width: 160, height: 160, crop: "fill" })}
                      alt={getLocalized(item.name, locale)}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-navy px-1 text-[10px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-navy">{getLocalized(item.name, locale)}</p>
                    {item.variantName ? (
                      <p className="mt-1 text-xs font-semibold text-neutral-500">{getLocalized(item.variantName, locale)}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-neutral-500">{item.brand}</p>
                  </div>
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
          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={items.length === 0 || loading || !selectedPaymentOption?.enabled || Boolean(stripePayment && payment === "stripe")}
          >
            <ShieldCheck size={18} />
            {stripePayment && payment === "stripe"
              ? "Payment form ready"
              : loading
                ? labels.processing
                : paymentButtonLabel()}
          </Button>
        </aside>
      </form>
      </div>
    </main>
  );
}
