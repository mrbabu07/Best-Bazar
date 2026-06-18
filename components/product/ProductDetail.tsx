"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, RefreshCcw, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Product, ProductVariant } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useHydrated } from "@/hooks/useHydrated";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { defaultCurrencyRates, formatCurrency } from "@/utils/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FavouriteButton, ShareProductButton } from "@/components/product/ProductActions";
import { fashionCoreFields } from "@/lib/category-fields";
import { cleanLengthSizeLabel } from "@/lib/product-size-label";
import { getDisplayName } from "@/lib/text-format";

type ProductDetailProps = {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
};

const detailCopy = {
  en: {
    addedToCart: (quantity: number, name: string) => `${quantity} x ${name} added to cart`,
    decreaseQuantity: "Decrease quantity",
    increaseQuantity: "Increase quantity",
    color: "Color",
    stockForColor: (stock: number) => `${stock} available`
  },
  ar: {
    addedToCart: (quantity: number, name: string) => `تمت إضافة ${quantity} × ${name} إلى السلة`,
    decreaseQuantity: "إنقاص الكمية",
    increaseQuantity: "زيادة الكمية",
    color: "اللون",
    stockForColor: (stock: number) => `${stock} متوفر`
  }
} satisfies Record<
  Locale,
  {
    addedToCart: (quantity: number, name: string) => string;
    decreaseQuantity: string;
    increaseQuantity: string;
    color: string;
    stockForColor: (stock: number) => string;
  }
>;

function variantColorKey(variant: ProductVariant) {
  return variant.colorName.en.trim().toLowerCase() || variant.id;
}

function variantSizeKey(variant: ProductVariant) {
  return variant.sizeKey ?? variant.sizeName?.en.trim().toLowerCase() ?? "";
}

function getVariantSizeLabel(variant: ProductVariant, locale: Locale) {
  const label = variant.sizeName ? getLocalized(variant.sizeName, locale) : getLocalized(variant.name, locale);
  return cleanLengthSizeLabel(label);
}

function uniqueVariantsBy(variants: ProductVariant[], getKey: (variant: ProductVariant) => string) {
  return variants.reduce<ProductVariant[]>((items, variant) => {
    const key = getKey(variant);

    return items.some((item) => getKey(item) === key) ? items : [...items, variant];
  }, []);
}

