import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { HeroSlide } from "@/components/home/HeroSlider";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache";
import { getHomepageSections, type HomepageSection } from "@/lib/homepage-sections";
import { fallbackHeroImage, safeRemoteImage } from "@/lib/images";
import { getDictionary, getLocalized, isLocale, type Locale } from "@/lib/i18n";
import { getActiveBanners, getFeaturedProducts, getNewArrivals, getStoreCategories, getStoreProducts } from "@/lib/storefront";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;
export const dynamic = "force-dynamic";

const HeroSlider = nextDynamic(() => import("@/components/home/HeroSlider").then((module) => module.HeroSlider), {
  loading: () => <section className="min-h-[420px] bg-neutral-100" />
});

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return { title: params.locale === "ar" ? "Best Mart" : "Best Mart", description: "Dubai online shopping." };
}

function pathFor(locale: Locale, href?: string) {
  if (!href) return `/${locale}/shop`;
  if (href.startsWith("http")) return href;
  if (href.startsWith("/en/") || href.startsWith("/ar/")) return href.replace(/^\/(en|ar)/, `/${locale}`);
  return href.startsWith("/") ? `/${locale}${href}` : `/${locale}/${href}`;
}

async function productsForSection(section: HomepageSection) {
  const { config } = section;
  const limit = config.limit ?? 4;
  if (config.source === "NEW") return (await getNewArrivals(limit)).slice(0, limit);
  if (config.source === "CATEGORY") return (await getStoreProducts({ category: config.categorySlug, sort: "featured" })).slice(0, limit);
  if (config.source === "TAG") return (await getStoreProducts({ tag: config.tag, sort: "featured" })).slice(0, limit);
  return (await getFeaturedProducts(limit)).slice(0, limit);
}

