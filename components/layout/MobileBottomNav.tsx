"use client";

import Link from "next/link";
import { Heart, Home, Search, User } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { useFavouriteStore } from "@/store/favourite-store";

type MobileBottomNavProps = {
  locale: Locale;
};

export function MobileBottomNav({ locale }: MobileBottomNavProps) {
  const hydrated = useHydrated();
  const favouriteCount = useFavouriteStore((state) => state.totalItems());
  const safeFavouriteCount = hydrated ? favouriteCount : 0;

  const items = [
    { href: `/${locale}`, label: "Home", icon: Home, count: 0 },
    { href: `/${locale}/shop`, label: "Shop", icon: Search, count: 0 },
    { href: `/${locale}/favorites`, label: "Favourite", icon: Heart, count: safeFavouriteCount },
    { href: `/${locale}/account`, label: "Account", icon: User, count: 0 }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gold-100 bg-white px-2 pb-[max(env(safe-area-inset-bottom),0.55rem)] pt-2 shadow-lift lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative grid min-h-12 place-items-center rounded-md px-1 text-[11px] font-bold text-navy hover:bg-gold-50"
            >
              <span className="relative">
                <Icon size={20} />
                {item.count > 0 ? (
                  <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1 text-[9px] font-black text-white">
                    {item.count > 9 ? "9+" : item.count}
                  </span>
                ) : null}
              </span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
