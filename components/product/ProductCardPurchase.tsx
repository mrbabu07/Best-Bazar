"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { getLocalized } from "@/lib/i18n";
import type { Locale, ProductVariant } from "@/lib/types";
import { useHydrated } from "@/hooks/useHydrated";
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
    addedToCart: (name: string) => `ØªÙ…Øª Ø¥Ø¶Ø§ÙØ© ${name} Ø¥Ù„Ù‰ Ø§Ù„Ø³Ù„Ø©`
  }
} satisfies Record<Locale, { addedToCart: (name: string) => string }>;

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
  const defaultVariant = variants.find((variant) => variant.stock > 0);
  const availableStock = defaultVariant?.stock ?? product.stock;

  const handleAdd = () => {
    setAdding(true);
    addItem(product, 1, defaultVariant);
    toast.success(labels.addedToCart(getLocalized(product.name, locale)));
    window.setTimeout(() => setAdding(false), 650);
  };

  return (
    <Button
      className="mt-auto h-10 w-full px-2 text-xs sm:h-11 sm:px-5 sm:text-sm"
      onClick={handleAdd}
      disabled={availableStock <= 0 || adding}
      variant={availableStock <= 0 ? "secondary" : "primary"}
    >
      <ShoppingBag size={17} />
      {adding ? "Added" : addToCartLabel}
    </Button>
  );
}
