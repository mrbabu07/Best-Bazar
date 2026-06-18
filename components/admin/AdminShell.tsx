"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  Globe2,
  Home,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
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
  notifications?: {
    pendingOrders: number;
    pendingReviews: number;
    lowStockProducts: number;
  };
};

export function AdminShell({
  children,
  locale,
  dictionary,
  adminName = "Admin",
  notifications = { pendingOrders: 0, pendingReviews: 0, lowStockProducts: 0 }
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nextLocale = locale === "en" ? "ar" : "en";
  const currentPathname = pathname ?? `/${locale}/admin/dashboard`;
  const switchLocalePath = currentPathname.replace(new RegExp(`^/${locale}`), `/${nextLocale}`);
  const totalNotifications =
    notifications.pendingOrders + notifications.pendingReviews + notifications.lowStockProducts;
  const formatCount = (count: number) => (count > 99 ? "99+" : String(count));
  const shouldLinkPrefetch = process.env.NODE_ENV === "production";
  const prefetchRoute = (href: string) => {
    const route = href.split("#")[0];

    if (route && route !== currentPathname) {
      router.prefetch(route);
    }
  };

  const navGroups = [
    {
      title: "Overview",
      description: "Dashboard",
      items: [
        {
          label: dictionary.admin.dashboard,
          href: `/${locale}/admin/dashboard`,
          icon: LayoutDashboard,
          description: "Sales, orders, stock"
        },
        {
          label: "Notifications",
          href: `/${locale}/admin/dashboard#notifications`,
          icon: Bell,
          description: "Needs attention",
          count: totalNotifications
        }
      ]
    },
    {
      title: "Sales",
      description: "Orders",
      items: [
        {
          label: dictionary.admin.orders,
          href: `/${locale}/admin/orders`,
          icon: Receipt,
          description: "Status, invoice, print",
          count: notifications.pendingOrders
        }
      ]
    },
    {
      title: "Catalog",
      description: "Products",
      items: [
        {
          label: dictionary.admin.products,
          href: `/${locale}/admin/products`,
          icon: Package,
          description: "Manage products",
          count: notifications.lowStockProducts
        },
        {
          label: "Add product",
          href: `/${locale}/admin/products/new`,
          icon: Plus,
          description: "Create product",
        },
        {
          label: dictionary.admin.categories,
          href: `/${locale}/admin/categories`,
          icon: Tags,
          description: "Categories and sizes"
        }
      ]
    },
    {
      title: "Customers",
      description: "Users",
      items: [
        {
          label: dictionary.admin.users,
          href: `/${locale}/admin/users`,
          icon: Users,
          description: "Accounts and roles"
        },
        {
          label: dictionary.admin.reviews,
          href: `/${locale}/admin/reviews`,
          icon: Star,
          description: "Approve reviews",
          count: notifications.pendingReviews
        },
        {
          label: dictionary.admin.coupons,
          href: `/${locale}/admin/coupons`,
          icon: TicketPercent,
          description: "Discount codes"
        }
      ]
    },
    {
      title: "Storefront",
      description: "Site",
      items: [
        {
          label: "Banners",
          href: `/${locale}/admin/banners`,
          icon: ImagePlus,
          description: "Hero and campaigns"
        },
        {
          label: dictionary.admin.settings,
          href: `/${locale}/admin/settings`,
          icon: Settings,
          description: "Footer, payments, UI"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[292px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-gold-100 bg-navy text-white shadow-lift transition lg:static lg:w-auto lg:shadow-none rtl:left-auto rtl:right-0 rtl:border-l rtl:border-r-0",
          open ? "translate-x-0 rtl:translate-x-0" : "-translate-x-full lg:translate-x-0 rtl:translate-x-full lg:rtl:translate-x-0"
        )}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/${locale}/admin/dashboard`} className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-gold-400 text-base font-black text-navy">
                BB
              </span>
              <span className="min-w-0">
                <span className="croissant-one-regular block truncate text-lg leading-5">{dictionary.brand}</span>
                <span className="mt-1 block truncate text-xs font-semibold text-gold-100">Admin control panel</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-navy">
              {adminName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{adminName}</p>
              <p className="text-xs font-semibold text-white/50">Signed in as admin</p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 px-3 py-3">
          <Link
            href={`/${locale}/admin/dashboard#notifications`}
            prefetch={shouldLinkPrefetch}
            onMouseEnter={() => prefetchRoute(`/${locale}/admin/dashboard#notifications`)}
            onFocus={() => prefetchRoute(`/${locale}/admin/dashboard#notifications`)}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-3 rounded-md border border-gold-200 bg-white px-3 py-2.5 text-sm font-bold text-navy transition hover:bg-gold-50"
          >
            <span className="inline-flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gold-100 text-gold-800">
                <Bell size={17} />
              </span>
              <span className="min-w-0">
                <span className="block truncate">Action center</span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold text-neutral-500">
                  Orders, stock, and reviews
                </span>
              </span>
            </span>
            {totalNotifications > 0 ? (
              <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-sale px-1 text-xs font-black text-white">
                {formatCount(totalNotifications)}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">Clear</span>
            )}
          </Link>

          <Link
            href={`/${locale}`}
            prefetch={shouldLinkPrefetch}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Home size={18} />
            <span className="min-w-0 flex-1 truncate">Storefront</span>
            <ChevronRight size={15} className="text-white/50" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="grid gap-2">
            {navGroups.map((group) => (
              <section key={group.title} className="rounded-md border border-white/10 bg-white/[0.035] p-2">
                <div className="flex items-center justify-between gap-3 px-2 pb-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-gold-200">{group.title}</p>
                  </div>
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold text-white/55">
                    {group.items.length}
                  </span>
                </div>

                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const itemPath = item.href.split(/[?#]/)[0];
                    const active = currentPathname === itemPath || currentPathname.startsWith(`${itemPath}/`);
                    const Icon = item.icon;
                    const count = "count" in item ? item.count ?? 0 : 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={shouldLinkPrefetch}
                        onMouseEnter={() => prefetchRoute(item.href)}
                        onFocus={() => prefetchRoute(item.href)}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-white/76 transition hover:bg-white/10 hover:text-white",
                          active && "bg-white text-navy shadow-soft hover:bg-white hover:text-navy"
                        )}
                      >
                        {active ? <span className="absolute left-0 top-2 h-9 w-1 rounded-r-full bg-gold-500 rtl:left-auto rtl:right-0 rtl:rounded-l-full rtl:rounded-r-none" /> : null}
                        <span
                          className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/8 text-gold-200 transition",
                            active && "bg-gold-100 text-gold-800"
                          )}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold">{item.label}</span>
                            {count > 0 ? (
                              <span
                                className={cn(
                                  "grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[10px] font-bold",
                                  active ? "bg-sale text-white" : "bg-sale text-white"
                                )}
                              >
                                {formatCount(count)}
                              </span>
                            ) : null}
                          </span>
                          <span className={cn("mt-0.5 block truncate text-[11px] font-semibold text-white/45", active && "text-neutral-500")}>
                            {item.description}
                          </span>
                        </span>
                        <ChevronRight
                          size={14}
                          className={cn("shrink-0 text-white/35 transition group-hover:translate-x-0.5", active && "text-gold-700")}
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
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
            <Link
              href={`/${locale}/admin/dashboard#notifications`}
              prefetch={shouldLinkPrefetch}
              onMouseEnter={() => prefetchRoute(`/${locale}/admin/dashboard#notifications`)}
              onFocus={() => prefetchRoute(`/${locale}/admin/dashboard#notifications`)}
              className="relative inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gold-200 px-3 text-navy hover:bg-gold-50"
              aria-label={`Notifications: ${totalNotifications} total alerts`}
            >
              <Bell size={17} />
              <span className="hidden text-xs font-bold xl:inline">Notifications</span>
              {totalNotifications > 0 ? (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">
                  {formatCount(totalNotifications)}
                </span>
              ) : null}
            </Link>
            <Link
              href={switchLocalePath}
              prefetch={shouldLinkPrefetch}
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
              prefetch={shouldLinkPrefetch}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-navy px-3 text-xs font-bold text-white hover:bg-neutral-800"
            >
              <Boxes size={16} />
              <span className="hidden sm:inline">Storefront</span>
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
