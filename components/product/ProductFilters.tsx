"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import { normalizeSizeFilterValue } from "@/lib/product-size-label";
import type { Category, ProductColor, ProductSize } from "@/lib/types";

type ProductFiltersProps = {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
  brands: string[];
  colors: ProductColor[];
  sizes: ProductSize[];
  current: {
    category?: string;
    brand?: string;
    color?: string;
    size?: string;
    rating?: string;
    search?: string;
    sort?: string;
    tag?: string;
    priceMin?: string;
    priceMax?: string;
  };
};

const filterCopy = {
  en: {
    all: "All",
    clear: "Clear",
    color: "Color",
    size: "Size",
    minPrice: "Min AED",
    maxPrice: "Max AED",
    sortFeatured: "Featured",
    sortNewest: "Newest",
    sortPriceAsc: "Price low to high",
    sortPriceDesc: "Price high to low",
    sortRating: "Top rated"
  },
  ar: {
    all: "All",
    clear: "Clear",
    color: "Color",
    size: "Size",
    minPrice: "Min AED",
    maxPrice: "Max AED",
    sortFeatured: "Featured",
    sortNewest: "Newest",
    sortPriceAsc: "Price low to high",
    sortPriceDesc: "Price high to low",
    sortRating: "Top rated"
  }
} satisfies Record<
  Locale,
  {
    all: string;
    clear: string;
    color: string;
    size: string;
    minPrice: string;
    maxPrice: string;
    sortFeatured: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortRating: string;
  }
>;

function splitFilter(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase();
}

function hasFilterValue(values: string[], value: string) {
  const normalized = normalizeFilterValue(value);

  return values.some((item) => normalizeFilterValue(item) === normalized);
}

function toggleFilterValue(values: string[], value: string) {
  return hasFilterValue(values, value)
    ? values.filter((item) => normalizeFilterValue(item) !== normalizeFilterValue(value))
    : [...values, value];
}

function hasSizeFilterValue(values: string[], value: string) {
  const normalized = normalizeSizeFilterValue(value);

  return values.some((item) => normalizeSizeFilterValue(item) === normalized);
}

function toggleSizeFilterValue(values: string[], value: string) {
  return hasSizeFilterValue(values, value)
    ? values.filter((item) => normalizeSizeFilterValue(item) !== normalizeSizeFilterValue(value))
    : [...values, value];
}

