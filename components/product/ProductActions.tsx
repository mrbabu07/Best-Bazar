"use client";

import { Heart, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { useFavouriteStore } from "@/store/favourite-store";
import { cn } from "@/utils/cn";

type ProductActionInput = Pick<Product, "id" | "slug" | "name" | "images" | "price" | "brand">;

type ProductActionsProps = {
  product: ProductActionInput;
  locale: Locale;
  compact?: boolean;
};

export function FavouriteButton({ product, compact = false }: ProductActionsProps) {
  const hydrated = useHydrated();
  const toggle = useFavouriteStore((state) => state.toggle);
  const isFavourite = useFavouriteStore((state) => state.has(product.id));

  const handleClick = () => {
    toggle(product);
    toast.success(isFavourite ? "Removed from favourites" : "Added to favourites");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={hydrated && isFavourite}
      aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white font-bold text-navy shadow-sm transition hover:border-gold-300 hover:bg-gold-50",
        compact ? "h-9 w-9" : "h-12 px-4 text-sm",
        hydrated && isFavourite && "border-red-100 bg-red-50 text-sale"
      )}
    >
      <Heart size={compact ? 17 : 18} className={hydrated && isFavourite ? "fill-current" : ""} />
      {compact ? null : <span>{hydrated && isFavourite ? "Saved" : "Favourite"}</span>}
    </button>
  );
}

export function ShareProductButton({ product, locale, compact = false }: ProductActionsProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/product/${product.slug}`;
    const title = getLocalized(product.name, locale);

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied");
      }
    } catch {
      // User cancelled share sheet.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share product"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white font-bold text-navy shadow-sm transition hover:border-gold-300 hover:bg-gold-50",
        compact ? "h-9 w-9" : "h-12 px-4 text-sm"
      )}
    >
      <Share2 size={compact ? 17 : 18} />
      {compact ? null : <span>Share</span>}
    </button>
  );
}
