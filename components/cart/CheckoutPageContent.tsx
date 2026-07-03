"use client";

import { HandCoins, LocateFixed, MapPin, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import { FormEvent, PointerEvent, TouchEvent, WheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { getDisplayName } from "@/lib/text-format";
import type { PublicPaymentAvailability } from "@/lib/payment-config";
import { safeResponseJson } from "@/lib/safe-json";
import type { CheckoutControls } from "@/lib/theme-config";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";
import { defaultShippingSettings, formatDeliveryDays, getShippingFee, normalizeShippingSettings, UAE_EMIRATES } from "@/utils/shipping";
import { cn } from "@/utils/cn";
import { fallbackProductImage, safeRemoteImage } from "@/lib/images";
import { Button } from "@/components/ui/Button";

type CheckoutPageContentProps = {
  locale: Locale;
  dictionary: Dictionary;
  paymentAvailability: PublicPaymentAvailability;
  couponOffersAvailable: boolean;
  checkoutControls: CheckoutControls;
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
    notes: string;
    shippingArea: string;
    delivery: string;
    applied: (code: string) => string;
    fields: Record<Exclude<CheckoutFieldName, "apartment">, string>;
  }
>;

type PaymentOptionKey = "cod";

type ReverseGeocodeResponse = {
  name?: string;
  category?: string;
  type?: string;
  addresstype?: string;
  extratags?: Record<string, string | undefined>;
  namedetails?: Record<string, string | undefined>;
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    path?: string;
    house_number?: string;
    house_name?: string;
    building?: string;
    tourism?: string;
    amenity?: string;
    shop?: string;
    office?: string;
    commercial?: string;
    residential?: string;
    apartments?: string;
    apartment?: string;
    flat?: string;
    unit?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    suburb?: string;
    neighbourhood?: string;
    country?: string;
    country_code?: string;
  };
  display_name?: string;
};

const defaultMapCenter = { lat: 25.2048, lng: 55.2708 };
const mapTileSize = 256;
const minMapZoom = 10;
const maxMapZoom = 21;
const dubaiDeliverySlots = [
  "Today 6 PM - 10 PM",
  "Tomorrow 9 AM - 1 PM",
  "Tomorrow 1 PM - 5 PM",
  "Tomorrow 5 PM - 9 PM"
];
const uaeDeliverySlots = ["Standard delivery 10 AM - 6 PM", "Evening delivery 5 PM - 9 PM"];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lngToTileX(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function latToTileY(lat: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** zoom;
}

function tileXToLng(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tileYToLat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function parseCoordinateLink(value: string) {
  const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);

  if (!match) {
    return null;
  }

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat: clamp(lat, -85, 85),
    lng: clamp(lng, -180, 180)
  };
}

function normalizeLocationName(value?: string) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function apartmentOrVillaFromMap(result: ReverseGeocodeResponse) {
  const address = result.address ?? {};
  return [
    address.unit,
    address.flat,
    address.apartment,
    address.apartments,
    result.extratags?.["addr:unit"],
    result.extratags?.["addr:flats"],
    result.extratags?.["addr:housenumber"],
    address.house_number
  ].find((value) => value?.trim())?.trim() ?? "";
}

function findUaeEmirate(address: ReverseGeocodeResponse["address"], displayName?: string) {
  const locationText = [
    address?.state,
    address?.state_district,
    address?.city,
    address?.town,
    address?.village,
    address?.municipality,
    address?.county,
    displayName
  ]
    .filter(Boolean)
    .map((value) => normalizeLocationName(value))
    .join(" ");

  const aliases: Record<string, string[]> = {
    Dubai: ["dubai"],
    "Abu Dhabi": ["abudhabi", "abuzaby"],
    Sharjah: ["sharjah", "ashshariqah"],
    Ajman: ["ajman"],
    "Ras Al Khaimah": ["rasalkhaimah", "rasalkhaymah"],
    Fujairah: ["fujairah", "alfujayrah"],
    "Umm Al Quwain": ["ummalquwain", "ummalqaywayn"]
  };

  return UAE_EMIRATES.find((emirateOption) =>
    (aliases[emirateOption.nameEn] ?? [normalizeLocationName(emirateOption.nameEn)]).some((alias) =>
      locationText.includes(alias)
    )
  );
}

export function CheckoutPageContent({ locale, dictionary, paymentAvailability, couponOffersAvailable, checkoutControls }: CheckoutPageContentProps) {
  const labels = checkoutCopy[locale];
  const router = useRouter();
  const hydrated = useHydrated();
  const initialPayment: PaymentOptionKey = "cod";
  const [payment, setPayment] = useState<PaymentOptionKey>(initialPayment);
  const [emirate, setEmirate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apartment, setApartment] = useState("");
  const [mapPin, setMapPin] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultMapCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapMode, setMapMode] = useState<"map" | "satellite">("satellite");
  const [mapLink, setMapLink] = useState("");
  const [locating, setLocating] = useState(false);
  const [dragStart, setDragStart] = useState<{
    pointerId: number;
    x: number;
    y: number;
    center: { lat: number; lng: number };
  } | null>(null);
  const fieldRefs = useRef<Partial<Record<CheckoutFieldName, HTMLInputElement | null>>>({});
  const reverseGeocodeRequestRef = useRef(0);
  const apartmentManuallyEditedRef = useRef(false);
  const activeMapPointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchGestureRef = useRef<{ distance: number; zoom: number } | null>(null);
  const storedItems = useCartStore((state) => state.items);
  const storedSubtotal = useCartStore((state) => state.subtotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedCurrencyRates = usePreferencesStore((state) => state.currencyRates);
  const storedShippingSettings = usePreferencesStore((state) => state.shippingSettings);
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);
  const items = hydrated ? storedItems : [];
  const subtotal = hydrated ? storedSubtotal : 0;
  const hasProductFreeDelivery = items.some((item) => item.freeDelivery === true);
  const currency = hydrated ? storedCurrency : "AED";
  const currencyRates = hydrated ? storedCurrencyRates : defaultCurrencyRates;
  const shippingSettings = hydrated ? storedShippingSettings : defaultShippingSettings;
  const shippingOptions = shippingSettings.shippingRates;
  const showEmirateFees = !shippingSettings.customAreaFee.enabled;
  const selectedShippingRate =
    shippingOptions.find((rate) => rate.emirate.trim().toLowerCase() === emirate.trim().toLowerCase()) ??
    shippingOptions[0];
  const selectedEmirate = emirate;
  const deliverySlotOptions = selectedEmirate.trim().toLowerCase() === "dubai"
    ? dubaiDeliverySlots
    : uaeDeliverySlots;
  const shippingQuote = getShippingFee(
    selectedEmirate || selectedShippingRate?.emirate || "Dubai",
    subtotal,
    shippingSettings.shippingRates,
    shippingSettings.freeShippingThreshold,
    shippingSettings.customAreaFee
  );
  const hasShippingArea = selectedEmirate.trim().length > 0;
  const thresholdFreeDelivery =
    checkoutControls.freeDeliveryThresholdEnabled &&
    shippingSettings.freeShippingThreshold > 0 &&
    subtotal >= shippingSettings.freeShippingThreshold;
  const shipping = checkoutControls.freeDeliveryEnabled || thresholdFreeDelivery || hasProductFreeDelivery
    ? 0
    : hasShippingArea
      ? shippingQuote.fee
      : 0;
  const total = Math.max(subtotal + shipping - discount, 0);
  const selectedMapPoint = mapPin ?? mapCenter;
  const mapOpenUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedMapPoint.lat},${selectedMapPoint.lng}`)}`;
  const visibleMapTiles = useMemo(() => {
    const centerX = lngToTileX(mapCenter.lng, mapZoom);
    const centerY = latToTileY(mapCenter.lat, mapZoom);
    const baseX = Math.floor(centerX);
    const baseY = Math.floor(centerY);
    const maxTile = 2 ** mapZoom;
    const tiles: Array<{ key: string; src: string; left: string; top: string }> = [];

    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dy = -2; dy <= 2; dy += 1) {
        const x = baseX + dx;
        const y = baseY + dy;

        if (y < 0 || y >= maxTile) {
          continue;
        }

        const wrappedX = ((x % maxTile) + maxTile) % maxTile;

        tiles.push({
          key: `${wrappedX}-${y}-${mapZoom}`,
          src:
            mapMode === "satellite"
              ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${mapZoom}/${y}/${wrappedX}`
              : `https://tile.openstreetmap.org/${mapZoom}/${wrappedX}/${y}.png`,
          left: `calc(50% + ${(x - centerX) * mapTileSize}px)`,
          top: `calc(50% + ${(y - centerY) * mapTileSize}px)`
        });
      }
    }

    return tiles;
  }, [mapCenter.lat, mapCenter.lng, mapMode, mapZoom]);

  const paymentMethod = () => {
    return "COD";
  };

  const paymentButtonLabel = () => {
    return paymentAvailability.codLabel || dictionary.checkout.cod;
  };

  const paymentOptions = useMemo(
    () => [
      {
        key: "cod" as const,
        label: paymentAvailability.codLabel || dictionary.checkout.cod,
        detail: "",
        icon: HandCoins,
        enabled: paymentAvailability.cod && shippingQuote.codAvailable
      },
    ],
    [dictionary.checkout.cod, paymentAvailability, shippingQuote.codAvailable]
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
    setDeliverySlot("");
  }, [selectedEmirate]);

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
    if (field === "apartment") {
      setApartment(value ?? "");
      return;
    }

    const input = fieldRefs.current[field];

    if (input) {
      input.value = value ?? "";
    }
  };

  const fillAddressFromPin = async (lat: number, lng: number) => {
    const requestId = reverseGeocodeRequestRef.current + 1;
    reverseGeocodeRequestRef.current = requestId;

    try {
      const response = await fetch(
        `/api/location/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
        { cache: "no-store" }
      );

      if (!response.ok || requestId !== reverseGeocodeRequestRef.current) {
        return false;
      }

      const result = await safeResponseJson<ReverseGeocodeResponse>(response, {});
      if (requestId !== reverseGeocodeRequestRef.current) {
        return false;
      }

      const address = result.address ?? {};
      const countryCode = address.country_code?.trim().toLowerCase();

      if (countryCode && countryCode !== "ae") {
        setMapPin(null);
        setMapCenter(defaultMapCenter);
        setMapZoom(13);
        setMapLink("");
        setEmirate("");
        toast.error("Delivery is available inside the UAE only. Please select a UAE location.");
        return false;
      }

      const streetName = address.road ?? address.pedestrian ?? address.footway ?? address.path;
      const areaName = address.neighbourhood ?? address.suburb;
      const street = [streetName, areaName].filter((value, index, values) => value && values.indexOf(value) === index).join(", ");
      const city =
        address.city ??
        address.town ??
        address.village ??
        address.municipality ??
        address.county ??
        address.state_district ??
        address.state;
      const apartmentOrVilla = apartmentOrVillaFromMap(result);
      const matchedEmirate = findUaeEmirate(address, result.display_name);

      setFieldValue("street", street || result.display_name || "");
      if (apartmentOrVilla && !apartmentManuallyEditedRef.current) {
        setFieldValue("apartment", apartmentOrVilla);
      }
      setFieldValue("city", city);
      if (matchedEmirate) {
        setEmirate(matchedEmirate.nameEn);
      } else {
        setEmirate("");
      }
      return true;
    } catch {
      // Keep the selected pin even if address lookup is temporarily unavailable.
      return false;
    }
  };

  const setDeliveryPin = async (lat: number, lng: number, shouldFillAddress = true) => {
    const nextPin = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    };

    setMapPin(nextPin);
    setMapCenter(nextPin);
    setMapZoom(maxMapZoom);
    setMapLink(`https://www.google.com/maps?q=${nextPin.lat},${nextPin.lng}`);
    if (shouldFillAddress) {
      return fillAddressFromPin(nextPin.lat, nextPin.lng);
    }
    return true;
  };

  const setPinAtMapCenter = () => {
    void setDeliveryPin(mapCenter.lat, mapCenter.lng).then((validLocation) => {
      if (validLocation) {
        toast.success("Delivery pin set.");
      }
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void setDeliveryPin(position.coords.latitude, position.coords.longitude).then((validLocation) => {
          setLocating(false);
          if (validLocation) {
            toast.success("Delivery map pin added.");
          }
        });
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

  const startMapDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activeMapPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activeMapPointersRef.current.size > 1) {
      const [first, second] = Array.from(activeMapPointersRef.current.values());
      pinchGestureRef.current = {
        distance: Math.max(Math.hypot(second.x - first.x, second.y - first.y), 1),
        zoom: mapZoom
      };
      setDragStart(null);
      return;
    }

    setDragStart({
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      center: mapCenter
    });
  };

  const moveMapDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeMapPointersRef.current.has(event.pointerId)) {
      return;
    }

    activeMapPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activeMapPointersRef.current.size > 1) {
      event.preventDefault();
      const [first, second] = Array.from(activeMapPointersRef.current.values());
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const gesture = pinchGestureRef.current;

      if (gesture) {
        const zoomDelta = Math.log2(Math.max(distance, 1) / gesture.distance) * 2;
        setMapZoom(clamp(Math.round(gesture.zoom + zoomDelta), minMapZoom, maxMapZoom));
      }
      return;
    }

    if (!dragStart || dragStart.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    const startX = lngToTileX(dragStart.center.lng, mapZoom);
    const startY = latToTileY(dragStart.center.lat, mapZoom);
    const nextX = startX - dx / mapTileSize;
    const nextY = startY - dy / mapTileSize;

    setMapCenter({
      lat: clamp(tileYToLat(nextY, mapZoom), -85, 85),
      lng: clamp(tileXToLng(nextX, mapZoom), -180, 180)
    });
  };

  const stopMapDrag = (event: PointerEvent<HTMLDivElement>) => {
    activeMapPointersRef.current.delete(event.pointerId);

    const remainingPointer = Array.from(activeMapPointersRef.current.entries())[0];
    if (remainingPointer) {
      pinchGestureRef.current = null;
      setDragStart({
        pointerId: remainingPointer[0],
        x: remainingPointer[1].x,
        y: remainingPointer[1].y,
        center: mapCenter
      });
    } else {
      pinchGestureRef.current = null;
      setDragStart(null);
    }
  };

  const zoomMap = (direction: 1 | -1) => {
    setMapZoom((zoom) => clamp(zoom + direction, minMapZoom, maxMapZoom));
  };

  const handleMapWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    zoomMap(event.deltaY < 0 ? 1 : -1);
  };

  const containMapTouch = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  };

  const applyMapLink = () => {
    const parsed = parseCoordinateLink(mapLink);

    if (!parsed) {
      toast.error("Paste a Google Maps link or coordinates like 25.2048, 55.2708.");
      return;
    }

    void setDeliveryPin(parsed.lat, parsed.lng).then((validLocation) => {
      if (validLocation) {
        toast.success("Map pin added from link.");
      }
    });
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
        productId: String(item.productId ?? item.id ?? "").split(":")[0],
        variantId: item.variantId || undefined,
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
      deliverySlot: deliverySlot || undefined,
      paymentMethod: paymentMethod(),
      currency,
      locale,
      couponCode: couponOffersAvailable ? appliedCoupon || coupon.trim() || undefined : undefined,
      notes: orderNotes || undefined
    };

    try {
      const response = await fetch("/api/orders", {
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
      placeholder: "Apartment / villa no. (optional)",
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
                    value={field.name === "apartment" ? apartment : undefined}
                    defaultValue={field.name === "apartment" ? undefined : field.defaultValue}
                    placeholder={field.placeholder}
                    required={field.required !== false}
                    onChange={field.name === "apartment" ? (event) => {
                      setApartment(event.currentTarget.value);
                      apartmentManuallyEditedRef.current = event.currentTarget.value.trim().length > 0;
                    } : undefined}
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
                  {UAE_EMIRATES.map((emirateOption) => {
                    const rate = shippingOptions.find((item) => item.key === emirateOption.key);
                    const feeLabel = showEmirateFees && rate
                      ? ` - ${formatCurrency(rate.cost, currency, locale, currencyRates)}`
                      : "";

                    return (
                      <option key={emirateOption.key} value={emirateOption.nameEn}>
                        {emirateOption.nameEn}{feeLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
              {hasShippingArea ? (
                <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-emerald-700 shadow-sm">
                      <Truck size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-950">Delivery to {selectedEmirate}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-800">
                        Delivery in {formatDeliveryDays(shippingQuote.estimatedDays)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-neutral-950">
                    {shipping === 0 ? "Free delivery" : formatCurrency(shipping, currency, locale, currencyRates)}
                  </p>
                </div>
              ) : null}
              <label className="grid gap-2 text-sm font-semibold text-neutral-800 sm:col-span-2">
                <span>Preferred delivery time</span>
                <select
                  name="deliverySlot"
                  value={deliverySlot}
                  onChange={(event) => setDeliverySlot(event.target.value)}
                  required
                  disabled={!hasShippingArea}
                  className="h-[64px] rounded-2xl border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-950 transition focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                >
                  <option value="" disabled>
                    {hasShippingArea ? "Select delivery time" : "Select emirate first"}
                  </option>
                  {deliverySlotOptions.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 text-base font-medium text-neutral-950 sm:col-span-2">
                <input type="checkbox" name="saveInfo" className="h-7 w-7 rounded border-neutral-300 accent-neutral-950" />
                Save this information for next time
              </label>
                <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:col-span-2 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                      <MapPin size={18} />
                      Delivery map pin
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-neutral-500">Optional. Drag to move, pinch with two fingers to zoom, then set the delivery pin.</p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={useCurrentLocation} disabled={locating}>
                    <LocateFixed size={15} />
                    {locating ? "Locating..." : "Use my location"}
                  </Button>
                </div>
                <div
                  className="relative h-[360px] touch-none overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-800 select-none"
                  onPointerDown={startMapDrag}
                  onPointerMove={moveMapDrag}
                  onPointerUp={stopMapDrag}
                  onPointerCancel={stopMapDrag}
                  onWheel={handleMapWheel}
                  onTouchMove={containMapTouch}
                  style={{ touchAction: "none", overscrollBehavior: "contain" }}
                  role="application"
                  aria-label="Interactive delivery map"
                >
                  <div
                    className="absolute left-3 top-3 z-30"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <div className="inline-flex overflow-hidden rounded-sm border border-neutral-300 bg-white/95 shadow">
                      {(["map", "satellite"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setMapMode(mode)}
                          className={`h-8 px-4 text-xs font-semibold capitalize ${
                            mapMode === mode ? "bg-white text-neutral-950" : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  {visibleMapTiles.map((tile) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={tile.key}
                      src={tile.src}
                      alt=""
                      draggable={false}
                      className="absolute h-64 w-64 max-w-none"
                      style={{ left: tile.left, top: tile.top }}
                    />
                  ))}
                  <div className="absolute inset-0 bg-black/5" />
                  <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full text-red-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
                    <MapPin size={18} fill="currentColor" strokeWidth={1.2} />
                  </div>
                  <div className="absolute left-1/2 top-1/2 z-20 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-red-600" />
                  <button
                    type="button"
                    onClick={setPinAtMapCenter}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="absolute bottom-3 left-1/2 z-20 h-10 -translate-x-1/2 rounded bg-black px-5 text-sm font-semibold text-white shadow-lg"
                  >
                    Set pin here
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <input
                    value={mapLink}
                    onChange={(event) => setMapLink(event.target.value)}
                    placeholder="Paste Google Maps link or coordinates (optional)"
                    className="h-12 rounded-xl border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700"
                  />
                  <Button type="button" variant="secondary" onClick={applyMapLink} className="h-12 rounded-xl px-4">
                    Use link
                  </Button>
                  <a
                    href={mapOpenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-950 hover:bg-neutral-100"
                  >
                    Open map
                  </a>
                </div>
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
              <span className="text-right font-medium text-neutral-500">
                {checkoutControls.freeDeliveryEnabled || thresholdFreeDelivery || hasProductFreeDelivery
                  ? "Free delivery"
                  : hasShippingArea
                    ? formatCurrency(shipping, currency, locale, currencyRates)
                    : "Enter shipping address"}
                {hasShippingArea ? (
                  <span className="mt-1 block text-xs font-semibold text-neutral-500">
                    Delivery in {formatDeliveryDays(shippingQuote.estimatedDays)}
                  </span>
                ) : null}
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
            disabled={items.length === 0 || loading || !selectedPaymentOption?.enabled}
          >
            <ShieldCheck size={18} />
            {loading ? labels.processing : paymentButtonLabel()}
          </Button>
        </aside>
      </form>
      </div>
    </main>
  );
}

