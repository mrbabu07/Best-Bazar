"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Globe2,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Settings,
  Tags,
  TicketPercent,
  Users,
  X
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { cn } from "@/utils/cn";

type AdminShellProps = {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
};

export function AdminShell({ children, locale, dictionary }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nextLocale = locale === "en" ? "ar" : "en";
  const switchLocalePath = pathname.replace(`/${locale}/`, `/${nextLocale}/`);

  const navItems = [
    { label: dictionary.admin.dashboard, href: `/${locale}/admin/dashboard`, icon: LayoutDashboard },
    { label: dictionary.admin.products, href: `/${locale}/admin/products`, icon: Package },
    { label: dictionary.admin.categories, href: `/${locale}/admin/categories`, icon: Tags },
    { label: dictionary.admin.orders, href: `/${locale}/admin/orders`, icon: Receipt },
    { label: dictionary.admin.users, href: `/${locale}/admin/users`, icon: Users },
    { label: dictionary.admin.coupons, href: `/${locale}/admin/coupons`, icon: TicketPercent },
    { label: dictionary.admin.settings, href: `/${locale}/admin/settings`, icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[280px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-gold-100 bg-navy text-white transition lg:static lg:block lg:w-auto rtl:left-auto rtl:right-0 rtl:border-l rtl:border-r-0",
          open ? "translate-x-0 rtl:translate-x-0" : "-translate-x-full lg:translate-x-0 rtl:translate-x-full lg:rtl:translate-x-0"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href={`/${locale}/admin/dashboard`} className="text-xl font-bold">
            {dictionary.brand}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-md border border-white/15 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="grid gap-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white",
                  active && "bg-gold-500 text-navy hover:bg-gold-400 hover:text-navy"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-40 bg-navy/45 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gold-100 bg-white/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm font-bold text-navy">
              <BarChart3 size={18} className="text-gold-700" />
              Admin Console
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={switchLocalePath}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-gold-200 px-3 text-xs font-bold text-navy hover:bg-gold-50"
            >
              <Globe2 size={16} />
              {nextLocale.toUpperCase()}
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-navy px-3 text-xs font-bold text-white hover:bg-neutral-800"
            >
              <Boxes size={16} />
              Storefront
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
