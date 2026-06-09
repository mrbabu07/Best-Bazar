import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetail } from "@/components/product/ProductDetail";
import { ProductReviews } from "@/components/product/ProductReviews";
import { BackButton } from "@/components/ui/BackButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";
import { getProductBySlugOrId, getProductReviews, getRelatedProducts } from "@/lib/storefront";

export const revalidate = 60;

type ProductPageProps = {
  params: {
    locale: string;
    id: string;
  };
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlugOrId(params.id);
  const locale = params.locale === "ar" ? "ar" : "en";

  return {
    title: product ? product.name[locale] : "Product",
    description: product ? product.description[locale] : undefined
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const product = await getProductBySlugOrId(params.id);

  if (!product) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const [related, reviews] = await Promise.all([
    getRelatedProducts(product.category, product.id, 4),
    getProductReviews(product.id)
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BackButton
        label={locale === "ar" ? "رجوع" : "Back"}
        fallbackHref={`/${locale}/shop`}
        className="mb-6"
      />
      <ProductDetail product={product} locale={locale} dictionary={dictionary} />

      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        locale={locale}
        initialRating={product.rating}
        initialReviewCount={product.reviewCount}
        initialReviews={reviews}
      />

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
