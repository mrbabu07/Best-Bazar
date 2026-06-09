import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetail } from "@/components/product/ProductDetail";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { products } from "@/lib/data";
import { getDictionary, getLocalized, isLocale, locales } from "@/lib/i18n";

type ProductPageProps = {
  params: {
    locale: string;
    id: string;
  };
};

function findProduct(id: string) {
  return products.find((product) => product.slug === id || product.id === id);
}

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    products.map((product) => ({
      locale,
      id: product.slug
    }))
  );
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = findProduct(params.id);

  return {
    title: product ? product.name[params.locale === "ar" ? "ar" : "en"] : "Product",
    description: product ? product.description[params.locale === "ar" ? "ar" : "en"] : undefined
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const product = findProduct(params.id);

  if (!product) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductDetail product={product} locale={locale} dictionary={dictionary} />

      <section className="mt-16">
        <SectionHeader title={dictionary.product.related} subtitle={getLocalized(product.description, locale)} />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      </section>
    </main>
  );
}
