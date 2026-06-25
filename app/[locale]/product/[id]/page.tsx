import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetail } from "@/components/product/ProductDetail";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";
import { getProductBySlugOrId, getProductReviews, getRelatedProducts } from "@/lib/storefront";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;
export const dynamic = "force-dynamic";

const ProductReviews = nextDynamic(
  () => import("@/components/product/ProductReviews").then((module) => module.ProductReviews),
  {
    loading: () => <div className="mt-16 rounded-lg border border-neutral-200 bg-white p-6 shadow-soft" />
  }
);

type ProductPageProps = {
  params: {
    locale: string;
    id: string;
  };
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlugOrId(params.id);
  const locale = params.locale === "ar" ? "ar" : "en";
  const title = product?.seo?.title?.[locale] || product?.name[locale] || "Product";
  const description = product?.seo?.description?.[locale] || product?.description[locale];
  const ogImage = product?.seo?.ogImage || product?.images[0]?.url;

  return {
    title,
    description,
    openGraph: product
      ? {
          title,
          description,
          type: "website",
          images: ogImage ? [{ url: ogImage, alt: product.name[locale] }] : undefined
        }
      : undefined
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  const productUrl = siteUrl ? `${siteUrl}/${locale}/product/${product.slug}` : undefined;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: getLocalized(product.name, locale),
    description: product.seo?.description?.[locale] || getLocalized(product.description, locale),
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand
    },
    image: product.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "AED",
      price: product.price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: productUrl
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount
          }
        }
      : {})
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 lg:px-12">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
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
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      </section>
    </main>
  );
}
