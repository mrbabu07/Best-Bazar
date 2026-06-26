"use client";

import { CreditCard, HandCoins, LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { getDisplayName } from "@/lib/text-format";
import type { PublicPaymentAvailability } from "@/lib/payment-config";
import { safeResponseJson } from "@/lib/safe-json";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";
import { defaultShippingSettings, getShippingFee, normalizeShippingSettings, UAE_EMIRATES } from "@/utils/shipping";
import { cn } from "@/utils/cn";
import { fallbackProductImage, safeRemoteImage } from "@/lib/images";
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
  couponOffersAvailable: boolean;
};

type CheckoutFieldName = "name" | "email" | "phone" | "street" | "apartment" | "city" | "country";

type CheckoutField = {
  name: CheckoutFieldName;
  label: string;
  type: string;
  autoComplete: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
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
      street: "Address",
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
      name: "????? ??????",
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
    fields: Record<Exclude<CheckoutFieldName, "apartment">, string>;
  }
>;

type PaymentOptionKey = "stripe" | "cod";

type StripePaymentState = {
  clientSecret: string;
  orderNumber: string;
  orderConfirmUrl: string;
};

type ReverseGeocodeResponse = {
  address?: {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    city?: string;
    town?: string;
    state?: string;
    country?: string;
  };
  display_name?: string;
};

