"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Globe2, LayoutDashboard, Menu, Search, ShoppingBag, Truck, User, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { StorefrontFrameSettings } from "@/components/layout/AppFrame";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { currencyOptions, type CurrencyCode } from "@/utils/currency";
import { cn } from "@/utils/cn";
import { normalizeShippingSettings } from "@/utils/shipping";

type HeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
  settings: StorefrontFrameSettings;
};

export function Header({ locale, dictionary, settings }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [liveSettings, setLiveSettings] = useState(settings);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const storedCartCount = useCartStore((state) => state.totalItems());
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const setCurrency = usePreferencesStore((state) => state.setCurrency);
  const setStorefrontSettings = usePreferencesStore((state) => state.setStorefrontSettings);
  const cartCount = hydrated ? storedCartCount : 0;
  const currency = hydrated ? storedCurrency : "AED";

  const navItems = [
    { label: dictionary.nav.home, href: `/${locale}` },
    { label: dictionary.nav.shop, href: `/${locale}/shop` },
    { label: "Track order", href: `/${locale}/track-order` },
    { label: dictionary.nav.account, href: `/${locale}/account` }
  ];
  const brandName = locale === "ar" ? liveSettings.storeNameAr : liveSettings.storeNameEn;
  const announcement = locale === "ar" ? liveSettings.announcementAr : liveSettings.announcementEn;
  const dubaiRate =
    liveSettings.shippingSettings.shippingRates.find((rate) => rate.emirate.toLowerCase() === "dubai") ??
    liveSettings.shippingSettings.shippingRates[0];
  const freeShippingThreshold = liveSettings.shippingSettings.freeShippingThreshold;
  const dismissedStorageKey = `best-bazar-dismissed-notifications:${locale}`;
  const storefrontNotifications = [
    ...(liveSettings.announcementActive && announcement
      ? [
          {
            title: locale === "ar" ? "إعلان المتجر" : "Store announcement",
            id: `announcement:${announcement}`,
            detail: announcement,
            href: `/${locale}/shop`
          }
        ]
      : []),
    {
      title: locale === "ar" ? "توصيل دبي" : "Dubai delivery",
      id: `delivery:${dubaiRate?.emirate ?? "uae"}:${dubaiRate?.deliveryDays ?? "available"}`,
      detail: dubaiRate?.deliveryDays
        ? `${dubaiRate.emirate}: ${dubaiRate.deliveryDays} days`
        : locale === "ar"
          ? "توصيل داخل الإمارات"
          : "UAE delivery available",
      href: `/${locale}/checkout`
    },
    {
      title: locale === "ar" ? "توصيل مجاني" : "Free shipping",
      id: `free-shipping:${freeShippingThreshold}`,
      detail: `${locale === "ar" ? "فوق" : "Above"} AED ${freeShippingThreshold}`,
      href: `/${locale}/checkout`
    },
    ...(cartCount > 0
      ? [
          {
            title: locale === "ar" ? "السلة" : "Cart reminder",
            id: `cart:${cartCount}`,
            detail: `${cartCount} ${locale === "ar" ? "منتج في السلة" : "item ready in cart"}`,
            href: `/${locale}/cart`
          }
        ]
      : [])
  ];
  const visibleNotifications = storefrontNotifications.filter((item) => !dismissedNotifications.includes(item.id));

  useEffect(() => {
    setLiveSettings(settings);
  }, [settings]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(dismissedStorageKey) ?? "[]");
      setDismissedNotifications(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
    } catch {
      setDismissedNotifications([]);
    }
  }, [dismissedStorageKey]);

  useEffect(() => {
    let active = true;

    const refreshNotifications = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!active || !data) {
          return;
        }

        const shippingSettings = normalizeShippingSettings({
          freeShippingThreshold: data.freeShippingThreshold ?? settings.shippingSettings.freeShippingThreshold,
          shippingRates: data.shippingRates ?? settings.shippingSettings.shippingRates
        });
        const nextSettings = {
          ...settings,
          storeNameEn: data.storeNameEn ?? settings.storeNameEn,
          storeNameAr: data.storeNameAr ?? settings.storeNameAr,
          whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : settings.whatsapp,
          announcementEn: data.announcementEn ?? "",
          announcementAr: data.announcementAr ?? "",
          announcementActive: Boolean(data.announcementActive),
          shippingSettings
        };

        setLiveSettings(nextSettings);
        setStorefrontSettings({
          currencyRates: settings.currencyRates,
          shippingSettings: nextSettings.shippingSettings
        });
      } catch {
        // Keep the last known notification data when the live refresh fails.
      }
    };

    void refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [setStorefrontSettings, settings]);

  const switchLocalePath = (nextLocale: Locale) => {
    const segments = pathname.split("/");
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
    <header className="sticky top-0 z-50 border-b border-gold-100 bg-white/92 backdrop-blur-xl">
      {liveSettings.announcementActive && announcement ? (
        <div className="bg-navy px-4 py-2 text-center text-xs font-semibold text-white">
          {announcement}
        </div>
      ) : null}
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy lg:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href={`/${locale}`} className="shrink-0 text-2xl font-bold text-navy">
          {brandName || dictionary.brand}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.href.endsWith("/account") ? false : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-gold-50 hover:text-navy",
                (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
                  "bg-gold-50 text-navy"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
          <label className="relative w-full max-w-sm">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={dictionary.nav.search}
              className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm text-navy placeholder:text-neutral-400 focus:border-gold-400 rtl:pl-3 rtl:pr-10"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
            className="h-10 rounded-md border border-gold-200 bg-white px-2 text-xs font-bold text-navy"
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
            className="inline-flex h-10 items-center gap-2 rounded-md border border-gold-200 px-3 text-xs font-bold text-navy hover:bg-gold-50"
          >
            <Globe2 size={17} />
            {locale === "en" ? "AR" : "EN"}
          </Link>

          <Link
            href={`/${locale}/admin/dashboard`}
            prefetch={false}
            className="hidden h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50 sm:grid"
            aria-label={dictionary.nav.admin}
          >
            <LayoutDashboard size={18} />
          </Link>

          <Link
            href={`/${locale}/account`}
            prefetch={false}
            className="hidden h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50 sm:grid"
            aria-label={dictionary.nav.account}
          >
            <User size={18} />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              className="relative grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
              aria-label={locale === "ar" ? "الإشعارات" : "Notifications"}
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
              <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-neutral-200 bg-white p-3 text-left shadow-lift rtl:left-0 rtl:right-auto rtl:text-right">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2">
                  <p className="text-sm font-bold text-navy">{locale === "ar" ? "الإشعارات" : "Notifications"}</p>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-paper"
                    aria-label="Close notifications"
                  >
                    <X size={15} />
                  </button>
                </div>
                <div className="mt-2 grid gap-2">
                  {visibleNotifications.length > 0 ? (
                    visibleNotifications.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 rounded-md bg-paper p-3 transition hover:bg-gold-50"
                      >
                        <Link
                          href={item.href}
                          onClick={() => setNotificationsOpen(false)}
                          className="flex min-w-0 flex-1 items-start gap-2"
                        >
                          <Truck size={16} className="mt-0.5 shrink-0 text-gold-700" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-navy">{item.title}</p>
                            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{item.detail}</p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => dismissNotification(item.id)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-neutral-400 hover:bg-white hover:text-sale"
                          aria-label="Dismiss notification"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-md bg-paper p-3 text-sm font-semibold text-neutral-500">No notifications</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href={`/${locale}/cart`}
            className="relative grid h-10 w-10 place-items-center rounded-md bg-navy text-white hover:bg-neutral-800"
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

      {open ? (
        <div className="border-t border-gold-100 bg-white px-4 py-4 lg:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.href.endsWith("/account") ? false : undefined}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-semibold text-navy hover:bg-gold-50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/admin/dashboard`}
              prefetch={false}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-semibold text-navy hover:bg-gold-50"
            >
              {dictionary.nav.admin}
            </Link>
            <button
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              className="flex items-center justify-between rounded-md px-3 py-3 text-sm font-semibold text-navy hover:bg-gold-50"
            >
              <span>{locale === "ar" ? "الإشعارات" : "Notifications"}</span>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
                {visibleNotifications.length}
              </span>
            </button>
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
                className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm text-navy placeholder:text-neutral-400 focus:border-gold-400 rtl:pl-3 rtl:pr-10"
              />
            </form>
          </div>
        </div>
      ) : null}
    </header>
  );
}
