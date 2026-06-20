"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductCardAddButton, ProductCardPrice } from "@/components/product/ProductCardPurchase";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { getDisplayName } from "@/lib/text-format";

type ProductCardProps = {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
  priority?: boolean;
};

export function ProductCard({ product, locale, dictionary, priority = false }: ProductCardProps) {
  const hasSale = product.comparePrice && product.comparePrice > product.price;
  const colorSwatches = product.variants.reduce<typeof product.variants>((items, variant) => {
    const key = variant.colorName.en.trim().toLowerCase();

    return items.some((item) => item.colorName.en.trim().toLowerCase() === key) ? items : [...items, variant];
  }, []);
  const [selectedColorId, setSelectedColorId] = useState(colorSwatches[0]?.id ?? "");
  const selectedColor = colorSwatches.find((variant) => variant.id === selectedColorId) ?? colorSwatches[0];
  const productName = getDisplayName(product.name, locale);
  const cardImage = selectedColor?.imageUrl
    ? {
        url: selectedColor.imageUrl,
        alt: `${productName} - ${getLocalized(selectedColor.colorName, locale)}`
      }
    : product.images[0];
  const visibleColorSwatches = colorSwatches.slice(0, 5);
  const hiddenColorCount = Math.max(colorSwatches.length - visibleColorSwatches.length, 0);
  const totalStock = product.variants.length
    ? product.variants.filter((variant) => variant.isActive).reduce((total, variant) => total + Math.max(0, variant.stock), 0)
    : product.stock;
  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    images: product.images.slice(0, 1),
    stock: product.stock,
    price: product.price,
    brand: product.brand
  };

  return (
    <article className="group relative flex h-[340px] flex-col overflow-hidden bg-white transition-all duration-200 sm:h-[458px] lg:h-[486px]">
      <div className="relative h-[238px] shrink-0 overflow-hidden bg-neutral-100 sm:h-[348px] lg:h-[374px]">
        <Link href={`/${locale}/product/${product.slug}`} className="block h-full">
          <Image
            src={cardImage.url}
            alt={cardImage.alt}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 50vw"
            className="object-cover transition-all duration-300 group-hover:scale-[1.03]"
            priority={priority}
          />
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 rtl:left-auto rtl:right-2">
            {hasSale ? <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-semibold text-white">{dictionary.common.sale}</span> : null}
            {totalStock <= 0 ? <Badge tone="red">{dictionary.common.outOfStock}</Badge> : null}
          </div>
        </Link>
        <ProductCardAddButton
          product={cartProduct}
          variants={product.variants}
          locale={locale}
          addToCartLabel={dictionary.actions.addToCart}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-0.5 pt-3">
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="line-clamp-2 min-h-[40px] text-[13px] font-medium leading-5 tracking-[0.02em] text-neutral-900 transition hover:underline sm:min-h-[44px] sm:text-[15px] sm:leading-6"
        >
          {productName}
        </Link>

        <ProductCardPrice price={product.price} comparePrice={product.comparePrice} locale={locale} />

        {product.variants.length ? (
          <div className="mt-2 flex min-h-6 flex-wrap items-center gap-1.5">
            {visibleColorSwatches.map((variant) => {
              const selected = selectedColor?.id === variant.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedColorId(variant.id)}
                  title={`${getLocalized(variant.colorName, locale)} (${variant.stock})`}
                  className={`grid h-4 w-4 place-items-center rounded-full border bg-white transition-all duration-200 hover:scale-110 sm:h-5 sm:w-5 ${
                    selected
                      ? "border-neutral-900 ring-2 ring-neutral-300 ring-offset-1"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                  aria-label={getLocalized(variant.colorName, locale)}
                  aria-pressed={selected}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white sm:h-3 sm:w-3"
                    style={{ backgroundColor: variant.colorHex ?? "#ffffff" }}
                  />
                </button>
              );
            })}
            {hiddenColorCount > 0 ? (
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-neutral-100 px-1.5 text-[10px] font-bold text-neutral-500">
                +{hiddenColorCount}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="mt-2 min-h-7" aria-hidden="true" />
        )}

      </div>
    </article>
  );
}
