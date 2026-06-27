"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useHydrated } from "@/hooks/useHydrated";
import type { Locale, ProductVariant } from "@/lib/types";
import { getDisplayName } from "@/lib/text-format";
import { type CartProductInput, useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";

type ProductCardPriceProps = {
  price: number;
  comparePrice?: number;
  locale: Locale;
};

type ProductCardAddButtonProps = {
  product: CartProductInput;
  variants: ProductVariant[];
  locale: Locale;
  addToCartLabel: string;
};

const purchaseCopy = {
  en: {
    addedToCart: (name: string) => `${name} added to cart`
  },
  ar: {
    addedToCart: (name: string) => `${name} added to cart`
  }
} satisfies Record<Locale, { addedToCart: (name: string) => string }>;

export function ProductCardPrice({ price, comparePrice, locale }: ProductCardPriceProps) {
  const hydrated = useHydrated();
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedCurrencyRates = usePreferencesStore((state) => state.currencyRates);
  const currency = hydrated ? storedCurrency : "AED";
  const currencyRates = hydrated ? storedCurrencyRates : defaultCurrencyRates;
  const hasComparePrice = typeof comparePrice === "number" && comparePrice > price;

  return (
    <div className="mt-1 flex min-h-8 flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
      {hasComparePrice ? (
        <p className="text-xs font-normal text-neutral-500 line-through sm:text-sm">
          {formatCurrency(comparePrice, currency, locale, currencyRates)}
        </p>
      ) : null}
      <p className="text-sm font-medium text-neutral-950 sm:text-base">
        {formatCurrency(price, currency, locale, currencyRates)}
      </p>
    </div>
  );
}

export function ProductCardAddButton({
  product,
  variants,
  locale,
  addToCartLabel
}: ProductCardAddButtonProps) {
  const labels = purchaseCopy[locale];
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const activeVariants = variants.filter((variant) => variant.isActive);
  const selectedVariant = activeVariants.find((variant) => variant.stock > 0) ?? activeVariants[0];
  const availableStock = selectedVariant?.stock ?? product.stock;

  const handleAdd = () => {
    setAdding(true);
    addItem(product, 1, selectedVariant);
    toast.success(labels.addedToCart(getDisplayName(product.name, locale)));
    window.setTimeout(() => setAdding(false), 650);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={availableStock <= 0 || adding}
      aria-label={addToCartLabel}
      title={addToCartLabel}
      className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-neutral-200 bg-white/95 text-neutral-950 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-400 hover:bg-white disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:translate-y-0 sm:right-3 sm:top-3 sm:h-9 sm:w-9 rtl:left-2 rtl:right-auto sm:rtl:left-3"
    >
      <ShoppingBag
        size={17}
        className={adding ? "scale-90 text-emerald-600 transition-transform" : "transition-transform"}
      />
      <span className="sr-only">
        {adding ? "Added" : addToCartLabel}
      </span>
    </button>
  );
}
