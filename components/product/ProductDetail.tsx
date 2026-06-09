"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, RefreshCcw, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Product } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { formatCurrency } from "@/utils/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ProductDetailProps = {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
};

export function ProductDetail({ product, locale, dictionary }: ProductDetailProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const currency = usePreferencesStore((state) => state.currency);
  const currencyRates = usePreferencesStore((state) => state.currencyRates);
  const stockTone = product.stock > 10 ? "green" : product.stock > 0 ? "gold" : "red";
  const stockLabel =
    product.stock > 10
      ? dictionary.common.inStock
      : product.stock > 0
        ? dictionary.common.lowStock
        : dictionary.common.outOfStock;

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success(`${quantity} x ${getLocalized(product.name, locale)} added to cart`);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 shadow-soft">
          <Image
            src={product.images[activeImage].url}
            alt={product.images[activeImage].alt}
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {product.images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`relative aspect-square overflow-hidden rounded-md border ${
                index === activeImage ? "border-gold-500" : "border-neutral-200"
              }`}
              aria-label={image.alt}
            >
              <Image src={image.url} alt={image.alt} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="lg:pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold">{product.brand}</Badge>
          <Badge tone={stockTone}>{stockLabel}</Badge>
          {product.comparePrice ? <Badge tone="red">{dictionary.common.sale}</Badge> : null}
        </div>

        <h1 className="mt-5 text-3xl font-bold text-navy sm:text-4xl">
          {getLocalized(product.name, locale)}
        </h1>

        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-neutral-600">
          <Star size={17} className="fill-gold-400 text-gold-400" />
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount} {dictionary.common.reviews})</span>
          <span className="text-neutral-300">|</span>
          <span>{product.sku}</span>
        </div>

        <p className="mt-5 text-base leading-7 text-neutral-600">
          {getLocalized(product.description, locale)}
        </p>

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

        <div className="mt-7 flex flex-wrap gap-3">
          <div className="inline-flex h-12 items-center overflow-hidden rounded-md border border-neutral-200 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-full w-12 place-items-center text-navy hover:bg-gold-50"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="grid h-full min-w-12 place-items-center border-x border-neutral-200 px-4 text-sm font-bold text-navy">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
              className="grid h-full w-12 place-items-center text-navy hover:bg-gold-50"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <Button onClick={handleAdd} size="lg" disabled={product.stock <= 0}>
            <ShoppingBag size={18} />
            {dictionary.actions.addToCart}
          </Button>
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

        <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">{dictionary.product.specifications}</h2>
          <div className="mt-4 grid gap-3">
            {product.specifications.map((spec) => (
              <div key={getLocalized(spec.key, locale)} className="flex justify-between gap-4 text-sm">
                <span className="text-neutral-500">{getLocalized(spec.key, locale)}</span>
                <span className="font-semibold text-navy">{getLocalized(spec.value, locale)}</span>
              </div>
            ))}
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
