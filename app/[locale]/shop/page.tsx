import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { BackButton } from "@/components/ui/BackButton";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache";
import { getDictionary, isLocale } from "@/lib/i18n";
import {
  getStoreBrands,
  getStoreCategories,
  getStoreProducts,
  getStoreVariantColors,
  getStoreVariantSizes
} from "@/lib/storefront";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

type ShopPageProps = {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function readParam(searchParams: ShopPageProps["searchParams"], key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: params.locale === "ar" ? "المتجر" : "Shop",
    description: "Browse Best Mart products with storefront filters."
  };
}

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const category = readParam(searchParams, "category");
  const brand = readParam(searchParams, "brand");
  const color = readParam(searchParams, "color");
  const size = readParam(searchParams, "size");
  const rating = readParam(searchParams, "rating");
  const search = readParam(searchParams, "search");
  const sort = readParam(searchParams, "sort") ?? "featured";
  const tag = readParam(searchParams, "tag");
  const priceMin = readParam(searchParams, "priceMin");
  const priceMax = readParam(searchParams, "priceMax");
  const [categories, brands, colors, sizes, listing] = await Promise.all([
    getStoreCategories(),
    getStoreBrands(),
    getStoreVariantColors(),
    getStoreVariantSizes(),
    getStoreProducts({ category, brand, color, size, rating, search, sort, tag, priceMin, priceMax })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <BackButton
            label={locale === "ar" ? "رجوع" : "Back"}
            fallbackHref={`/${locale}`}
            className="mb-4"
          />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-700">
            {dictionary.nav.shop}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">{dictionary.shop.title}</h1>
          <p className="mt-3 max-w-2xl text-neutral-600">{dictionary.shop.subtitle}</p>
        </div>
        <p className="text-sm font-semibold text-neutral-500">
          {listing.length} {dictionary.shop.results}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <ProductFilters
          locale={locale}
          dictionary={dictionary}
          categories={categories}
          brands={brands}
          colors={colors}
          sizes={sizes}
          current={{ category, brand, color, size, rating, search, sort, tag, priceMin, priceMax }}
        />
        <section className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
          {listing.length > 0 ? (
            listing.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                locale={locale} 
                dictionary={dictionary}
                priority={index < 4} 
              />
            ))
          ) : (
            <div className="col-span-2 rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-soft xl:col-span-3">
              <h2 className="text-xl font-bold text-navy">
                {locale === "ar" ? "لم يتم العثور على منتجات" : "No products found"}
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                {locale === "ar"
                  ? "جرّب فئة أو علامة تجارية أو عبارة بحث مختلفة."
                  : "Try a different category, brand, or search term."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