export function ProductFilters({
  locale,
  dictionary,
  categories,
  brands,
  colors,
  sizes,
  current
}: ProductFiltersProps) {
  const labels = filterCopy[locale];
  const router = useRouter();
  const [category, setCategory] = useState(current.category ?? "");
  const [brand, setBrand] = useState(current.brand ?? "");
  const [selectedColors, setSelectedColors] = useState(() => splitFilter(current.color));
  const [selectedSizes, setSelectedSizes] = useState(() => splitFilter(current.size));
  const [rating, setRating] = useState(current.rating ?? "");
  const [search, setSearch] = useState(current.search ?? "");
  const [sort, setSort] = useState(current.sort ?? "featured");
  const [priceMin, setPriceMin] = useState(current.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(current.priceMax ?? "");
  const [priceTouched, setPriceTouched] = useState(false);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (selectedColors.length) params.set("color", selectedColors.join(","));
    if (selectedSizes.length) params.set("size", selectedSizes.join(","));
    if (rating) params.set("rating", rating);
    if (search.trim()) params.set("search", search.trim());
    if (current.tag) params.set("tag", current.tag);
    if (sort && sort !== "featured") params.set("sort", sort);
    if (priceMin.trim()) params.set("priceMin", priceMin.trim());
    if (priceMax.trim()) params.set("priceMax", priceMax.trim());

    return params;
  }, [brand, category, current.tag, priceMax, priceMin, rating, search, selectedColors, selectedSizes, sort]);

  const pushFilters = useCallback(() => {
    const params = buildParams();

    router.push(`/${locale}/shop${params.toString() ? `?${params.toString()}` : ""}`);
  }, [buildParams, locale, router]);

  useEffect(() => {
    if (!priceTouched) {
      return;
    }

    const timeout = window.setTimeout(pushFilters, 500);

    return () => window.clearTimeout(timeout);
  }, [priceMax, priceMin, priceTouched, pushFilters]);

  const applyFilters = () => {
    setPriceTouched(false);
    pushFilters();
  };

  return (
    <aside className="border-t border-neutral-200 pt-5 lg:sticky lg:top-28 lg:border-t-0 lg:pt-0">
      <div className="flex items-center gap-2 text-neutral-900">
        <SlidersHorizontal size={18} />
        <h2 className="text-lg font-medium">Filter:</h2>
      </div>

      <div className="mt-5 grid gap-5">
        <label className="grid gap-2 text-sm font-semibold text-navy">
          {dictionary.nav.search}
          <span className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 rtl:left-auto rtl:right-3"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={dictionary.nav.search}
              className="h-11 w-full rounded-md border border-neutral-200 bg-paper pl-10 pr-3 text-sm font-medium text-neutral-700 rtl:pl-3 rtl:pr-10"
            />
          </span>
        </label>

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
          <div className="flex items-center justify-between gap-3">
            <p>{labels.color}</p>
            {selectedColors.length ? (
              <button
                type="button"
                onClick={() => setSelectedColors([])}
                className="text-xs font-bold text-gold-700 hover:text-gold-800"
              >
                {labels.clear}
              </button>
            ) : null}
          </div>
          <div className="flex max-h-72 flex-wrap gap-3 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => setSelectedColors([])}
              aria-pressed={!selectedColors.length}
              className={`inline-flex h-10 items-center rounded-md border px-3 text-xs font-bold transition ${
                !selectedColors.length
                  ? "border-gold-400 bg-gold-50 text-navy"
                  : "border-neutral-200 bg-paper text-neutral-700 hover:border-gold-300"
              }`}
            >
              {labels.all}
            </button>
            {colors.map((item) => {
              const value = item.name.en;
              const selected = hasFilterValue(selectedColors, value);
              const unavailable = item.count <= 0 && !selected;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    if (!unavailable) {
                      setSelectedColors((currentValues) => toggleFilterValue(currentValues, value));
                    }
                  }}
                  aria-pressed={selected}
                  aria-disabled={unavailable}
                  disabled={unavailable}
                  title={`${getLocalized(item.name, locale)} (${item.count})`}
                  className={`group grid max-w-20 justify-items-center gap-1 text-center text-[11px] font-bold transition ${
                    unavailable ? "cursor-not-allowed opacity-45" : "text-neutral-600"
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full border-2 shadow-sm transition group-hover:scale-110 ${
                      selected
                        ? "scale-110 border-navy ring-2 ring-gold-200"
                        : unavailable
                          ? "border-white ring-1 ring-neutral-100"
                          : "border-white ring-1 ring-neutral-200"
                    }`}
                    style={{ backgroundColor: item.colorHex ?? "#ffffff" }}
                  />
                  <span className={selected ? "text-navy" : unavailable ? "text-neutral-300" : "text-neutral-500"}>
                    {getLocalized(item.name, locale)} ({item.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {sizes.length ? (
          <div className="grid gap-2 text-sm font-semibold text-navy">
            <div className="flex items-center justify-between gap-3">
              <p>{labels.size}</p>
              {selectedSizes.length ? (
                <button
                  type="button"
                  onClick={() => setSelectedSizes([])}
                  className="text-xs font-bold text-gold-700 hover:text-gold-800"
                >
                  {labels.clear}
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((item) => {
                const selected = hasSizeFilterValue(selectedSizes, item.key);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedSizes((currentValues) => toggleSizeFilterValue(currentValues, item.key))}
                    aria-pressed={selected}
                    title={`${getLocalized(item.name, locale)} (${item.count})`}
                    className={`inline-flex h-9 items-center rounded-md border px-3 text-xs font-bold transition ${
                      selected
                        ? "border-navy bg-navy text-white"
                        : "border-neutral-200 bg-paper text-neutral-700 hover:border-gold-300"
                    }`}
                  >
                    {getLocalized(item.name, locale)}
                    <span className={selected ? "ml-1 text-white/70" : "ml-1 text-neutral-400"}>{item.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-navy">
          {dictionary.shop.priceRange}
          <span className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              step="10"
              value={priceMin}
              onChange={(event) => {
                setPriceTouched(true);
                setPriceMin(event.target.value);
              }}
              placeholder={labels.minPrice}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
            />
            <input
              type="number"
              min="0"
              step="10"
              value={priceMax}
              onChange={(event) => {
                setPriceTouched(true);
                setPriceMax(event.target.value);
              }}
              placeholder={labels.maxPrice}
              className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm font-medium text-neutral-700"
            />
          </span>
          <span className="text-xs text-neutral-500">
            {priceMin || "0"} AED - {priceMax || "Any"} AED
          </span>
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
