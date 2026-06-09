"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category, ProductColor } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

type ProductFiltersProps = {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
  brands: string[];
  colors: ProductColor[];
  current: {
    category?: string;
    brand?: string;
    color?: string;
    rating?: string;
    search?: string;
    sort?: string;
    tag?: string;
    priceMax?: string;
  };
};

const filterCopy = {
  en: {
    all: "All",
    color: "Color",
    sortFeatured: "Featured",
    sortNewest: "Newest",
    sortPriceAsc: "Price low to high",
    sortPriceDesc: "Price high to low",
    sortRating: "Top rated"
  },
  ar: {
    color: "اللون",
    all: "الكل",
    sortFeatured: "مميز",
    sortNewest: "الأحدث",
    sortPriceAsc: "السعر من الأقل إلى الأعلى",
    sortPriceDesc: "السعر من الأعلى إلى الأقل",
    sortRating: "الأعلى تقييما"
  }
} satisfies Record<
  Locale,
  {
    all: string;
    color: string;
    sortFeatured: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortRating: string;
  }
>;

export function ProductFilters({
  locale,
  dictionary,
  categories,
  brands,
  colors,
  current
}: ProductFiltersProps) {
  const labels = filterCopy[locale];
  const router = useRouter();
  const [category, setCategory] = useState(current.category ?? "");
  const [brand, setBrand] = useState(current.brand ?? "");
  const [color, setColor] = useState(current.color?.trim().toLowerCase() ?? "");
  const [rating, setRating] = useState(current.rating ?? "");
  const [sort, setSort] = useState(current.sort ?? "featured");
  const [priceMax, setPriceMax] = useState(current.priceMax ?? "1500");

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (color) params.set("color", color);
    if (rating) params.set("rating", rating);
    if (current.search) params.set("search", current.search);
    if (current.tag) params.set("tag", current.tag);
    if (sort && sort !== "featured") params.set("sort", sort);
    if (priceMax !== "1500") params.set("priceMax", priceMax);

    router.push(`/${locale}/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <aside className="rounded-lg border border-neutral-200 bg-white p-4 shadow-soft lg:sticky lg:top-28">
      <div className="flex items-center gap-2 text-navy">
        <SlidersHorizontal size={18} />
        <h2 className="text-base font-bold">{dictionary.shop.filters}</h2>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-navy">
          {dictionary.shop.category}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
          >
            <option value="">{labels.all}</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {getLocalized(item.name, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-navy">
          {dictionary.shop.brand}
          <select
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
          >
            <option value="">{labels.all}</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2 text-sm font-semibold text-navy">
          <p>{labels.color}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setColor("")}
              aria-pressed={!color}
              className={`inline-flex min-h-9 items-center rounded-md border px-3 text-xs font-bold transition ${
                !color
                  ? "border-gold-400 bg-gold-50 text-navy"
                  : "border-neutral-200 bg-paper text-neutral-700 hover:border-gold-300"
              }`}
            >
              {labels.all}
            </button>
            {colors.map((item) => {
              const selected = color === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setColor(item.key)}
                  aria-pressed={selected}
                  title={`${getLocalized(item.name, locale)} (${item.count})`}
                  className={`inline-flex min-h-9 max-w-full items-center gap-2 rounded-md border px-2 text-xs font-bold transition ${
                    selected
                      ? "border-gold-400 bg-gold-50 text-navy"
                      : "border-neutral-200 bg-paper text-neutral-700 hover:border-gold-300"
                  }`}
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full border border-neutral-200"
                    style={{ backgroundColor: item.colorHex ?? "#ffffff" }}
                  />
                  <span className="truncate">{getLocalized(item.name, locale)}</span>
                  <span className="text-[11px] text-neutral-400">{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-navy">
          {dictionary.shop.priceRange}
          <input
            type="range"
            min="100"
            max="1500"
            step="50"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            className="accent-gold-500"
          />
          <span className="text-xs text-neutral-500">AED 100 - AED {priceMax}</span>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-navy">
          {dictionary.shop.rating}
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
          >
            <option value="">{labels.all}</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
            <option value="4.8">4.8+</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-navy">
          {dictionary.shop.sort}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
          >
            <option value="featured">{labels.sortFeatured}</option>
            <option value="new">{labels.sortNewest}</option>
            <option value="price-asc">{labels.sortPriceAsc}</option>
            <option value="price-desc">{labels.sortPriceDesc}</option>
            <option value="rating">{labels.sortRating}</option>
          </select>
        </label>

        <Button onClick={applyFilters} className="w-full">
          {dictionary.actions.apply}
        </Button>
      </div>
    </aside>
  );
}
