"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { formatCurrency } from "@/utils/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ProductCardProps = {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
};

export function ProductCard({ product, locale, dictionary }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const currency = usePreferencesStore((state) => state.currency);
  const currencyRates = usePreferencesStore((state) => state.currencyRates);
  const hasSale = product.comparePrice && product.comparePrice > product.price;

  const handleAdd = () => {
    addItem(product);
    toast.success(`${getLocalized(product.name, locale)} added to cart`);
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/${locale}/product/${product.slug}`} className="relative block aspect-[4/5] bg-neutral-100">
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2 rtl:left-auto rtl:right-3">
          {product.isFeatured ? <Badge tone="gold">{dictionary.common.featured}</Badge> : null}
          {hasSale ? <Badge tone="red">{dictionary.common.sale}</Badge> : null}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">
              {product.brand}
            </p>
            <Link
              href={`/${locale}/product/${product.slug}`}
              className="mt-1 line-clamp-2 block min-h-12 text-base font-bold text-navy hover:text-gold-700"
            >
              {getLocalized(product.name, locale)}
            </Link>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-navy">
            <Star size={15} className="fill-gold-400 text-gold-400" />
            {product.rating.toFixed(1)}
          </div>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <p className="text-lg font-bold text-navy">
            {formatCurrency(product.price, currency, locale, currencyRates)}
          </p>
          {product.comparePrice ? (
            <p className="text-sm text-neutral-400 line-through">
              {formatCurrency(product.comparePrice, currency, locale, currencyRates)}
            </p>
          ) : null}
        </div>

        <Button
          className="mt-4 w-full"
          onClick={handleAdd}
          disabled={product.stock <= 0}
          variant={product.stock <= 0 ? "secondary" : "primary"}
        >
          <ShoppingBag size={17} />
          {dictionary.actions.addToCart}
        </Button>
      </div>
    </article>
  );
}