async function HomepageSectionRenderer({ locale, sections }: { locale: Locale; sections: HomepageSection[] }) {
  const dictionary = getDictionary(locale);
  const categories = await getStoreCategories();
  const fallbackSections: HomepageSection[] = [
    { id: "fallback-categories", type: "CATEGORY_GRID", title: { en: "Shop by category", ar: "تسوق حسب الفئة" }, subtitle: { en: "", ar: "" }, config: { categoryLimit: 6, actionLink: "/shop" }, sortOrder: 1, isActive: true },
    { id: "fallback-featured", type: "PRODUCT_GRID", title: { en: "Exclusive Sale", ar: "عروض حصرية" }, subtitle: { en: "", ar: "" }, config: { source: "FEATURED", limit: 4, actionLink: "/shop" }, sortOrder: 2, isActive: true },
    { id: "fallback-new", type: "PRODUCT_GRID", title: { en: "New Arrival", ar: "وصل حديثا" }, subtitle: { en: "", ar: "" }, config: { source: "NEW", limit: 4, actionLink: "/shop?sort=new" }, sortOrder: 3, isActive: true }
  ];
  const visibleSections = sections.length ? sections : fallbackSections;

  return <>{await Promise.all(visibleSections.map(async (section) => {
    const title = getLocalized(section.title, locale) || (section.type === "CATEGORY_GRID" ? dictionary.home.categoryTitle : dictionary.home.featuredTitle);
    const subtitle = getLocalized(section.subtitle, locale);
    const actionHref = pathFor(locale, section.config.actionLink);
    if (section.type === "CATEGORY_PRODUCT_ROWS") {
      const rows = await Promise.all(
        categories
          .filter((category) => category.productCount > 0)
          .map(async (category) => ({
            category,
            products: (await getStoreProducts({ category: category.slug, sort: "featured" })).slice(0, section.config.limit ?? 5)
          }))
      );

      return <section key={section.id} className="bg-white py-12 sm:py-16"><div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">{rows.map(({ category, products }) => products.length ? <div key={category.id} className="mb-14 last:mb-0"><SectionHeader title={getLocalized(category.name, locale)} action={<Link href={`/${locale}/shop?category=${category.slug}`} className="text-sm font-medium text-neutral-900 underline underline-offset-4">{section.config.actionLabelEn || "View all"}</Link>} /><div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">{products.map((product, index) => <div key={product.id} className="w-[calc((100vw-44px)/2)] shrink-0 snap-start sm:w-[230px] lg:w-[260px]"><ProductCard product={product} locale={locale} dictionary={dictionary} priority={index < 2} showQuickAdd={false} /></div>)}</div></div> : null)}</div></section>;
    }
    if (section.type === "CATEGORY_GRID") {
      return <section key={section.id} className="border-b border-neutral-100 bg-white py-12 sm:py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeader eyebrow={dictionary.common.categories} title={title} subtitle={subtitle} action={<Link href={actionHref} className="text-sm font-bold text-neutral-800 underline underline-offset-4">{section.config.actionLabelEn || "View all"}</Link>} /><div className="-mx-4 mt-8 grid auto-cols-[minmax(150px,43vw)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid-flow-row sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">{categories.slice(0, section.config.categoryLimit ?? 6).map((category) => <Link key={category.id} href={`/${locale}/shop?category=${category.slug}`} className="group min-w-0"><div className="relative aspect-[3/4] overflow-hidden bg-neutral-100"><Image src={category.image} alt={getLocalized(category.name, locale)} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 43vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" /></div><h3 className="mt-3 text-sm font-semibold tracking-wide text-neutral-900">{getLocalized(category.name, locale)}</h3></Link>)}</div></div></section>;
    }
    const products = await productsForSection(section);
    return <section key={section.id} className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8"><SectionHeader eyebrow={section.config.source === "NEW" ? dictionary.common.newArrivals : dictionary.common.featured} title={title} subtitle={subtitle} action={<Link href={actionHref} className="text-sm font-bold text-neutral-800 underline underline-offset-4">{section.config.actionLabelEn || "View all"}</Link>} /><div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">{products.map((product, index) => <div key={product.id} className="w-[calc((100vw-44px)/2)] shrink-0 snap-start sm:w-[230px] lg:w-[260px]"><ProductCard product={product} locale={locale} dictionary={dictionary} priority={index < 2} /></div>)}</div></section>;
  }))}</>;
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const dictionary = getDictionary(locale);
  const [banners, sections] = await Promise.all([getActiveBanners(3), getHomepageSections()]);
  const slides: HeroSlide[] = banners.map((banner) => ({
    id: banner.id,
    title: locale === "ar" ? banner.titleAr : banner.titleEn,
    subtitle: locale === "ar" ? banner.subtitleAr || "" : banner.subtitleEn || "",
    buttonText: locale === "ar" ? banner.buttonTextAr || dictionary.actions.shopNow : banner.buttonTextEn || dictionary.actions.shopNow,
    href: pathFor(locale, banner.buttonLink),
    desktopImage: safeRemoteImage(banner.desktopImage, fallbackHeroImage, { width: 1800 }),
    mobileImage: safeRemoteImage(banner.mobileImage, "", { width: 900 }) || undefined,
    isVideo: Boolean(banner.desktopImage.includes("/video/") || /\.(mp4|webm|mov)(\?|$)/i.test(banner.desktopImage))
  }));
  const fallbackSlide: HeroSlide = { id: "fallback", title: dictionary.home.title, subtitle: dictionary.home.subtitle, buttonText: dictionary.actions.shopNow, href: `/${locale}/shop`, desktopImage: safeRemoteImage(fallbackHeroImage, fallbackHeroImage, { width: 1800 }) };
  return <main><HeroSlider locale={locale} eyebrow={dictionary.home.eyebrow} slides={slides} fallbackSlide={fallbackSlide} secondaryHref={`/${locale}/shop`} secondaryLabel={dictionary.actions.viewCollection} metrics={[]} /><HomepageSectionRenderer locale={locale} sections={sections} /></main>;
}
