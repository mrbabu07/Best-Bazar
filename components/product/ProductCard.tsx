"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ProductCardProps = {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
};

const cardCopy = {
  en: {
    addedToCart: (name: string) => `${name} added to cart`
  },
  ar: {
    addedToCart: (name: string) => `تمت إضافة ${name} إلى السلة`
  }
} satisfies Record<Locale, { addedToCart: (name: string) => string }>;

export function ProductCard({ product, locale, dictionary }: ProductCardProps) {
  const labels = cardCopy[locale];
  const colorLabel = locale === "ar" ? "الألوان" : "Colors";
  const hydrated = useHydrated();
  const addItem = useCartStore((state) => state.addItem);
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedCurrencyRates = usePreferencesStore((state) => state.currencyRates);
  const currency = hydrated ? storedCurrency : "AED";
  const currencyRates = hydrated ? storedCurrencyRates : defaultCurrencyRates;
  const hasSale = product.comparePrice && product.comparePrice > product.price;
  const defaultVariant = product.variants.find((variant) => variant.stock > 0);
  const availableStock = defaultVariant?.stock ?? product.stock;

  const handleAdd = () => {
    addItem(product, 1, defaultVariant);
    toast.success(labels.addedToCart(getLocalized(product.name, locale)));
  };

  return (
    <article className="group flex h-[386px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift sm:h-[470px] lg:h-[500px]">
      <Link href={`/${locale}/product/${product.slug}`} className="relative block h-[174px] shrink-0 bg-neutral-100 sm:h-[260px] lg:h-[280px]">
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5 sm:left-3 sm:top-3 rtl:left-auto rtl:right-2 sm:rtl:right-3">
          {product.isFeatured ? <Badge tone="gold">{dictionary.common.featured}</Badge> : null}
          {hasSale ? <Badge tone="red">{dictionary.common.sale}</Badge> : null}
        </div>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700 sm:text-xs sm:tracking-[0.16em]">
              {product.brand}
            </p>
            <Link
              href={`/${locale}/product/${product.slug}`}
              className="mt-1 line-clamp-2 block min-h-10 text-sm font-bold leading-5 text-navy hover:text-gold-700 sm:min-h-12 sm:text-base sm:leading-6"
            >
              {getLocalized(product.name, locale)}
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-navy sm:text-sm">
            <Star size={14} className="fill-gold-400 text-gold-400" />
            {product.rating.toFixed(1)}
          </div>
        </div>

        <div className="mt-3 flex min-h-8 flex-wrap items-end gap-x-2 gap-y-1">
          <p className="text-base font-bold text-navy sm:text-lg">
            {formatCurrency(product.price, currency, locale, currencyRates)}
          </p>
          {product.comparePrice ? (
            <p className="text-xs text-neutral-400 line-through sm:text-sm">
              {formatCurrency(product.comparePrice, currency, locale, currencyRates)}
            </p>
          ) : null}
        </div>

        {product.variants.length ? (
          <div className="mt-3 flex min-h-8 items-center justify-between gap-2 sm:gap-3">
            <p className="text-xs font-bold text-neutral-500">{colorLabel}</p>
            <div className="flex flex-wrap justify-end gap-1.5">
              {product.variants.slice(0, 5).map((variant) => (
                <Link
                  key={variant.id}
                  href={`/${locale}/shop?color=${encodeURIComponent(variant.name.en.toLowerCase())}`}
                  title={`${getLocalized(variant.name, locale)} (${variant.stock})`}
                  className="grid h-5 w-5 place-items-center rounded-full border border-neutral-200 bg-white shadow-sm transition hover:scale-110 hover:border-gold-400 sm:h-6 sm:w-6"
                  aria-label={getLocalized(variant.name, locale)}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white sm:h-4 sm:w-4"
                    style={{ backgroundColor: variant.colorHex ?? "#ffffff" }}
                  />
                </Link>
              ))}
              {product.variants.length > 5 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-paper px-1 text-[9px] font-bold text-neutral-500 sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-[10px]">
                  +{product.variants.length - 5}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-3 min-h-8" aria-hidden="true" />
        )}

        <Button
          className="mt-auto h-10 w-full px-2 text-xs sm:h-11 sm:px-5 sm:text-sm"
          onClick={handleAdd}
          disabled={availableStock <= 0}
          variant={availableStock <= 0 ? "secondary" : "primary"}
        >
          <ShoppingBag size={17} />
          {dictionary.actions.addToCart}
        </Button>
      </div>
    </article>
  );
}
