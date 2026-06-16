import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { ProductCardAddButton, ProductCardPrice } from "@/components/product/ProductCardPurchase";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";

type ProductCardProps = {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
  priority?: boolean; // For LCP optimization
};

export function ProductCard({ product, locale, dictionary, priority = false }: ProductCardProps) {
  const colorLabel = locale === "ar" ? "الألوان" : "Colors";
  const hasSale = product.comparePrice && product.comparePrice > product.price;
  const colorSwatches = product.variants.reduce<typeof product.variants>((items, variant) => {
    const key = variant.colorName.en.trim().toLowerCase();

    return items.some((item) => item.colorName.en.trim().toLowerCase() === key) ? items : [...items, variant];
  }, []);
  const visibleColorSwatches = colorSwatches.slice(0, 3);
  const hiddenColorCount = Math.max(colorSwatches.length - visibleColorSwatches.length, 0);
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
    <article className="group flex h-[430px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:border-gold-200 hover:shadow-lift sm:h-[510px] lg:h-[540px]">
      <Link
        href={`/${locale}/product/${product.slug}`}
        className="relative block h-[174px] shrink-0 overflow-hidden bg-neutral-100 sm:h-[260px] lg:h-[280px]"
      >
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-105"
          priority={priority}
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
              className="mt-1 line-clamp-2 block text-sm font-bold leading-5 text-navy hover:text-gold-700 sm:text-base sm:leading-6"
            >
              {getLocalized(product.name, locale)}
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-paper px-2 py-1 text-xs font-bold text-navy">
            <Star size={13} className="fill-gold-400 text-gold-400" />
            {product.rating.toFixed(1)}
          </div>
        </div>

        <ProductCardPrice
          price={product.price}
          comparePrice={product.comparePrice}
          locale={locale}
        />

        {product.variants.length ? (
          <div className="mt-2 flex min-h-7 items-center justify-between gap-2 sm:gap-3">
            <p className="text-xs font-bold text-neutral-500">{colorLabel}</p>
            <div className="flex flex-wrap justify-end gap-1.5">
              {visibleColorSwatches.map((variant) => (
                <Link
                  key={variant.id}
                  href={`/${locale}/shop?color=${encodeURIComponent(variant.colorName.en.toLowerCase())}`}
                  title={`${getLocalized(variant.colorName, locale)} (${variant.stock})`}
                  className="grid h-5 w-5 place-items-center rounded-full border border-neutral-200 bg-white shadow-sm transition hover:scale-110 hover:border-gold-400 sm:h-6 sm:w-6"
                  aria-label={getLocalized(variant.colorName, locale)}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white sm:h-4 sm:w-4"
                    style={{ backgroundColor: variant.colorHex ?? "#ffffff" }}
                  />
                </Link>
              ))}
              {hiddenColorCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-paper px-1 text-[9px] font-bold text-neutral-500 sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-[10px]">
                  +{hiddenColorCount}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-2 min-h-7" aria-hidden="true" />
        )}

        <ProductCardAddButton
          product={cartProduct}
          variants={product.variants}
          locale={locale}
          addToCartLabel={dictionary.actions.addToCart}
        />
      </div>
    </article>
  );
}
