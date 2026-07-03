"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe2,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Search,
  ShoppingBag,
  Truck,
  User,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import type { StorefrontFrameSettings } from "@/components/layout/types";
import { useHydrated } from "@/hooks/useHydrated";
import { safeJsonParse, safeResponseJson } from "@/lib/safe-json";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { currencyOptions, type CurrencyCode } from "@/utils/currency";
import { formatDeliveryDays, normalizeShippingSettings } from "@/utils/shipping";

type HeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: StorefrontFrameSettings;
};

type ProductNotification = {
  id: string;
  name?: {
    en?: string;
    ar?: string;
  };
  href?: {
    en?: string;
    ar?: string;
  };
  createdAt?: string;
};

type HeaderCategory = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  parentCategoryId?: string | null;
};

type StorefrontNotification = {
  title: string;
  id: string;
  detail: string;
  href: string;
  icon?: "product" | "delivery";
  createdAt?: string;
};

function formatNotificationTimestamp(value: string | undefined, locale: Locale) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai"
  }).format(date);
}

export function Header({ locale, dictionary, settings }: HeaderProps) {
  const pathname = usePathname();
  const currentPathname = pathname ?? `/${locale}`;
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [liveSettings, setLiveSettings] = useState(settings);
  const [productNotifications, setProductNotifications] = useState<ProductNotification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [categories, setCategories] = useState<HeaderCategory[]>(settings.navigationCategories);
  const storedCartCount = useCartStore((state) => state.totalItems());
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const setCurrency = usePreferencesStore((state) => state.setCurrency);
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);
  const cartCount = hydrated ? storedCartCount : 0;
  const currency = hydrated ? storedCurrency : "AED";

  const navItems = [
    { label: locale === "ar" ? settings.storefrontContent.navHomeAr : settings.storefrontContent.navHomeEn, href: `/${locale}` },
    { label: locale === "ar" ? settings.storefrontContent.navShopAr : settings.storefrontContent.navShopEn, href: `/${locale}/shop` },
    { label: locale === "ar" ? settings.storefrontContent.navAccountAr : settings.storefrontContent.navAccountEn, href: `/${locale}/account` }
  ];
  const fashionLinks = categories
    .filter((category) => !category.parentCategoryId)
    .map((category) => ({
      label: locale === "ar" ? category.nameAr || category.nameEn : category.nameEn || category.nameAr,
      href: `/${locale}/shop?category=${category.slug}`
    }));
  const brandName = locale === "ar" ? liveSettings.storeNameAr : liveSettings.storeNameEn;
  const announcement = locale === "ar" ? liveSettings.announcementAr : liveSettings.announcementEn;
  const defaultDeliveryRate =
    liveSettings.shippingSettings.shippingRates.find((rate) => rate.emirate.toLowerCase() === "dubai") ??
    liveSettings.shippingSettings.shippingRates[0];
  const deliveryArea = liveSettings.shippingSettings.customAreaFee.enabled
    ? liveSettings.shippingSettings.customAreaFee.areaLabel
    : "UAE";
  const deliveryDays = liveSettings.shippingSettings.customAreaFee.enabled
    ? liveSettings.shippingSettings.customAreaFee.deliveryDays
    : defaultDeliveryRate?.deliveryDays;
  const freeShippingThreshold = liveSettings.shippingSettings.freeShippingThreshold;
  const freeDeliveryMessage = liveSettings.themeSettings.checkoutControls.freeDeliveryEnabled
    ? "Free UAE delivery on every order"
    : liveSettings.themeSettings.checkoutControls.freeDeliveryThresholdEnabled && freeShippingThreshold > 0
      ? `Free UAE delivery on orders over AED ${freeShippingThreshold}`
      : "";
  const dismissedStorageKey = `best-mart-dismissed-notifications:${locale}`;
  const storefrontNotifications: StorefrontNotification[] = [
    ...(liveSettings.announcementActive && announcement
      ? [
          {
            title: locale === "ar" ? "Store announcement" : "Store announcement",
            id: `announcement:${announcement}`,
            detail: announcement,
            href: `/${locale}/shop`
          }
        ]
      : []),
    ...productNotifications.map((product) => {
      const productName = locale === "ar" ? product.name?.ar || product.name?.en : product.name?.en || product.name?.ar;

      return {
        title: locale === "ar" ? "New product" : "New product",
        id: product.id,
        detail: productName ?? "A new product is available now",
        href: (locale === "ar" ? product.href?.ar : product.href?.en) ?? `/${locale}/shop`,
        icon: "product" as const,
        createdAt: product.createdAt
      };
    }),
    {
      title: locale === "ar" ? "Delivery time" : "Delivery time",
      id: `delivery:${deliveryArea}:${deliveryDays ?? "available"}`,
      detail: deliveryDays ? `${deliveryArea}: ${formatDeliveryDays(deliveryDays)}` : "UAE delivery available",
      href: `/${locale}/checkout`,
      icon: "delivery" as const
    },
    {
      title: locale === "ar" ? "Free shipping" : "Free shipping",
      id: `free-shipping:${freeShippingThreshold}`,
      detail: `${locale === "ar" ? "Above" : "Above"} AED ${freeShippingThreshold}`,
      href: `/${locale}/checkout`,
      icon: "delivery" as const
    },
    ...(cartCount > 0
      ? [
          {
            title: locale === "ar" ? "Cart reminder" : "Cart reminder",
            id: `cart:${cartCount}`,
            detail: `${cartCount} ${cartCount === 1 ? "item" : "items"} ready in cart`,
            href: `/${locale}/cart`,
            icon: "delivery" as const
          }
        ]
      : [])
  ];
  const visibleNotifications = storefrontNotifications.filter((item) => !dismissedNotifications.includes(item.id));
  const iconButtonClass =
    "grid h-10 w-10 shrink-0 place-items-center rounded-none text-neutral-950 transition hover:bg-neutral-100 sm:h-11 sm:w-11";
  const mobileLinkClass =
    "flex items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-navy transition hover:border-neutral-300 hover:bg-neutral-50";

  useEffect(() => {
    setLiveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const parsed = safeJsonParse<unknown[]>(window.localStorage.getItem(dismissedStorageKey), []);
    setDismissedNotifications(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  }, [dismissedStorageKey]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await safeResponseJson<unknown[]>(response, []);
        if (active && Array.isArray(data)) {
          setCategories(data.filter((item): item is HeaderCategory => Boolean(item && typeof item === "object" && "id" in item && "slug" in item && "nameEn" in item && "nameAr" in item)));
        }
      } catch {
        // Category navigation remains optional when a refresh fails.
      }
    };
    void loadCategories();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    const refreshNotifications = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      try {
        const response = await fetch("/api/settings", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = await safeResponseJson<Record<string, unknown>>(response, {});

        if (!active || !data) {
          return;
        }

        const shippingSettings = normalizeShippingSettings({
          freeShippingThreshold: data?.freeShippingThreshold ?? settings.shippingSettings.freeShippingThreshold,
          shippingRates: data?.shippingRates ?? settings.shippingSettings.shippingRates
        });
        const nextSettings = {
          ...settings,
          storeNameEn: typeof data?.storeNameEn === "string" ? data.storeNameEn : settings.storeNameEn,
          storeNameAr: typeof data?.storeNameAr === "string" ? data.storeNameAr : settings.storeNameAr,
          whatsapp: typeof data?.whatsapp === "string" ? data.whatsapp : settings.whatsapp,
          announcementEn: typeof data?.announcementEn === "string" ? data.announcementEn : "",
          announcementAr: typeof data?.announcementAr === "string" ? data.announcementAr : "",
          announcementActive: Boolean(data?.announcementActive),
          shippingSettings
        };

        setLiveSettings(nextSettings);
        setStorefrontSettings({
          currencyRates: settings.currencyRates,
          shippingSettings: nextSettings.shippingSettings
        });

        const notificationsResponse = await fetch("/api/notifications", { cache: "no-store" });

        if (notificationsResponse.ok) {
          const notificationsData = await safeResponseJson<{ products?: ProductNotification[] }>(
            notificationsResponse,
            {}
          );
          setProductNotifications(Array.isArray(notificationsData?.products) ? notificationsData.products : []);
        }
      } catch {
        // Keep the last known notification data when the live refresh fails.
      }
    };

    void refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [setStorefrontSettings, settings]);

  const switchLocalePath = (nextLocale: Locale) => {
    const segments = currentPathname.split("/");
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  };

  const persistLocale = (nextLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    const params = new URLSearchParams();

    if (query) {
      params.set("search", query);
    }

    router.push(`/${locale}/shop${params.toString() ? `?${params.toString()}` : ""}`);
    setOpen(false);
  };

  const dismissNotification = (id: string) => {
    setDismissedNotifications((current) => {
      const next = Array.from(new Set([...current, id]));

      try {
        window.localStorage.setItem(dismissedStorageKey, JSON.stringify(next));
      } catch {
        // The in-memory state still hides the notification for this session.
      }

      return next;
    });
  };

  return (
    <header suppressHydrationWarning className="sticky top-0 z-50 border-b border-[#dfe2d8] bg-[#f4f6ee]">
      {freeDeliveryMessage ? (
        <div className="flex min-h-8 items-center justify-center bg-[#190d04] px-4 text-center text-[10px] font-semibold text-[#ffe0a8] sm:min-h-9 sm:text-xs">
          {freeDeliveryMessage}
        </div>
      ) : null}
      {liveSettings.announcementActive && announcement ? (
        <div className="font-editorial grid min-h-10 grid-cols-[40px_1fr_40px] items-center border-b border-[#e8c786] bg-[#ffdda5] px-2 text-center text-sm font-semibold text-neutral-950 sm:min-h-11 sm:grid-cols-[1fr_auto_1fr] sm:px-8 sm:text-base">
          <span className="justify-self-start text-neutral-500 sm:justify-self-end" aria-hidden="true">
            <ChevronLeft size={15} />
          </span>
          <span className="line-clamp-1 px-3">{announcement}</span>
          <span className="justify-self-end text-neutral-500 sm:justify-self-start" aria-hidden="true">
            <ChevronRight size={15} />
          </span>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1210px] px-4 sm:px-7 lg:px-8">
        <div className="relative flex min-h-[4.75rem] items-center gap-1 py-2 sm:min-h-[6.25rem] lg:gap-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`${iconButtonClass} sm:hidden`}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link
            href={`/${locale}`}
            onClick={() => setOpen(false)}
            className="absolute left-1/2 z-10 flex h-11 w-[8.75rem] -translate-x-1/2 items-center justify-center sm:static sm:mr-auto sm:h-14 sm:w-[11rem] sm:translate-x-0"
            aria-label={`${brandName || dictionary.brand} home`}
          >
            {liveSettings.logo ? (
              <Image
                src={liveSettings.logo}
                alt={brandName || dictionary.brand}
                width={620}
                height={150}
                priority
                unoptimized
                className="h-auto w-full object-contain"
              />
            ) : (
              <span className="font-editorial text-2xl font-semibold text-neutral-950">{brandName || dictionary.brand}</span>
            )}
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
            <span className="hidden text-sm font-medium text-neutral-950 lg:inline">
              United Arab Emirates |
            </span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              className="hidden h-10 border-0 bg-transparent px-1 text-sm font-medium text-neutral-950 sm:block"
              aria-label="Currency"
            >
              {currencyOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>

            <Link
              href={switchLocalePath(locale === "en" ? "ar" : "en")}
              onClick={() => persistLocale(locale === "en" ? "ar" : "en")}
              className="hidden h-10 shrink-0 items-center gap-2 px-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-50 sm:inline-flex"
            >
              <Globe2 size={17} />
              {locale === "en" ? "AR" : "EN"}
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className={iconButtonClass}
              aria-label={dictionary.nav.search}
            >
              <Search size={20} />
            </button>

            <Link
              href={`/${locale}/admin/dashboard`}
              prefetch={false}
              className={`hidden ${iconButtonClass} sm:grid`}
              aria-label={dictionary.nav.admin}
            >
              <LayoutDashboard size={18} />
            </Link>

            <Link
              href={`/${locale}/account`}
              className={`hidden ${iconButtonClass} sm:grid`}
              aria-label={dictionary.nav.account}
            >
              <User size={18} />
            </Link>

            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setNotificationsOpen((value) => !value)}
                className={`relative ${iconButtonClass}`}
                aria-label={locale === "ar" ? "Notifications" : "Notifications"}
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />
                {visibleNotifications.length > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
                    {visibleNotifications.length}
                  </span>
                ) : null}
              </button>
              {notificationsOpen ? (
                <div className="fixed left-4 right-4 top-[4.75rem] z-50 rounded-lg border border-neutral-200 bg-white p-3 text-left shadow-lift sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 rtl:text-right sm:rtl:left-0 sm:rtl:right-auto">
                  <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
                    <div>
                      <p className="text-sm font-bold text-navy">Notifications</p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        {visibleNotifications.length > 0
                          ? `${visibleNotifications.length} update${visibleNotifications.length === 1 ? "" : "s"} available`
                          : "You are all caught up"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-paper"
                      aria-label="Close notifications"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="mt-3 grid max-h-[60vh] gap-2 overflow-y-auto pr-1">
                    {visibleNotifications.length > 0 ? (
                      visibleNotifications.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 rounded-md border border-neutral-100 bg-paper p-3 transition hover:border-gold-200 hover:bg-gold-50"
                        >
                          <Link
                            href={item.href}
                            onClick={() => setNotificationsOpen(false)}
                            className="flex min-w-0 flex-1 items-start gap-3"
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-gold-700 shadow-soft">
                              {item.icon === "product" ? <PackagePlus size={17} /> : <Truck size={17} />}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-navy">{item.title}</p>
                                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-700">
                                  {item.icon === "product" ? "Product" : "Delivery"}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-neutral-500">
                                {item.detail}
                              </p>
                              {item.createdAt ? (
                                <time
                                  dateTime={item.createdAt}
                                  className="mt-1 block text-[11px] font-semibold text-neutral-400"
                                >
                                  {formatNotificationTimestamp(item.createdAt, locale)}
                                </time>
                              ) : null}
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => dismissNotification(item.id)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-400 hover:bg-white hover:text-sale"
                            aria-label="Dismiss notification"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-neutral-200 bg-paper p-4 text-center">
                        <p className="text-sm font-bold text-navy">No notifications</p>
                        <p className="mt-1 text-xs font-semibold text-neutral-500">
                          New products, delivery updates, and cart reminders will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href={`/${locale}/cart`}
              className="relative grid h-11 w-11 shrink-0 place-items-center text-neutral-950 transition hover:bg-neutral-100"
              aria-label={dictionary.nav.cart}
            >
              <ShoppingBag size={18} />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <nav className="hidden border-t border-[#e3e5dd] bg-[#f4f6ee] sm:block">
        <div className="mx-auto flex max-w-[1210px] flex-wrap items-center gap-x-7 gap-y-3 px-7 py-4 text-sm font-medium text-neutral-950 lg:px-8">
          {navItems.map((item, index) => (
            <Link key={item.href} href={item.href} className={index === 0 ? "underline underline-offset-4" : "hover:underline hover:underline-offset-4"}>
              {item.label}
            </Link>
          ))}
          {fashionLinks.slice(0, 9).map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline hover:underline-offset-4">
              <span className="sr-only">Collection: </span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {open ? (
        <div className="absolute inset-x-0 top-full z-50 h-[calc(100dvh-7rem)] overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/45"
            aria-label="Close category navigation"
          />
          <aside className="relative grid h-full w-[min(100%,430px)] content-start gap-0 overflow-y-auto bg-[#f6f8f1] px-0 py-0 text-neutral-950 shadow-lift sm:w-[32vw] sm:min-w-[340px]">
            <form onSubmit={submitSearch} className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={dictionary.nav.search}
                className="h-14 w-full rounded-none border-0 border-b border-neutral-200 bg-white pl-10 pr-3 text-base text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950 rtl:pl-3 rtl:pr-10"
              />
            </form>

            <div className="grid gap-0">
              <div className="grid gap-0">
                {fashionLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="border-b border-neutral-200 px-6 py-3.5 text-left text-lg font-medium text-neutral-950 transition hover:bg-white rtl:text-right"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {!fashionLinks.length ? <p className="px-6 py-4 text-sm text-neutral-500">Add active categories from Admin to show them here.</p> : null}

              <div className="grid gap-0 border-t border-neutral-200">
                {navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-neutral-200 px-6 py-3.5 text-base font-medium text-neutral-950 hover:bg-white">{item.label}</Link>)}
              </div>

              <Link
                href={`/${locale}/admin/dashboard`}
                prefetch={false}
                onClick={() => setOpen(false)}
                className={mobileLinkClass}
              >
                <span>{dictionary.nav.admin}</span>
                <LayoutDashboard size={17} />
              </Link>

              <Link
                href={switchLocalePath(locale === "en" ? "ar" : "en")}
                onClick={() => {
                  persistLocale(locale === "en" ? "ar" : "en");
                  setOpen(false);
                }}
                className={mobileLinkClass}
              >
                <span>{locale === "en" ? "Arabic" : "English"}</span>
                <Globe2 size={17} />
              </Link>

              <label className="grid gap-2 rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-navy sm:col-span-2">
                Currency
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                  className="h-10 rounded-md border border-neutral-200 bg-white px-2 text-xs font-bold text-navy"
                  aria-label="Currency"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
