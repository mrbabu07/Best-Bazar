"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [open, setOpen] = useState(false);
  const nextLocale = locale === "en" ? "ar" : "en";
  const switchLocalePath = pathname.replace(new RegExp(`^/${locale}`), `/${nextLocale}`);
  const totalNotifications =
    notifications.pendingOrders + notifications.pendingReviews + notifications.lowStockProducts;
  const formatCount = (count: number) => (count > 99 ? "99+" : String(count));

  const navGroups = [
    {
      title: "Overview",
      description: "Daily snapshot",
      items: [
        {
          label: dictionary.admin.dashboard,
          href: `/${locale}/admin/dashboard`,
          icon: LayoutDashboard,
          description: "Revenue, orders, stock, and recent activity"
        },
        {
          label: "Notifications",
          href: `/${locale}/admin/dashboard#notifications`,
          icon: Bell,
          description: "Pending orders, low stock, and reviews",
          count: totalNotifications
        }
      ]
    },
    {
      title: "Orders and fulfillment",
      description: "Confirm, deliver, print",
      items: [
        {
          label: dictionary.admin.orders,
          href: `/${locale}/admin/orders`,
          icon: Receipt,
          description: "Payment status, delivery status, invoices",
          count: notifications.pendingOrders
        }
      ]
    },
    {
      title: "Catalog setup",
      description: "Products, sizes, stock",
      items: [
        {
          label: dictionary.admin.products,
          href: `/${locale}/admin/products`,
          icon: Package,
          description: "Variants, images, prices, stock, SEO",
          count: notifications.lowStockProducts
        },
        {
          label: "Add product",
          href: `/${locale}/admin/products/new`,
          icon: Plus,
          description: "Color, size, stock, category rules"
        },
        {
          label: dictionary.admin.categories,
          href: `/${locale}/admin/categories`,
          icon: Tags,
          description: "Category tree, product types, size options"
        }
      ]
    },
    {
      title: "Customers and growth",
      description: "People, reviews, offers",
      items: [
        {
          label: dictionary.admin.users,
          href: `/${locale}/admin/users`,
          icon: Users,
          description: "Customers, admin roles, account status"
        },
        {
          label: dictionary.admin.reviews,
          href: `/${locale}/admin/reviews`,
          icon: Star,
          description: "Approve, hide, delete, search",
          count: notifications.pendingReviews
        },
        {
          label: dictionary.admin.coupons,
          href: `/${locale}/admin/coupons`,
          icon: TicketPercent,
          description: "Discounts, expiry, usage limits"
        }
      ]
    },
    {
      title: "Storefront and business",
      description: "Homepage, payments, UI",
      items: [
        {
          label: "Banners",
          href: `/${locale}/admin/banners`,
          icon: ImagePlus,
          description: "Hero slides, campaign images, CTA links"
        },
        {
          label: dictionary.admin.settings,
          href: `/${locale}/admin/settings`,
          icon: Settings,
          description: "Payments, shipping, VAT/TRN, theme"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[320px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 border-r border-gold-100 bg-navy text-white transition lg:static lg:block lg:w-auto rtl:left-auto rtl:right-0 rtl:border-l rtl:border-r-0",
          open ? "translate-x-0 rtl:translate-x-0" : "-translate-x-full lg:translate-x-0 rtl:translate-x-full lg:rtl:translate-x-0"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href={`/${locale}/admin/dashboard`} className="min-w-0">
            <span className="block truncate text-xl font-bold">{dictionary.brand}</span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">
              Admin Console
            </span>
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

        <nav className="h-[calc(100vh-5rem)] overflow-y-auto px-3 py-4">
          <Link
            href={`/${locale}`}
            onClick={() => setOpen(false)}
            className="mb-4 flex items-center gap-3 rounded-md border border-white/15 bg-white/8 px-3 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Home size={18} />
            <span className="min-w-0 flex-1 truncate">Storefront</span>
            <ChevronRight size={15} className="text-white/50" />
          </Link>

          <div className="grid gap-4">
            {navGroups.map((group) => (
              <section key={group.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
                <div className="px-2 pb-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-200">{group.title}</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-white/42">{group.description}</p>
                </div>

                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const itemPath = item.href.split(/[?#]/)[0];
                    const active = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
                    const Icon = item.icon;
                    const count = "count" in item ? item.count ?? 0 : 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex items-start gap-3 rounded-md px-3 py-2.5 text-white/72 transition hover:bg-white/10 hover:text-white",
                          active && "bg-gold-500 text-navy shadow-soft hover:bg-gold-400 hover:text-navy"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/8 text-gold-200",
                            active && "bg-navy/10 text-navy"
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
                                  active ? "bg-navy text-white" : "bg-sale text-white"
                                )}
                              >
                                {formatCount(count)}
                              </span>
                            ) : null}
                          </span>
                          <span className={cn("mt-0.5 block truncate text-[11px] font-semibold text-white/42", active && "text-navy/65")}>
                            {item.description}
                          </span>
                        </span>
                        <ChevronRight
                          size={15}
                          className={cn("mt-2 shrink-0 text-white/35 transition group-hover:translate-x-0.5", active && "text-navy/55")}
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
