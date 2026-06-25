"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type HomeFilterControlsProps = {
  locale: Locale;
  total: number;
  categories: Array<{ slug: string; label: string }>;
  current: {
    availability?: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
  };
};

const sortOptions = [
  { value: "new", label: "New arrivals" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" }
];

function FilterFields({ categories, current }: Pick<HomeFilterControlsProps, "categories" | "current">) {
  return (
    <>
      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        Availability
        <select
          name="availability"
          defaultValue={current.availability ?? ""}
          className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
        >
          <option value="">All products</option>
          <option value="in-stock">In stock</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        Category
        <select
          name="category"
          defaultValue={current.category ?? ""}
          className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
        >
          <option value="">All collections</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-2 text-sm font-medium text-neutral-700">
        Price
        <div className="grid grid-cols-2 gap-2">
          <input
            name="priceMin"
            type="number"
            min="0"
            step="1"
            defaultValue={current.priceMin ?? ""}
            placeholder="From"
            className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
          />
          <input
            name="priceMax"
            type="number"
            min="0"
            step="1"
            defaultValue={current.priceMax ?? ""}
            placeholder="To"
            className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
          />
        </div>
      </div>
      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        Sort by
        <select
          name="sort"
          defaultValue={current.sort ?? "new"}
          className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function HomeFilterControls({ locale, total, categories, current }: HomeFilterControlsProps) {
  const [open, setOpen] = useState(false);
  const action = `/${locale}`;

  return (
    <>
      <div className="mt-10 hidden items-center justify-between gap-6 lg:flex">
        <form action={action} className="flex flex-wrap items-end gap-8">
          <span className="pb-3 text-xl font-medium text-neutral-700">Filter:</span>
          <input type="hidden" name="page" value="1" />
          <label className="grid gap-1 text-base font-medium text-neutral-600">
            Availability
            <select name="availability" defaultValue={current.availability ?? ""} className="h-10 min-w-36 border-0 bg-transparent text-lg text-neutral-950">
              <option value="">All</option>
              <option value="in-stock">In stock</option>
            </select>
          </label>
          <label className="grid gap-1 text-base font-medium text-neutral-600">
            Category
            <select name="category" defaultValue={current.category ?? ""} className="h-10 min-w-44 border-0 bg-transparent text-lg text-neutral-950">
              <option value="">All collections</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.label}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-1 text-base font-medium text-neutral-600">
            Price
            <div className="flex gap-2">
              <input name="priceMin" type="number" min="0" defaultValue={current.priceMin ?? ""} placeholder="From" className="h-10 w-24 border-b border-neutral-400 bg-transparent text-lg text-neutral-950 placeholder:text-neutral-400" />
              <input name="priceMax" type="number" min="0" defaultValue={current.priceMax ?? ""} placeholder="To" className="h-10 w-24 border-b border-neutral-400 bg-transparent text-lg text-neutral-950 placeholder:text-neutral-400" />
            </div>
          </div>
          <button type="submit" className="h-10 bg-neutral-950 px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white">
            Apply
          </button>
        </form>
        <form action={action} className="flex items-end gap-8">
          <input type="hidden" name="availability" value={current.availability ?? ""} />
          <input type="hidden" name="category" value={current.category ?? ""} />
          <input type="hidden" name="priceMin" value={current.priceMin ?? ""} />
          <input type="hidden" name="priceMax" value={current.priceMax ?? ""} />
          <input type="hidden" name="page" value="1" />
          <label className="grid gap-1 text-base font-medium text-neutral-600">
            Sort by
            <select name="sort" defaultValue={current.sort ?? "new"} onChange={(event) => event.currentTarget.form?.requestSubmit()} className="h-10 min-w-52 border-0 bg-transparent text-lg text-neutral-950">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <span className="pb-2 text-lg text-neutral-600">{total} products</span>
        </form>
      </div>

      <div className="mt-8 flex items-center justify-between lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600">
          <SlidersHorizontal size={16} />
          Filter and sort
        </button>
        <span className="text-sm text-neutral-500">{total} products</span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-black/50 lg:hidden">
          <form action={action} className="ml-auto grid h-full w-[min(100%,352px)] grid-rows-[auto_1fr_auto] bg-[#f6f8f1] text-neutral-950">
            <div className="border-b border-neutral-200 px-5 py-4 text-center">
              <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center" aria-label="Close filters">
                <X size={22} />
              </button>
              <p className="text-base font-medium">Filter and sort</p>
              <p className="text-xs text-neutral-500">{total} products</p>
            </div>
            <div className="grid content-start gap-5 overflow-y-auto px-5 py-7">
              <input type="hidden" name="page" value="1" />
              <FilterFields categories={categories} current={current} />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 bg-[#f6f8f1] px-5 py-4">
              <a href={action} className="inline-flex h-12 items-center justify-center text-sm font-medium text-neutral-600 underline underline-offset-4">
                Remove all
              </a>
              <button type="submit" className="h-12 bg-[#d1bd76] text-sm font-semibold text-white">
                Apply
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
