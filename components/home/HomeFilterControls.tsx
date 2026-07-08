"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
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
  { value: "new", labelEn: "New arrivals", labelAr: "وصل حديثاً" },
  { value: "featured", labelEn: "Featured", labelAr: "مميز" },
  { value: "price-asc", labelEn: "Price low to high", labelAr: "السعر من الأقل إلى الأعلى" },
  { value: "price-desc", labelEn: "Price high to low", labelAr: "السعر من الأعلى إلى الأقل" }
];

function sortLabel(value: string | undefined, locale: Locale) {
  const option = sortOptions.find((item) => item.value === value) ?? sortOptions[0];
  return locale === "ar" ? option.labelAr : option.labelEn;
}

function FilterFields({ categories, current, locale }: Pick<HomeFilterControlsProps, "categories" | "current" | "locale">) {
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;
  return (
    <>
      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        {t("Availability", "التوفر")}
        <select
          name="availability"
          defaultValue={current.availability ?? ""}
          className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
        >
          <option value="">{t("All products", "كل المنتجات")}</option>
          <option value="in-stock">{t("In stock", "متوفر")}</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        {t("Category", "الفئة")}
        <select
          name="category"
          defaultValue={current.category ?? ""}
          className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
        >
          <option value="">{t("All collections", "كل المجموعات")}</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-2 text-sm font-medium text-neutral-700">
        {t("Price", "السعر")}
        <div className="grid grid-cols-2 gap-2">
          <input
            name="priceMin"
            type="number"
            min="0"
            step="1"
            defaultValue={current.priceMin ?? ""}
            placeholder={t("From", "من")}
            className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
          />
          <input
            name="priceMax"
            type="number"
            min="0"
            step="1"
            defaultValue={current.priceMax ?? ""}
            placeholder={t("To", "إلى")}
            className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
          />
        </div>
      </div>
      <label className="grid gap-2 text-sm font-medium text-neutral-700">
        {t("Sort by", "ترتيب حسب")}
        <select
          name="sort"
          defaultValue={current.sort ?? "new"}
          className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {locale === "ar" ? option.labelAr : option.labelEn}
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
  const t = (en: string, ar: string) => locale === "ar" ? ar : en;

  return (
    <>
      <div className="hidden items-center justify-between gap-8 border-b border-[#ded8ca] pb-5 lg:flex">
        <div className="flex items-center gap-10">
          <span className="text-base font-medium text-neutral-700">{t("Filter:", "تصفية:")}</span>
          <form action={action} className="flex items-center gap-7">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="priceMin" value={current.priceMin ?? ""} />
            <input type="hidden" name="priceMax" value={current.priceMax ?? ""} />
            <input type="hidden" name="sort" value={current.sort ?? "new"} />
            <input type="hidden" name="category" value={current.category ?? ""} />
            <select
              name="availability"
              defaultValue={current.availability ?? ""}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="h-10 min-w-36 border-0 bg-transparent text-base font-medium text-neutral-700 outline-none"
              aria-label="Availability"
            >
              <option value="">{t("Availability", "التوفر")}</option>
              <option value="in-stock">{t("In stock", "متوفر")}</option>
            </select>
          </form>
          <form action={action} className="flex items-center">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="availability" value={current.availability ?? ""} />
            <input type="hidden" name="priceMin" value={current.priceMin ?? ""} />
            <input type="hidden" name="priceMax" value={current.priceMax ?? ""} />
            <input type="hidden" name="sort" value={current.sort ?? "new"} />
            <select
              name="category"
              defaultValue={current.category ?? ""}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="h-10 min-w-44 border-0 bg-transparent text-base font-medium text-neutral-700 outline-none"
              aria-label="Category"
            >
              <option value="">{t("Category", "الفئة")}</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </form>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-medium text-neutral-700 [&::-webkit-details-marker]:hidden">
              {t("Price", "السعر")}
              <ChevronDown size={18} className="transition group-open:rotate-180" />
            </summary>
            <form action={action} className="absolute left-0 top-10 z-20 grid w-80 gap-4 border border-neutral-200 bg-[#f6f8f1] p-5 shadow-xl">
              <input type="hidden" name="availability" value={current.availability ?? ""} />
              <input type="hidden" name="category" value={current.category ?? ""} />
              <input type="hidden" name="sort" value={current.sort ?? "new"} />
              <input type="hidden" name="page" value="1" />
              <div className="grid grid-cols-2 gap-3">
                <input name="priceMin" type="number" min="0" defaultValue={current.priceMin ?? ""} placeholder={t("From", "من")} className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950 placeholder:text-neutral-400" />
                <input name="priceMax" type="number" min="0" defaultValue={current.priceMax ?? ""} placeholder={t("To", "إلى")} className="h-12 rounded-none border border-neutral-300 bg-white px-3 text-base text-neutral-950 placeholder:text-neutral-400" />
              </div>
              <button type="submit" className="h-11 bg-neutral-950 px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white">
                {t("Apply", "تطبيق")}
              </button>
            </form>
          </details>
        </div>
        <form action={action} className="flex items-center gap-7">
          <input type="hidden" name="availability" value={current.availability ?? ""} />
          <input type="hidden" name="category" value={current.category ?? ""} />
          <input type="hidden" name="priceMin" value={current.priceMin ?? ""} />
          <input type="hidden" name="priceMax" value={current.priceMax ?? ""} />
          <input type="hidden" name="page" value="1" />
          <label className="flex items-center gap-3 text-base font-medium text-neutral-700">
            <span>{t("Sort by:", "ترتيب حسب:")}</span>
            <select name="sort" defaultValue={current.sort ?? "new"} onChange={(event) => event.currentTarget.form?.requestSubmit()} className="h-10 min-w-44 border-0 bg-transparent text-base font-medium text-neutral-700 outline-none" aria-label={`${t("Sort by", "ترتيب حسب")} ${sortLabel(current.sort, locale)}`}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{locale === "ar" ? option.labelAr : option.labelEn}</option>
              ))}
            </select>
          </label>
          <span className="text-base font-medium text-neutral-600">{total} {t("products", "منتج")}</span>
        </form>
      </div>

      <div className="flex items-center justify-between lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 lg:text-[1.15rem]">
          <SlidersHorizontal size={16} />
          {t("Filter and sort", "التصفية والترتيب")}
        </button>
        <span className="text-sm text-neutral-500 lg:text-[1.15rem]">{total} {t("products", "منتج")}</span>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-black/50">
          <form action={action} className="ml-auto grid h-full w-[min(100%,420px)] grid-rows-[auto_1fr_auto] bg-[#f4f1e8] text-neutral-950 shadow-2xl">
            <div className="border-b border-neutral-200 px-5 py-4 text-center">
              <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center" aria-label="Close filters">
                <X size={22} />
              </button>
              <p className="text-base font-medium">{t("Filter and sort", "التصفية والترتيب")}</p>
              <p className="text-xs text-neutral-500">{total} {t("products", "منتج")}</p>
            </div>
            <div className="grid content-start gap-5 overflow-y-auto px-5 py-7">
              <input type="hidden" name="page" value="1" />
              <FilterFields categories={categories} current={current} locale={locale} />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 bg-[#f6f8f1] px-5 py-4">
              <a href={action} className="inline-flex h-12 items-center justify-center text-sm font-medium text-neutral-600 underline underline-offset-4">
                {t("Remove all", "إزالة الكل")}
              </a>
              <button type="submit" className="h-12 bg-[#d1bd76] text-sm font-semibold text-white">
                {t("Apply", "تطبيق")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
