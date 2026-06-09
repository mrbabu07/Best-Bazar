"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, LayoutDashboard, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { currencyOptions, type CurrencyCode } from "@/utils/currency";
import { cn } from "@/utils/cn";

type HeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function Header({ locale, dictionary }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cartCount = useCartStore((state) => state.totalItems());
  const currency = usePreferencesStore((state) => state.currency);
  const setCurrency = usePreferencesStore((state) => state.setCurrency);

  const navItems = [
    { label: dictionary.nav.home, href: `/${locale}` },
    { label: dictionary.nav.shop, href: `/${locale}/shop` },
    { label: dictionary.nav.account, href: `/${locale}/account` }
  ];

  const switchLocalePath = (nextLocale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  };

  const persistLocale = (nextLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gold-100 bg-white/92 backdrop-blur-xl">
      <div className="bg-navy px-4 py-2 text-center text-xs font-semibold text-white">
        {dictionary.announcement}
      </div>
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
          {dictionary.brand}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
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

        <div className="ml-auto hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
          <label className="relative w-full max-w-sm">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3"
            />
            <input
              type="search"
              placeholder={dictionary.nav.search}
              className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm text-navy placeholder:text-neutral-400 focus:border-gold-400 rtl:pl-3 rtl:pr-10"
            />
          </label>
        </div>

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
            className="hidden h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50 sm:grid"
            aria-label={dictionary.nav.admin}
          >
            <LayoutDashboard size={18} />
          </Link>

          <Link
            href={`/${locale}/account`}
            className="hidden h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50 sm:grid"
            aria-label={dictionary.nav.account}
          >
            <User size={18} />
          </Link>

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
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-semibold text-navy hover:bg-gold-50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/admin/dashboard`}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-semibold text-navy hover:bg-gold-50"
            >
              {dictionary.nav.admin}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
