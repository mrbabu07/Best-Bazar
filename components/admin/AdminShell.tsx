"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Bell,
  Boxes,
  Globe2,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  Star,
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
  adminName?: string;
  pendingOrders?: number;
};

export function AdminShell({
  children,
  locale,
  dictionary,
  adminName = "Admin",
  pendingOrders = 0
}: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nextLocale = locale === "en" ? "ar" : "en";
  const switchLocalePath = pathname.replace(new RegExp(`^/${locale}`), `/${nextLocale}`);
  const bannersLabel = locale === "ar" ? "البانرات" : "Banners";

  const navItems = [
    { label: dictionary.admin.dashboard, href: `/${locale}/admin/dashboard`, icon: LayoutDashboard },
    { label: dictionary.admin.categories, href: `/${locale}/admin/categories`, icon: Tags },
    { label: dictionary.admin.products, href: `/${locale}/admin/products`, icon: Package },
    { label: dictionary.admin.orders, href: `/${locale}/admin/orders`, icon: Receipt },
    { label: dictionary.admin.users, href: `/${locale}/admin/users`, icon: Users },
    { label: dictionary.admin.reviews, href: `/${locale}/admin/reviews`, icon: Star },
    { label: dictionary.admin.coupons, href: `/${locale}/admin/coupons`, icon: TicketPercent },
    { label: bannersLabel, href: `/${locale}/admin/banners`, icon: ImagePlus },
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-gold-100 bg-white/92 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
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
              <span className="hidden sm:inline">Admin Console</span>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-md border border-gold-200 text-navy hover:bg-gold-50"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {pendingOrders > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
                  {pendingOrders}
                </span>
              ) : null}
            </button>
            <Link
              href={switchLocalePath}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-gold-200 px-3 text-xs font-bold text-navy hover:bg-gold-50"
            >
              <Globe2 size={16} />
              {nextLocale.toUpperCase()}
            </Link>
            <div className="hidden min-w-0 items-center gap-3 rounded-md border border-neutral-200 bg-paper px-3 py-1.5 md:flex">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-100 text-xs font-bold text-navy">
                {adminName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy">{adminName}</p>
                <p className="text-xs font-semibold text-neutral-500">Admin</p>
              </div>
            </div>
            <Link
              href={`/${locale}`}
              className="hidden h-10 items-center gap-2 rounded-md bg-navy px-3 text-xs font-bold text-white hover:bg-neutral-800 sm:inline-flex"
            >
              <Boxes size={16} />
              <span className="hidden lg:inline">Storefront</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-red-100 px-3 text-xs font-bold text-sale hover:bg-red-50"
            >
              <LogOut size={16} />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
