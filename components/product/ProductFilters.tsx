"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getLocalized } from "@/lib/i18n";
import type { Category } from "@/lib/types";

type ProductFiltersProps = {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
  brands: string[];
  total: number;
  current: {
    category?: string;
    brand?: string;
    search?: string;
    sort?: string;
    tag?: string;
    priceMin?: string;
    priceMax?: string;
    availability?: string;
  };
};

const filterCopy = {
  en: {
    all: "All",
    filterAndSort: "Filter and sort",
    removeAll: "Remove all",
    minPrice: "Min AED",
    maxPrice: "Max AED",
    sortFeatured: "Featured",
    sortNewest: "Newest",
    sortPriceAsc: "Price low to high",
    sortPriceDesc: "Price high to low",
    sortRating: "Top rated",
    products: "products"
  },
  ar: {
    all: "All",
    filterAndSort: "Filter and sort",
    removeAll: "Remove all",
    minPrice: "Min AED",
    maxPrice: "Max AED",
    sortFeatured: "Featured",
    sortNewest: "Newest",
    sortPriceAsc: "Price low to high",
    sortPriceDesc: "Price high to low",
    sortRating: "Top rated",
    products: "products"
  }
} satisfies Record<
  Locale,
  {
    all: string;
    filterAndSort: string;
    removeAll: string;
    minPrice: string;
    maxPrice: string;
    sortFeatured: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortRating: string;
    products: string;
  }
>;

export function ProductFilters({
  locale,
  dictionary,
  categories,
  brands,
  total,
  current
}: ProductFiltersProps) {
  const labels = filterCopy[locale];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(current.category ?? "");
  const [brand, setBrand] = useState(current.brand ?? "");
  const [search, setSearch] = useState(current.search ?? "");
  const [sort, setSort] = useState(current.sort ?? "featured");
  const [priceMin, setPriceMin] = useState(current.priceMin ?? "");
  const [priceMax, setPriceMax] = useState(current.priceMax ?? "");
  const [priceTouched, setPriceTouched] = useState(false);
  const [availability, setAvailability] = useState(current.availability === "in-stock");

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();

    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (search.trim()) params.set("search", search.trim());
    if (current.tag) params.set("tag", current.tag);
    if (sort && sort !== "featured") params.set("sort", sort);
    if (priceMin.trim()) params.set("priceMin", priceMin.trim());
    if (priceMax.trim()) params.set("priceMax", priceMax.trim());
    if (availability) params.set("availability", "in-stock");

    return params;
  }, [availability, brand, category, current.tag, priceMax, priceMin, search, sort]);

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
    setOpen(false);
  };

  const clearHref = current.tag ? `/${locale}/shop?tag=${encodeURIComponent(current.tag)}` : `/${locale}/shop`;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 lg:text-[1.15rem]"
          aria-expanded={open}
        >
          <SlidersHorizontal size={16} />
          {labels.filterAndSort}
        </button>
        <span className="text-sm text-neutral-500 lg:text-[1.15rem]">
          {total} {labels.products}
        </span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-black/50" role="dialog" aria-modal="true">
          <div className="ml-auto grid h-full w-[min(100%,420px)] grid-rows-[auto_1fr_auto] bg-[#f6f8f1] text-neutral-950 shadow-2xl">
            <div className="relative border-b border-neutral-200 px-5 py-4 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center"
                aria-label="Close filters"
              >
                <X size={22} />
              </button>
              <p className="text-base font-medium">{labels.filterAndSort}</p>
              <p className="text-xs text-neutral-500">
                {total} {labels.products}
              </p>
            </div>

            <div className="grid content-start gap-5 overflow-y-auto px-5 py-7">
              <div className="border-y border-neutral-200 py-5 text-sm text-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">Availability</span>
                  <span aria-hidden="true">+</span>
                </div>
                <label className="mt-5 flex cursor-pointer items-center gap-3 font-normal">
                  <input
                    type="checkbox"
                    checked={availability}
                    onChange={(event) => {
                      setAvailability(event.target.checked);
                      setPriceTouched(true);
                    }}
                    className="h-5 w-5 accent-neutral-950"
                  />
                  In stock
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-neutral-800">
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
                    className="h-12 w-full border border-neutral-300 bg-white pl-10 pr-3 text-base text-neutral-950 rtl:pl-3 rtl:pr-10"
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-neutral-800">
                {dictionary.shop.category}
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-12 border border-neutral-300 bg-white px-3 text-base text-neutral-950"
                >
                  <option value="">{labels.all}</option>
                  {categories.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {getLocalized(item.name, locale)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-neutral-800">
                {dictionary.shop.brand}
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="h-12 border border-neutral-300 bg-white px-3 text-base text-neutral-950"
                >
                  <option value="">{labels.all}</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-neutral-800">
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
                    className="h-12 border border-neutral-300 bg-white px-3 text-base text-neutral-950"
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
                    className="h-12 border border-neutral-300 bg-white px-3 text-base text-neutral-950"
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-neutral-800">
                {dictionary.shop.sort}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-12 border border-neutral-300 bg-white px-3 text-base text-neutral-950"
                >
                  <option value="featured">{labels.sortFeatured}</option>
                  <option value="new">{labels.sortNewest}</option>
                  <option value="price-asc">{labels.sortPriceAsc}</option>
                  <option value="price-desc">{labels.sortPriceDesc}</option>
                  <option value="rating">{labels.sortRating}</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 bg-[#f6f8f1] px-5 py-4">
              <a
                href={clearHref}
                className="inline-flex h-12 items-center justify-center text-sm font-medium text-neutral-600 underline underline-offset-4"
              >
                {labels.removeAll}
              </a>
              <Button type="button" onClick={applyFilters} className="h-12 bg-[#d1bd76] text-sm font-semibold text-white hover:bg-[#bfa85e]">
                {dictionary.actions.apply}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