export function ProductDetail({ product, locale, dictionary }: ProductDetailProps) {
  const labels = detailCopy[locale];
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const firstAvailableVariant = activeVariants.find((variant) => variant.stock > 0) ?? activeVariants[0];
  const hydrated = useHydrated();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(firstAvailableVariant?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const productName = getDisplayName(product.name, locale);
  const addItem = useCartStore((state) => state.addItem);
  const storedCurrency = usePreferencesStore((state) => state.currency);
  const storedCurrencyRates = usePreferencesStore((state) => state.currencyRates);
  const currency = hydrated ? storedCurrency : "AED";
  const currencyRates = hydrated ? storedCurrencyRates : defaultCurrencyRates;
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId);
  const hasSizedVariants = activeVariants.some((variant) => variant.sizeName);
  const colorOptions = uniqueVariantsBy(activeVariants, variantColorKey);
  const selectedColorKey = selectedVariant ? variantColorKey(selectedVariant) : "";
  const selectedSizeKey = selectedVariant ? variantSizeKey(selectedVariant) : "";
  const sizeOptions = hasSizedVariants
    ? uniqueVariantsBy(
        activeVariants.filter((variant) => variantColorKey(variant) === selectedColorKey),
        variantSizeKey
      )
    : [];
  const selectedVariantImage = selectedVariant?.imageUrl
    ? {
        url: selectedVariant.imageUrl,
        alt: `${productName} - ${getLocalized(selectedVariant.name, locale)}`
      }
    : null;
  const galleryImages = selectedVariantImage
    ? [selectedVariantImage, ...product.images.filter((image) => image.url !== selectedVariantImage.url)]
    : product.images;
  const safeActiveImage = Math.min(activeImage, galleryImages.length - 1);
  const activeGalleryImage = galleryImages[safeActiveImage] ?? product.images[0];
  const availableStock = selectedVariant?.stock ?? product.stock;
  const stockTone = availableStock > 10 ? "green" : availableStock > 0 ? "gold" : "red";
  const stockLabel =
    availableStock > 10
      ? dictionary.common.inStock
      : availableStock > 0
        ? dictionary.common.lowStock
        : dictionary.common.outOfStock;
  const fashionRows: Product["specifications"] = fashionCoreFields.flatMap((field): Product["specifications"] => {
    const value = product.fashionFields?.[field.key];

    if (field.type === "boolean") {
      return value ? [{ key: { en: field.labelEn, ar: field.labelAr }, value: { en: "Yes", ar: "\u0646\u0639\u0645" } }] : [];
    }

    const text = typeof value === "string" ? value.trim() : "";
    return text ? [{ key: { en: field.labelEn, ar: field.labelAr }, value: { en: text, ar: text } }] : [];
  });
  const customRows: Product["specifications"] = (product.customFields ?? []).flatMap((field): Product["specifications"] => {
    const value = product.customFieldValues?.[field.id];
    const text = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value ?? "").trim();

    return text ? [{ key: field.label, value: { en: text, ar: text } }] : [];
  });
  const fashionDetailRows: Product["specifications"] = [...fashionRows, ...customRows];

  const handleAdd = () => {
    addItem(product, quantity, selectedVariant);
    toast.success(labels.addedToCart(quantity, productName));
  };

  const selectVariant = (variantId: string) => {
    const variant = activeVariants.find((item) => item.id === variantId);

    setSelectedVariantId(variantId);
    if (variant?.imageUrl) {
      setActiveImage(0);
    }
    setQuantity((value) => Math.max(1, Math.min(value, variant?.stock ?? product.stock)));
  };

  const selectColor = (variant: ProductVariant) => {
    const colorKey = variantColorKey(variant);
    const sameSizeVariant = activeVariants.find(
      (item) => variantColorKey(item) === colorKey && variantSizeKey(item) === selectedSizeKey && item.stock > 0
    );
    const nextVariant =
      sameSizeVariant ??
      activeVariants.find((item) => variantColorKey(item) === colorKey && item.stock > 0) ??
      activeVariants.find((item) => variantColorKey(item) === colorKey);

    if (nextVariant) {
      selectVariant(nextVariant.id);
    }
  };

  const selectSize = (variant: ProductVariant) => {
    const sizeKey = variantSizeKey(variant);
    const nextVariant =
      activeVariants.find(
        (item) => variantColorKey(item) === selectedColorKey && variantSizeKey(item) === sizeKey && item.stock > 0
      ) ??
      activeVariants.find(
        (item) => variantColorKey(item) === selectedColorKey && variantSizeKey(item) === sizeKey
      );

    if (nextVariant) {
      selectVariant(nextVariant.id);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 shadow-soft">
          <Image
            src={activeGalleryImage.url}
            alt={activeGalleryImage.alt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {galleryImages.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`relative aspect-square overflow-hidden rounded-md border ${
                index === safeActiveImage ? "border-gold-500" : "border-neutral-200"
              }`}
              aria-label={image.alt}
            >
              <Image src={image.url} alt={image.alt} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
        {product.shortVideoUrl ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-black shadow-soft">
            <video
              src={product.shortVideoUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : null}
      </div>

      <div className="lg:pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold">{product.brand}</Badge>
          <Badge tone={stockTone}>{stockLabel}</Badge>
          {product.comparePrice ? <Badge tone="red">{dictionary.common.sale}</Badge> : null}
        </div>

        <h1 className="mt-5 text-3xl font-bold text-navy sm:text-4xl">
          {productName}
        </h1>

        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-600">
          <Star size={17} className="fill-gold-400 text-gold-400" />
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount} {dictionary.common.reviews})</span>
        </div>

        <div className="mt-6 flex items-end gap-3">
          <p className="text-3xl font-bold text-navy">
            {formatCurrency(product.price, currency, locale, currencyRates)}
          </p>
          {product.comparePrice ? (
            <p className="pb-1 text-lg text-neutral-400 line-through">
              {formatCurrency(product.comparePrice, currency, locale, currencyRates)}
            </p>
          ) : null}
        </div>

        {activeVariants.length ? (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-navy">{labels.color}</p>
              <p className="text-xs font-semibold text-neutral-500">{labels.stockForColor(availableStock)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {colorOptions.map((variant) => {
                const selected = variantColorKey(variant) === selectedColorKey;
                const colorStock = activeVariants
                  .filter((item) => variantColorKey(item) === variantColorKey(variant))
                  .reduce((total, item) => total + item.stock, 0);

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => selectColor(variant)}
                    disabled={colorStock <= 0}
                    aria-pressed={selected}
                    className={`grid h-8 w-8 place-items-center rounded-full border-2 bg-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected
                        ? "border-gold-500 ring-2 ring-gold-300 ring-offset-1"
                        : "border-neutral-200 hover:border-gold-400"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-white"
                      style={{ backgroundColor: variant.colorHex ?? "#ffffff" }}
                    />
                  </button>
                );
              })}
            </div>
            {selectedVariant ? (
              <p className="mt-2 text-sm font-semibold text-neutral-600">
                {getLocalized(selectedVariant.colorName, locale)}
              </p>
            ) : null}
            {hasSizedVariants ? (
              <div className="mt-4">
                <p className="text-sm font-bold text-navy">{locale === "ar" ? "المقاس" : "Size"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizeOptions.map((variant) => {
                    const selected = variantSizeKey(variant) === selectedSizeKey;
                    const stock = activeVariants
                      .filter(
                        (item) =>
                          variantColorKey(item) === selectedColorKey && variantSizeKey(item) === variantSizeKey(variant)
                      )
                      .reduce((total, item) => total + Math.max(0, item.stock), 0);

                    return (
                      <button
                        key={`${variant.id}-${variantSizeKey(variant)}`}
                        type="button"
                        onClick={() => selectSize(variant)}
                        disabled={stock <= 0}
                        aria-pressed={selected}
                        className={`inline-flex h-10 items-center rounded-md border px-3 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                          selected
                            ? "border-gold-500 bg-gold-50 text-navy"
                            : "border-neutral-200 bg-white text-neutral-600 hover:border-gold-300"
                        }`}
                      >
                        {getVariantSizeLabel(variant, locale)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5">
          {availableStock > 0 ? (
            <p className="text-sm font-bold text-emerald-700">
              {locale === "ar" ? `متوفر (${availableStock} متبقي)` : `In Stock (${availableStock} left)`}
            </p>
          ) : (
            <p className="text-sm font-bold text-sale">{locale === "ar" ? "غير متوفر" : "Out of Stock"}</p>
          )}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <div className="inline-flex h-12 items-center overflow-hidden rounded-md border border-neutral-200 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-full w-12 place-items-center text-navy hover:bg-gold-50"
              aria-label={labels.decreaseQuantity}
            >
              <Minus size={16} />
            </button>
            <span className="grid h-full min-w-12 place-items-center border-x border-neutral-200 px-4 text-sm font-bold text-navy">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(availableStock, value + 1))}
              className="grid h-full w-12 place-items-center text-navy hover:bg-gold-50"
              aria-label={labels.increaseQuantity}
            >
              <Plus size={16} />
            </button>
          </div>

          <Button onClick={handleAdd} size="lg" disabled={availableStock <= 0}>
            <ShoppingBag size={18} />
            {dictionary.actions.addToCart}
          </Button>
          <FavouriteButton product={product} locale={locale} />
          <ShareProductButton product={product} locale={locale} />
        </div>

        <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">{locale === "ar" ? "الوصف" : "Description"}</h2>
          <p className="mt-3 text-base leading-7 text-neutral-600">
            {getLocalized(product.description, locale)}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, label: dictionary.product.secure },
            { icon: Truck, label: dictionary.product.delivery },
            { icon: RefreshCcw, label: dictionary.product.returns }
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-gold-100 bg-white p-4 text-sm font-semibold text-navy"
            >
              <item.icon size={18} className="text-gold-700" />
              {item.label}
            </div>
          ))}
        </div>

        {fashionDetailRows.length ? (
          <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
            <h2 className="text-lg font-bold text-navy">{locale === "ar" ? "تفاصيل الأزياء" : "Fashion details"}</h2>
            <div className="mt-4 grid gap-3">
              {fashionDetailRows.map((spec, index) => (
                <div key={`${getLocalized(spec.key, locale)}-${index}`} className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">{getLocalized(spec.key, locale)}</span>
                  <span className="font-semibold text-navy">{getLocalized(spec.value, locale)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">{dictionary.product.specifications}</h2>
          <div className="mt-4 grid gap-3">
            {product.specifications.map((spec, index) => (
              <div key={`${getLocalized(spec.key, locale)}-${index}`} className="flex justify-between gap-4 text-sm">
                <span className="text-neutral-500">{getLocalized(spec.key, locale)}</span>
                <span className="font-semibold text-navy">{getLocalized(spec.value, locale)}</span>
              </div>
            ))}
            {!product.specifications.length ? (
              <p className="text-sm font-semibold text-neutral-500">
                {locale === "ar" ? "سيتم إضافة تفاصيل المنتج قريبا." : "Product details will be added soon."}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          href={`/${locale}/cart`}
          className="mt-5 inline-flex text-sm font-bold text-gold-700 hover:text-gold-800"
        >
          {dictionary.actions.checkout}
        </Link>
      </div>
    </div>
  );
}
