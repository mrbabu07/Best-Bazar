import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetail } from "@/components/product/ProductDetail";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";
import { getProductBySlugOrId, getRelatedProducts } from "@/lib/storefront";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: {
    locale: string;
    id: string;
  };
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  noStore();
  const product = await getProductBySlugOrId(params.id);
  const locale = params.locale === "ar" ? "ar" : "en";

  return {
    title: product ? product.name[locale] : "Product",
    description: product ? product.description[locale] : undefined
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  noStore();
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const product = await getProductBySlugOrId(params.id);

  if (!product) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const related = await getRelatedProducts(product.category, product.id, 4);

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
