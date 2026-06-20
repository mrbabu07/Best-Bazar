"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Globe2,
  LayoutDashboard,
  Menu,
  Moon,
  PackagePlus,
  Search,
  ShoppingBag,
  Sun,
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
import { cn } from "@/utils/cn";
import { currencyOptions, type CurrencyCode } from "@/utils/currency";
import { normalizeShippingSettings } from "@/utils/shipping";

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
  const storedCartCount = useCartStore((state) => state.totalItems());
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedColorMode = usePreferencesStore((state) => state.colorMode);
  const setCurrency = usePreferencesStore((state) => state.setCurrency);
  const toggleColorMode = usePreferencesStore((state) => state.toggleColorMode);
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);
  const cartCount = hydrated ? storedCartCount : 0;
  const currency = hydrated ? storedCurrency : "AED";
  const colorMode = hydrated ? storedColorMode : "light";

  const navItems = [
    { label: dictionary.nav.home, href: `/${locale}` },
    { label: dictionary.nav.shop, href: `/${locale}/shop` },
    { label: dictionary.nav.account, href: `/${locale}/account` }
  ];
  const fashionLinks = [
    { label: locale === "ar" ? "عبايات" : "Abayas", href: `/${locale}/shop?search=abaya` },
    { label: locale === "ar" ? "حجاب" : "Hijab", href: `/${locale}/shop?search=hijab` },
    { label: locale === "ar" ? "نقاب" : "Niqab", href: `/${locale}/shop?search=niqab` },
    { label: locale === "ar" ? "فساتين صلاة" : "Prayer Dress", href: `/${locale}/shop?search=prayer` },
    { label: locale === "ar" ? "ملابس سفر" : "Travel Wear", href: `/${locale}/shop?search=travel` },
    { label: locale === "ar" ? "الأطقم" : "Sets", href: `/${locale}/shop?search=set` }
  ];
  const brandName = locale === "ar" ? liveSettings.storeNameAr : liveSettings.storeNameEn;
  const announcement = locale === "ar" ? liveSettings.announcementAr : liveSettings.announcementEn;
  const dubaiRate =
    liveSettings.shippingSettings.shippingRates.find((rate) => rate.emirate.toLowerCase() === "dubai") ??
    liveSettings.shippingSettings.shippingRates[0];
  const freeShippingThreshold = liveSettings.shippingSettings.freeShippingThreshold;
  const dismissedStorageKey = `best-mart-dismissed-notifications:${locale}`;
  const storefrontNotifications = [
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
        icon: "product" as const
      };
    }),
    {
      title: locale === "ar" ? "Dubai delivery" : "Dubai delivery",
      id: `delivery:${dubaiRate?.emirate ?? "uae"}:${dubaiRate?.deliveryDays ?? "available"}`,
      detail: dubaiRate?.deliveryDays ? `${dubaiRate.emirate}: ${dubaiRate.deliveryDays} days` : "UAE delivery available",
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
  const activeLinkClass = "bg-neutral-100 text-navy";
  const iconButtonClass =
    "grid h-10 w-10 shrink-0 place-items-center rounded-md border border-neutral-200 text-navy transition hover:border-neutral-300 hover:bg-neutral-50";
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
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
      {liveSettings.announcementActive && announcement ? (
        <div className="bg-neutral-950 px-4 py-2 text-center text-xs font-semibold leading-5 tracking-wide text-white">
          {announcement}
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-2 py-3 lg:min-h-[4.75rem] lg:gap-4">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`${iconButtonClass} lg:hidden`}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link
            href={`/${locale}`}
            onClick={() => setOpen(false)}
            className="croissant-one-regular min-w-0 max-w-[44vw] shrink truncate text-2xl text-navy sm:max-w-none sm:text-3xl"
          >
            {brandName || dictionary.brand}
          </Link>

          <nav className="hidden shrink-0 items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = currentPathname === item.href || currentPathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-bold text-neutral-600 transition hover:bg-neutral-50 hover:text-navy xl:px-4",
                    active && activeLinkClass
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden min-w-[180px] flex-1 justify-end md:flex">
            <label className="relative w-full max-w-xs xl:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={dictionary.nav.search}
                className="h-11 w-full rounded-md border border-neutral-200 bg-white pl-10 pr-3 text-sm text-navy placeholder:text-neutral-400 focus:border-neutral-500 rtl:pl-3 rtl:pr-10"
              />
            </label>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0 lg:gap-2">
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              className="hidden h-10 rounded-md border border-neutral-200 bg-white px-2 text-xs font-bold text-navy sm:block"
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
              className="hidden h-10 shrink-0 items-center gap-2 rounded-md border border-neutral-200 px-3 text-xs font-bold text-navy transition hover:bg-neutral-50 sm:inline-flex"
            >
              <Globe2 size={17} />
              {locale === "en" ? "AR" : "EN"}
            </Link>

            <button
              type="button"
              onClick={toggleColorMode}
              className={iconButtonClass}
              aria-label={colorMode === "dark" ? "Use light mode" : "Use dark mode"}
            >
              {colorMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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

            <div className="relative">
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
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-md bg-navy text-white transition hover:bg-neutral-800"
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

      <div className="hidden border-t border-neutral-100 bg-white lg:block">
        <nav className="mx-auto flex max-w-7xl items-center justify-center gap-7 overflow-x-auto px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-600">
          {fashionLinks.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition hover:text-navy">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {open ? (
        <div className="border-t border-neutral-200 bg-white lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:px-6">
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
                className="h-11 w-full rounded-md border border-neutral-200 bg-white pl-10 pr-3 text-sm text-navy placeholder:text-neutral-400 focus:border-neutral-500 rtl:pl-3 rtl:pr-10"
              />
            </form>

            <div className="grid gap-2 sm:grid-cols-2">
              {navItems.map((item) => {
                const active = currentPathname === item.href || currentPathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(mobileLinkClass, active && activeLinkClass)}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
                {fashionLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-neutral-600"
                  >
                    {item.label}
                  </Link>
                ))}
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

              <button type="button" onClick={toggleColorMode} className={mobileLinkClass}>
                <span>{colorMode === "dark" ? "Light mode" : "Dark mode"}</span>
                {colorMode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>

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
          </div>
        </div>
      ) : null}
    </header>
  );
}
