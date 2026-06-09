import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { categories, products } from "@/lib/data";
import { getDictionary, isLocale } from "@/lib/i18n";

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
    description: "Browse Best Bazar products with storefront filters."
  };
}

export default function ShopPage({ params, searchParams }: ShopPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const category = readParam(searchParams, "category");
  const brand = readParam(searchParams, "brand");
  const rating = readParam(searchParams, "rating");
  const sort = readParam(searchParams, "sort") ?? "featured";
  const priceMax = readParam(searchParams, "priceMax");
  const brands = Array.from(new Set(products.map((product) => product.brand))).sort();

  let listing = products.filter((product) => product.isActive);

  if (category) {
    listing = listing.filter((product) => product.category === category);
  }

  if (brand) {
    listing = listing.filter((product) => product.brand === brand);
  }

  if (rating) {
    listing = listing.filter((product) => product.rating >= Number(rating));
  }

  if (priceMax) {
    listing = listing.filter((product) => product.price <= Number(priceMax));
  }

  listing = [...listing].sort((first, second) => {
    if (sort === "price-asc") return first.price - second.price;
    if (sort === "price-desc") return second.price - first.price;
    if (sort === "rating") return second.rating - first.rating;
    if (sort === "new") return Date.parse(second.createdAt) - Date.parse(first.createdAt);
    return Number(second.isFeatured) - Number(first.isFeatured);
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
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
          current={{ category, brand, rating, sort, priceMax }}
        />
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listing.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} dictionary={dictionary} />
          ))}
        </section>
      </div>
    </main>
  );
}
