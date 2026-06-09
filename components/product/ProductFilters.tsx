"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

type ProductFiltersProps = {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
  brands: string[];
  current: {
    category?: string;
    brand?: string;
    rating?: string;
    sort?: string;
    priceMax?: string;
  };
};

export function ProductFilters({
  locale,
  dictionary,
  categories,
  brands,
  current
}: ProductFiltersProps) {
  const router = useRouter();
  const [category, setCategory] = useState(current.category ?? "");
  const [brand, setBrand] = useState(current.brand ?? "");
  const [rating, setRating] = useState(current.rating ?? "");
  const [sort, setSort] = useState(current.sort ?? "featured");
  const [priceMax, setPriceMax] = useState(current.priceMax ?? "1500");

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (rating) params.set("rating", rating);
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
            <option value="">All</option>
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
            <option value="">All</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

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
            <option value="">All</option>
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
            <option value="featured">Featured</option>
            <option value="new">Newest</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>

        <Button onClick={applyFilters} className="w-full">
          {dictionary.actions.apply}
        </Button>
      </div>
    </aside>
  );
}
