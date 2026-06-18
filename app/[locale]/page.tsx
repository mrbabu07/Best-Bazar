import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { CreditCard, HandCoins, RotateCcw, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import type { HeroSlide } from "@/components/home/HeroSlider";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache";
import { fallbackHeroImage, safeRemoteImage } from "@/lib/images";
import { getDictionary, getLocalized, isLocale } from "@/lib/i18n";
import { getActiveBanners, getFeaturedProducts, getNewArrivals, getStoreCategories } from "@/lib/storefront";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

const HeroSlider = dynamic(
  () => import("@/components/home/HeroSlider").then((module) => module.HeroSlider),
  {
    loading: () => <section className="min-h-[calc(100svh-9rem)] bg-navy" />
  }
);

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const title = params.locale === "ar" ? "بيست مارت" : "Best Mart";

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
  const heroSlides: HeroSlide[] = banners.map((banner) => {
    const desktopUrl = safeRemoteImage(banner.desktopImage, fallbackHeroImage, { width: 1800 });
    const mobileUrl = safeRemoteImage(banner.mobileImage, "", { width: 900 });
    
    // Detect if banner is a video
    const isDesktopVideo = Boolean(banner.desktopImage && (
      banner.desktopImage.includes('.mp4') || 
      banner.desktopImage.includes('.webm') || 
      banner.desktopImage.includes('.mov') ||
      banner.desktopImage.includes('/video/')
    ));
    
    return {
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
      desktopImage: isDesktopVideo ? banner.desktopImage : desktopUrl,
      mobileImage: mobileUrl,
      isVideo: isDesktopVideo
    };
  });
  const fallbackSlide: HeroSlide = {
    id: "fallback",
    title: dictionary.home.title,
    subtitle: dictionary.home.subtitle,
    buttonText: dictionary.actions.shopNow,
    href: `/${locale}/shop`,
    desktopImage: safeRemoteImage(fallbackHeroImage, fallbackHeroImage, { width: 1800 })
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

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf6_100%)] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="sm:hidden">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-gold-700">
                {dictionary.common.categories}
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-navy">{dictionary.home.categoryTitle}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
                Swipe to explore Dubai collections.
              </p>
            </div>
            <div className="hidden sm:block">
              <SectionHeader
                eyebrow={dictionary.common.categories}
                title={dictionary.home.categoryTitle}
                subtitle={dictionary.home.categorySubtitle}
              />
            </div>
            <div className="hidden rounded-xl border border-gold-200 bg-white px-4 py-3 text-right shadow-soft sm:block rtl:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-700">UAE curated</p>
              <p className="mt-1 text-sm font-bold text-navy">Dubai styles, gifts, and daily essentials</p>
            </div>
          </div>
          <div className="-mx-4 mt-6 grid auto-cols-[minmax(136px,42vw)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-8 sm:grid-flow-row sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${locale}/shop?category=${category.slug}`}
                className="group min-w-0 snap-start rounded-xl border border-neutral-200 bg-white p-2.5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold-200 hover:shadow-lift sm:p-3"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper sm:aspect-square sm:rounded-xl">
                  <Image
                    src={category.image}
                    alt={getLocalized(category.name, locale)}
                    fill
                    sizes="(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw"
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                  <span className="absolute right-2 top-2 rounded-full bg-white/92 px-2 py-1 text-[10px] font-black text-navy shadow-sm rtl:left-2 rtl:right-auto sm:hidden">
                    {category.productCount}
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="line-clamp-1 text-sm font-extrabold text-navy sm:text-base">{getLocalized(category.name, locale)}</h3>
                  <p className="mt-1 text-[11px] font-semibold text-neutral-500 sm:text-xs">{category.productCount} {dictionary.shop.results}</p>
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

      <section className="border-t border-gold-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: HandCoins, title: "Cash on delivery", detail: "Pay when your Dubai order arrives." },
              { icon: Truck, title: "Fast Dubai delivery", detail: "Area-based delivery timing at checkout." },
              { icon: CreditCard, title: "Secure payment", detail: "Stripe card checkout and admin payment visibility." },
              { icon: RotateCcw, title: "Return support", detail: "Clear support flow for returns and exchanges." }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex min-h-24 items-start gap-3 rounded-xl border border-gold-100 bg-paper px-4 py-4 shadow-soft">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-gold-700 shadow-sm">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-navy">{item.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">{item.detail}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
