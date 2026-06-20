"use client";

import Image from "next/image";
import Link from "next/link";
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
  showQuickAdd?: boolean;
};

export function ProductCard({ product, locale, dictionary, priority = false, showQuickAdd = true }: ProductCardProps) {
  const hasSale = product.comparePrice && product.comparePrice > product.price;
  const selectedColor = product.variants.find((variant) => variant.isActive);
  const productName = getDisplayName(product.name, locale);
  const cardImage = selectedColor?.imageUrl
    ? {
        url: selectedColor.imageUrl,
        alt: `${productName} - ${getLocalized(selectedColor.colorName, locale)}`
      }
    : product.images[0];
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
    <article className="group relative flex min-w-0 flex-col bg-white">
      <div className="relative aspect-[.88] shrink-0 overflow-hidden bg-neutral-100 sm:aspect-[3/4]">
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
        {showQuickAdd ? <ProductCardAddButton product={cartProduct} variants={product.variants} locale={locale} addToCartLabel={dictionary.actions.addToCart} /> : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-0.5 pt-3">
        <Link
          href={`/${locale}/product/${product.slug}`}
          className="line-clamp-2 min-h-[40px] text-[13px] font-medium leading-5 tracking-[0.02em] text-neutral-900 transition hover:underline sm:min-h-[44px] sm:text-[15px] sm:leading-6"
        >
          {productName}
        </Link>

        <ProductCardPrice price={product.price} comparePrice={product.comparePrice} locale={locale} />

      </div>
    </article>
  );
}