export function CheckoutPageContent({ locale, dictionary, paymentAvailability, couponOffersAvailable }: CheckoutPageContentProps) {
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
  const [emirate, setEmirate] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stripePayment, setStripePayment] = useState<StripePaymentState | null>(null);
  const [mapPin, setMapPin] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLink, setMapLink] = useState("");
  const [locating, setLocating] = useState(false);
  const fieldRefs = useRef<Partial<Record<CheckoutFieldName, HTMLInputElement | null>>>({});
  const storedItems = useCartStore((state) => state.items);
  const storedSubtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedCurrencyRates = usePreferencesStore((state) => state.currencyRates);
  const storedShippingSettings = usePreferencesStore((state) => state.shippingSettings);
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);
  const items = hydrated ? storedItems : [];
  const subtotal = hydrated ? storedSubtotal : 0;
  const currency = hydrated ? storedCurrency : "AED";
  const currencyRates = hydrated ? storedCurrencyRates : defaultCurrencyRates;
  const shippingSettings = hydrated ? storedShippingSettings : defaultShippingSettings;
  const shippingOptions = shippingSettings.shippingRates;
  const selectedShippingRate =
    shippingOptions.find((rate) => rate.emirate.trim().toLowerCase() === emirate.trim().toLowerCase()) ??
    shippingOptions[0];
  const selectedEmirate = emirate;
  const shippingQuote = getShippingFee(
    selectedEmirate || selectedShippingRate?.emirate || "Dubai",
    subtotal,
    shippingSettings.shippingRates,
    shippingSettings.freeShippingThreshold,
    shippingSettings.customAreaFee
  );
  const hasShippingArea = selectedEmirate.trim().length > 0;
  const shipping = hasShippingArea ? shippingQuote.fee : 0;
  const total = Math.max(subtotal + shipping - discount, 0);
  const mapQuery = mapPin ? `${mapPin.lat},${mapPin.lng}` : `${selectedEmirate || "Dubai"}, UAE`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${mapPin ? "16" : "11"}&output=embed`;
  const mapOpenUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const mapBounds = selectedEmirate.trim().toLowerCase() === "dubai"
    ? { north: 25.35, south: 24.95, west: 54.9, east: 55.6 }
    : { north: 26.2, south: 22.6, west: 51.5, east: 56.5 };

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

  useEffect(() => {
    let active = true;

    const refreshShippingSettings = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });

        if (!response.ok || !active) {
          return;
        }

        const data = await safeResponseJson<Record<string, unknown>>(response, {});

        if (!active) {
          return;
        }

        setStorefrontSettings({
          currencyRates: usePreferencesStore.getState().currencyRates,
          shippingSettings: normalizeShippingSettings({
            freeShippingThreshold: data.freeShippingThreshold,
            shippingRates: data.shippingRates,
            customAreaFee: data.customAreaFee
          })
        });
      } catch {
        // Keep the already loaded settings when the public refresh is unavailable.
      }
    };

    void refreshShippingSettings();

    return () => {
      active = false;
    };
  }, [setStorefrontSettings]);
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

  const setFieldValue = (field: CheckoutFieldName, value?: string) => {
    const input = fieldRefs.current[field];

    if (input && value) {
      input.value = value;
    }
  };

  const fillAddressFromPin = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        return;
      }

      const result = await safeResponseJson<ReverseGeocodeResponse>(response, {});
      const address = result.address ?? {};
      const street = [address.house_number, address.road ?? address.pedestrian].filter(Boolean).join(" ").trim();
      const city = address.city ?? address.town ?? address.state;
      const matchedRate = shippingOptions.find((rate) => {
        const emirateName = rate.emirate.toLowerCase();
        const state = (address.state ?? "").toLowerCase();
        const cityName = (city ?? "").toLowerCase();

        return state.includes(emirateName) || cityName.includes(emirateName) || Boolean(cityName && emirateName.includes(cityName));
      });

      setFieldValue("street", street || result.display_name);
      setFieldValue("city", city);

      if (matchedRate) {
        setEmirate(matchedRate.emirate);
      }
    } catch {
      // Keep the selected pin even if public reverse geocoding is unavailable.
    }
  };

  const setDeliveryPin = (lat: number, lng: number, shouldFillAddress = true) => {
    const nextPin = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    };

    setMapPin(nextPin);
    setMapLink(`https://www.google.com/maps?q=${nextPin.lat},${nextPin.lng}`);

    if (shouldFillAddress) {
      void fillAddressFromPin(nextPin.lat, nextPin.lng);
    }
  };

  const handleMapClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xRatio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const yRatio = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    const lat = mapBounds.north - (mapBounds.north - mapBounds.south) * yRatio;
    const lng = mapBounds.west + (mapBounds.east - mapBounds.west) * xRatio;

    setDeliveryPin(lat, lng);
    toast.success("Delivery map pin updated.");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryPin(position.coords.latitude, position.coords.longitude);
        setLocating(false);
        toast.success("Delivery map pin added.");
      },
      () => {
        setLocating(false);
        toast.error("Unable to get location. Please allow location permission or tap the map.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000
      }
    );
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
    const customerNotes = String(formData.get("notes") ?? "").trim();
    const mapNotes = [
      mapPin ? `Map pin: https://www.google.com/maps?q=${mapPin.lat},${mapPin.lng}` : "",
      mapLink.trim() ? `Customer map link: ${mapLink.trim()}` : ""
    ].filter(Boolean);
    const orderNotes = [customerNotes, ...mapNotes].filter(Boolean).join("\n");
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
        tower: "",
        city: String(formData.get("city") ?? ""),
        emirate: String(formData.get("emirate") ?? ""),
        country: "UAE"
      },
      deliverySlot: undefined,
      paymentMethod: paymentMethod(),
      currency,
      locale,
      couponCode: appliedCoupon || coupon.trim() || undefined,
      notes: orderNotes || undefined
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
    { name: "name", label: labels.fields.name, type: "text", autoComplete: "name", placeholder: labels.fields.name },
    { name: "email", label: labels.fields.email, type: "email", autoComplete: "email", placeholder: "Email (optional)", required: false },
    { name: "phone", label: labels.fields.phone, type: "tel", autoComplete: "tel", placeholder: "Phone number" },
    { name: "street", label: labels.fields.street, type: "text", autoComplete: "street-address", placeholder: labels.fields.street },
    {
      name: "apartment",
      label: "Apartment / villa no.",
      type: "text",
      autoComplete: "address-line3",
      placeholder: "Apartment, suite, etc. (optional)",
      required: false
    },
    { name: "city", label: labels.fields.city, type: "text", autoComplete: "address-level2", placeholder: "City" }
  ];

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <form onSubmit={submitOrder} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_520px]">
        <section className="grid gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-4xl">Delivery</h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-neutral-800 sm:col-span-2">
              <span className="sr-only">Country/Region</span>
              <select
                name="country"
                defaultValue="United Arab Emirates"
                className="h-[74px] rounded-2xl border border-neutral-300 bg-white px-4 text-lg font-medium text-neutral-950"
              >
                <option value="United Arab Emirates">United Arab Emirates</option>
              </select>
            </label>
              {fields.map((field) => (
                <label
                  key={field.name}
                  className={cn(
                    "grid gap-2 text-sm font-semibold text-neutral-800",
                    ["name", "email", "phone", "street", "apartment"].includes(field.name) && "sm:col-span-2"
                  )}
                >
                  <span className="sr-only">{field.label}</span>
                  <input
                    ref={(node) => {
                      fieldRefs.current[field.name] = node;
                    }}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    defaultValue={field.defaultValue}
                    placeholder={field.placeholder}
                    required={field.required !== false}
                    className="h-[74px] rounded-2xl border border-neutral-300 bg-white px-4 text-lg font-medium text-neutral-950 placeholder:font-normal placeholder:text-neutral-500 transition focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </label>
              ))}
              <div className="grid gap-2 text-sm font-semibold text-neutral-800">
                <span className="sr-only">{labels.shippingArea}</span>
                <select
                  name="emirate"
                  value={selectedEmirate}
                  onChange={(event) => setEmirate(event.target.value)}
                  required
                  className="h-[74px] rounded-2xl border border-neutral-300 bg-white px-4 text-lg font-medium text-neutral-950 transition focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                >
                  <option value="" disabled>Emirate</option>
                  {UAE_EMIRATES.map((emirateOption) => (
                    <option key={emirateOption.key} value={emirateOption.nameEn}>
                      {emirateOption.nameEn}
                    </option>
                  ))}
                </select>
                {!shippingQuote.codAvailable ? (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-sale">
                    COD is unavailable for {shippingQuote.rate.emirate}. Please choose card payment.
                  </p>
                ) : null}
              </div>
              <label className="flex items-center gap-3 text-base font-medium text-neutral-950 sm:col-span-2">
                <input type="checkbox" name="saveInfo" className="h-7 w-7 rounded border-neutral-300 accent-neutral-950" />
                Save this information for next time
              </label>
              <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-base font-semibold text-neutral-950">
                      <MapPin size={18} />
                      Delivery map pin
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">Optional. Use your location or tap the map to set a delivery pin.</p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={useCurrentLocation} disabled={locating}>
                    <LocateFixed size={15} />
                    {locating ? "Locating..." : "Use my location"}
                  </Button>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  <iframe
                    title="Delivery map preview"
                    src={mapEmbedUrl}
                    className="h-56 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <button
                    type="button"
                    onClick={handleMapClick}
                    className="absolute inset-0 cursor-crosshair"
                    aria-label="Tap map to set delivery pin"
                  >
                    <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-950 shadow">
                      Tap map to set pin
                    </span>
                    {mapPin ? (
                      <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-black text-white shadow ring-4 ring-white">
                        <MapPin size={20} />
                      </span>
                    ) : null}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    value={mapLink}
                    onChange={(event) => setMapLink(event.target.value)}
                    placeholder="Paste Google Maps pin/share link (optional)"
                    className="h-12 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700"
                  />
                  <a
                    href={mapOpenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950 hover:bg-neutral-100"
                  >
                    Open map
                  </a>
                </div>
                {mapPin ? (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Pin added: {mapPin.lat}, {mapPin.lng}
                  </p>
                ) : null}
              </div>
              <textarea
                name="notes"
                rows={3}
                placeholder="Order note (optional)"
                className="rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-base font-medium text-neutral-950 placeholder:text-neutral-500 sm:col-span-2"
              />
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

        <aside className="h-fit bg-neutral-50 p-5 lg:sticky lg:top-28 lg:min-h-[calc(100vh-7rem)] lg:p-8">
          <div className="grid max-h-[360px] gap-5 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500">{dictionary.cart.emptySubtitle}</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="grid grid-cols-[80px_1fr_auto] gap-4 text-sm">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <Image
                      src={safeRemoteImage(item.image, fallbackProductImage, { width: 160, height: 160, crop: "fill" })}
                      alt={getDisplayName(item.name, locale)}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                    <span className="absolute -right-1 -top-1 grid h-7 min-w-7 place-items-center rounded-full bg-black px-1.5 text-sm font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-medium text-neutral-950">{getDisplayName(item.name, locale)}</p>
                    {item.variantName ? (
                      <p className="mt-1 text-base text-neutral-500">{getLocalized(item.variantName, locale)}</p>
                    ) : null}
                  </div>
                  <span className="text-lg font-medium text-neutral-950">
                    {formatCurrency(item.price * item.quantity, currency, locale, currencyRates)}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 grid gap-4 border-t border-neutral-200 pt-6 text-lg">
            {couponOffersAvailable ? (
            <label className="grid gap-2 text-sm font-semibold text-navy">
              <div className="flex gap-2">
                <input
                  name="couponCode"
                  value={coupon}
                  onChange={(event) => updateCoupon(event.target.value)}
                  placeholder="Discount code"
                  className="h-[72px] min-w-0 flex-1 rounded-2xl border border-neutral-300 bg-white px-4 text-lg font-medium text-neutral-950 placeholder:font-normal placeholder:text-neutral-500"
                />
                <Button type="button" variant="secondary" onClick={applyCoupon} disabled={applyingCoupon || subtotal <= 0} className="h-[72px] rounded-2xl px-6 text-lg">
                  {applyingCoupon ? labels.checking : dictionary.actions.apply}
                </Button>
              </div>
            </label>
            ) : null}
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
              <span className="text-neutral-950">{dictionary.common.shipping}</span>
              <span className="font-medium text-neutral-500">
                {hasShippingArea ? formatCurrency(shipping, currency, locale, currencyRates) : "Enter shipping address"}
              </span>
            </div>
            {discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-neutral-500">{dictionary.common.discount}</span>
              <span className="font-semibold text-navy">-{formatCurrency(discount, currency, locale, currencyRates)}</span>
            </div>
            ) : null}
            <div className="flex justify-between pt-3 text-2xl">
              <span className="font-semibold text-neutral-950">{dictionary.common.total}</span>
              <span className="font-semibold text-neutral-950">{formatCurrency(total, currency, locale, currencyRates)}</span>
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

