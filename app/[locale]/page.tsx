import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Truck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { categories, products } from "@/lib/data";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const title = params.locale === "ar" ? "بيست بازار" : "Best Bazar";

  return {
    title,
    description: "Dubai luxury ecommerce storefront for premium products."
  };
}

export default function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const featuredProducts = products.filter((product) => product.isFeatured).slice(0, 4);
  const newArrivals = [...products]
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
    .slice(0, 4);

  return (
    <main>
      <section className="relative min-h-[calc(100svh-9rem)] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=85"
          alt="Dubai skyline at sunset"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/68 to-navy/15 rtl:bg-gradient-to-l" />
        <div className="relative mx-auto flex min-h-[calc(100svh-9rem)] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-gold-200">
              <Sparkles size={17} />
              {dictionary.home.eyebrow}
            </p>
            <h1 className="mt-5 text-5xl font-bold sm:text-6xl lg:text-7xl">{dictionary.home.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/84 sm:text-lg">
              {dictionary.home.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/shop`}
                className="inline-flex h-12 items-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-6 text-sm font-bold text-navy shadow-soft hover:from-gold-400 hover:to-gold-200"
              >
                {dictionary.actions.shopNow}
                <ArrowRight size={18} className="rtl:rotate-180" />
              </Link>
              <Link
                href={`/${locale}/shop?tag=new`}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/30 px-6 text-sm font-bold text-white backdrop-blur hover:bg-white/10"
              >
                <Truck size={18} />
                {dictionary.actions.viewCollection}
              </Link>
            </div>
            <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[dictionary.home.heroMetricOne, dictionary.home.heroMetricTwo, dictionary.home.heroMetricThree].map(
                (metric) => (
                  <div key={metric} className="border-l border-gold-300/60 pl-4 text-sm font-semibold text-white/90 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
                    {metric}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={dictionary.common.featured}
          title={dictionary.home.featuredTitle}
          subtitle={dictionary.home.featuredSubtitle}
          action={
            <Link href={`/${locale}/shop`} className="text-sm font-bold text-gold-700 hover:text-gold-800">
              {dictionary.actions.viewCollection}
            </Link>
          }
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={dictionary.common.categories}
            title={dictionary.home.categoryTitle}
            subtitle={dictionary.home.categorySubtitle}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/shop?category=${category.slug}`}
                className="group overflow-hidden rounded-lg border border-neutral-200 bg-paper shadow-soft"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={category.image}
                    alt={getLocalized(category.name, locale)}
                    fill
                    sizes="(min-width: 1024px) 20vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-navy">{getLocalized(category.name, locale)}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{category.productCount} {dictionary.shop.results}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={dictionary.common.newArrivals}
          title={dictionary.home.arrivalTitle}
          subtitle={dictionary.home.arrivalSubtitle}
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      </section>
    </main>
  );
}
