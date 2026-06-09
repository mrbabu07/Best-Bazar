import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroSlider, type HeroSlide } from "@/components/home/HeroSlider";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fallbackHeroImage, safeRemoteImage } from "@/lib/images";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";
import { getActiveBanners, getFeaturedProducts, getNewArrivals, getStoreCategories } from "@/lib/storefront";

export const revalidate = 60;

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const title = params.locale === "ar" ? "بيست بازار" : "Best Bazar";

  return {
    title,
    description: "Dubai luxury ecommerce storefront for premium products."
  };
}

function getLocalizedPath(locale: string, href?: string | null) {
  if (!href) {
    return `/${locale}/shop`;
  }

  if (href.startsWith("http")) {
    return href;
  }

  if (href.startsWith("/en/") || href.startsWith("/ar/")) {
    return href.replace(/^\/(en|ar)/, `/${locale}`);
  }

  if (href.startsWith("/")) {
    return `/${locale}${href}`;
  }

  return `/${locale}/${href}`;
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const [featuredProducts, newArrivals, categories, banners] = await Promise.all([
    getFeaturedProducts(4),
    getNewArrivals(4),
    getStoreCategories(),
    getActiveBanners(3)
  ]);
  const heroSlides: HeroSlide[] = banners.map((banner) => ({
    id: banner.id,
    title: locale === "ar" ? banner.titleAr : banner.titleEn,
    subtitle:
      locale === "ar"
        ? banner.subtitleAr || dictionary.home.subtitle
        : banner.subtitleEn || dictionary.home.subtitle,
    buttonText:
      locale === "ar"
        ? banner.buttonTextAr || dictionary.actions.shopNow
        : banner.buttonTextEn || dictionary.actions.shopNow,
    href: getLocalizedPath(locale, banner.buttonLink),
    desktopImage: safeRemoteImage(banner.desktopImage, fallbackHeroImage),
    mobileImage: safeRemoteImage(banner.mobileImage, "")
  }));
  const fallbackSlide: HeroSlide = {
    id: "fallback",
    title: dictionary.home.title,
    subtitle: dictionary.home.subtitle,
    buttonText: dictionary.actions.shopNow,
    href: `/${locale}/shop`,
    desktopImage: fallbackHeroImage
  };

  return (
    <main>
      <HeroSlider
        locale={locale}
        eyebrow={dictionary.home.eyebrow}
        slides={heroSlides}
        fallbackSlide={fallbackSlide}
        secondaryHref={`/${locale}/shop?tag=new`}
        secondaryLabel={dictionary.actions.viewCollection}
        metrics={[dictionary.home.heroMetricOne, dictionary.home.heroMetricTwo, dictionary.home.heroMetricThree]}
      />

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={dictionary.common.categories}
            title={dictionary.home.categoryTitle}
            subtitle={dictionary.home.categorySubtitle}
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
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
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm font-bold text-navy sm:text-base">{getLocalized(category.name, locale)}</h3>
                  <p className="mt-1 text-xs text-neutral-500 sm:text-sm">{category.productCount} {dictionary.shop.results}</p>
                </div>
              </Link>
            ))}
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
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={dictionary.common.newArrivals}
          title={dictionary.home.arrivalTitle}
          subtitle={dictionary.home.arrivalSubtitle}
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      </section>
    </main>
  );
}
