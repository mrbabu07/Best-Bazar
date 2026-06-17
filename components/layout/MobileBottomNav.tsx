"use client";

import Link from "next/link";
import { Heart, Home, ShoppingBag } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { useFavouriteStore } from "@/store/favourite-store";

type MobileBottomNavProps = {
  locale: Locale;
};

export function MobileBottomNav({ locale }: MobileBottomNavProps) {
  const hydrated = useHydrated();
  const cartCount = useCartStore((state) => state.totalItems());
  const favouriteCount = useFavouriteStore((state) => state.totalItems());
  const safeCartCount = hydrated ? cartCount : 0;
  const safeFavouriteCount = hydrated ? favouriteCount : 0;

  const items = [
    { href: `/${locale}`, label: "Home", icon: Home, count: 0 },
    { href: `/${locale}/favorites`, label: "Favourite", icon: Heart, count: safeFavouriteCount },
    { href: `/${locale}/cart`, label: "Cart", icon: ShoppingBag, count: safeCartCount }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-100 bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-lift backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative grid min-h-12 place-items-center rounded-md px-2 text-xs font-bold text-navy hover:bg-gold-50"
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
