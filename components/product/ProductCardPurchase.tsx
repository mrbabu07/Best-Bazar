"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useHydrated } from "@/hooks/useHydrated";
import { getLocalized } from "@/lib/i18n";
import type { Locale, ProductVariant } from "@/lib/types";
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
    addedToCart: (name: string) => `${name} added to cart`,
    size: "Size"
  },
  ar: {
    addedToCart: (name: string) => `${name} added to cart`,
    size: "Size"
  }
} satisfies Record<Locale, { addedToCart: (name: string) => string; size: string }>;

function getSizeKey(variant?: ProductVariant) {
  return variant?.sizeKey || variant?.sizeName?.en.trim().toLowerCase() || "";
}

function uniqueSizeVariants(variants: ProductVariant[]) {
  return variants.reduce<ProductVariant[]>((items, variant) => {
    const key = getSizeKey(variant);

    if (!key) {
      return items;
    }

    return items.some((item) => getSizeKey(item) === key) ? items : [...items, variant];
  }, []);
}

function stockForSize(variants: ProductVariant[], key: string) {
  return variants
    .filter((variant) => variant.isActive && getSizeKey(variant) === key)
    .reduce((total, variant) => total + Math.max(0, variant.stock), 0);
}

export function ProductCardPrice({ price, comparePrice, locale }: ProductCardPriceProps) {
  const hydrated = useHydrated();
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedCurrencyRates = usePreferencesStore((state) => state.currencyRates);
  const currency = hydrated ? storedCurrency : "AED";
  const currencyRates = hydrated ? storedCurrencyRates : defaultCurrencyRates;

  return (
    <div className="mt-1.5 flex min-h-7 flex-wrap items-end gap-x-2 gap-y-1">
      <p className="text-base font-bold text-navy sm:text-lg">
        {formatCurrency(price, currency, locale, currencyRates)}
      </p>
      {comparePrice ? (
        <p className="text-xs text-neutral-400 line-through sm:text-sm">
          {formatCurrency(comparePrice, currency, locale, currencyRates)}
        </p>
      ) : null}
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
  const sizeOptions = uniqueSizeVariants(activeVariants);
  const hasSizes = sizeOptions.length > 0;
  const firstAvailableSize = sizeOptions.find((variant) => stockForSize(activeVariants, getSizeKey(variant)) > 0);
  const [selectedSizeKey, setSelectedSizeKey] = useState(
    getSizeKey(firstAvailableSize ?? sizeOptions[0] ?? activeVariants[0])
  );
  const selectedVariant = hasSizes
    ? activeVariants.find((variant) => getSizeKey(variant) === selectedSizeKey && variant.stock > 0) ??
      activeVariants.find((variant) => getSizeKey(variant) === selectedSizeKey)
    : activeVariants.find((variant) => variant.stock > 0);
  const availableStock = hasSizes
    ? stockForSize(activeVariants, selectedSizeKey)
    : selectedVariant?.stock ?? product.stock;

  const handleAdd = () => {
    setAdding(true);
    addItem(product, 1, selectedVariant);
    toast.success(labels.addedToCart(getLocalized(product.name, locale)));
    window.setTimeout(() => setAdding(false), 650);
  };

  return (
    <div className="mt-auto grid gap-2">
      {hasSizes ? (
        <label className="grid gap-1 text-[11px] font-bold text-neutral-500">
          {labels.size}
          <select
            value={selectedSizeKey}
            onChange={(event) => setSelectedSizeKey(event.target.value)}
            className="h-9 w-full rounded-md border border-neutral-200 bg-paper px-2 text-xs font-bold text-navy"
          >
            {sizeOptions.map((variant) => {
              const key = getSizeKey(variant);
              const stock = stockForSize(activeVariants, key);

              return (
                <option key={key} value={key} disabled={stock <= 0}>
                  {getLocalized(variant.sizeName ?? variant.name, locale)} - {stock} pcs
                </option>
              );
            })}
          </select>
        </label>
      ) : null}

      <Button
        className="h-10 w-full px-2 text-xs sm:h-11 sm:px-5 sm:text-sm"
        onClick={handleAdd}
        disabled={availableStock <= 0 || adding}
        variant={availableStock <= 0 ? "secondary" : "primary"}
      >
        <ShoppingBag size={17} />
        {adding ? "Added" : addToCartLabel}
      </Button>
    </div>
  );
}
