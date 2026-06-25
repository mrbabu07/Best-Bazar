import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { HomeFilterControls } from "@/components/home/HomeFilterControls";
import type { HeroSlide } from "@/components/home/HeroSlider";
import { NewsletterSignup } from "@/components/home/NewsletterSignup";
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

function readSearchValue(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildHomePageHref(
  locale: Locale,
  current: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return `/${locale}${params.toString() ? `?${params.toString()}` : ""}`;
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
  fallbackSections.push({
    id: "fallback-category-rows",
    type: "CATEGORY_PRODUCT_ROWS",
    title: { en: "Collections", ar: "Collections" },
    subtitle: { en: "", ar: "" },
    config: { source: "CATEGORY", limit: 5, actionLabelEn: "View all" },
    sortOrder: 4,
    isActive: true
  });
  const visibleSections = sections.length
    ? sections.some((section) => section.type === "CATEGORY_PRODUCT_ROWS")
      ? sections
      : [
          ...sections,
          {
            id: "auto-category-rows",
            type: "CATEGORY_PRODUCT_ROWS" as const,
            title: { en: "Collections", ar: "Collections" },
            subtitle: { en: "", ar: "" },
            config: { source: "CATEGORY" as const, limit: 5, actionLabelEn: "View all" },
            sortOrder: 999,
            isActive: true
          }
        ]
    : fallbackSections;

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

      return <section key={section.id} className="bg-white py-12 sm:py-20"><div className="mx-auto max-w-[1540px] px-4 sm:px-8 lg:px-12">{rows.map(({ category, products }) => products.length ? <div key={category.id} className="mb-16 last:mb-0"><SectionHeader title={getLocalized(category.name, locale)} action={<Link href={`/${locale}/shop?category=${category.slug}`} className="text-sm font-medium text-neutral-900 underline underline-offset-4">{section.config.actionLabelEn || "View all"}</Link>} /><div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">{products.map((product, index) => <div key={product.id} className="w-[calc((100vw-44px)/2)] shrink-0 snap-start sm:w-[250px] lg:w-[300px] xl:w-[330px]"><ProductCard product={product} locale={locale} dictionary={dictionary} priority={index < 2} showQuickAdd={false} /></div>)}</div></div> : null)}</div></section>;
    }
    if (section.type === "CATEGORY_GRID") {
      return <section key={section.id} className="border-b border-neutral-100 bg-white py-12 sm:py-16"><div className="mx-auto max-w-[1540px] px-4 sm:px-8 lg:px-12"><SectionHeader eyebrow={dictionary.common.categories} title={title} subtitle={subtitle} action={<Link href={actionHref} className="text-sm font-bold text-neutral-800 underline underline-offset-4">{section.config.actionLabelEn || "View all"}</Link>} /><div className="-mx-4 mt-8 grid auto-cols-[minmax(150px,43vw)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid-flow-row sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">{categories.slice(0, section.config.categoryLimit ?? 6).map((category) => <Link key={category.id} href={`/${locale}/shop?category=${category.slug}`} className="group min-w-0"><div className="relative aspect-[3/4] overflow-hidden bg-neutral-100"><Image src={category.image} alt={getLocalized(category.name, locale)} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 43vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" /></div><h3 className="mt-3 text-sm font-semibold tracking-wide text-neutral-900">{getLocalized(category.name, locale)}</h3></Link>)}</div></div></section>;
    }
    const products = await productsForSection(section);
    return <section key={section.id} className="mx-auto max-w-[1540px] px-4 py-12 sm:px-8 sm:py-16 lg:px-12"><SectionHeader eyebrow={section.config.source === "NEW" ? dictionary.common.newArrivals : dictionary.common.featured} title={title} subtitle={subtitle} action={<Link href={actionHref} className="text-sm font-bold text-neutral-800 underline underline-offset-4">{section.config.actionLabelEn || "View all"}</Link>} /><div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">{products.map((product, index) => <div key={product.id} className="w-[calc((100vw-44px)/2)] shrink-0 snap-start sm:w-[250px] lg:w-[300px] xl:w-[330px]"><ProductCard product={product} locale={locale} dictionary={dictionary} priority={index < 2} /></div>)}</div></section>;
  }))}</>;
}

async function HomeProductExplorer({
  locale,
  searchParams
}: {
  locale: Locale;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const dictionary = getDictionary(locale);
  const pageSize = 8;
  const current = {
    availability: readSearchValue(searchParams, "availability") ?? "",
    category: readSearchValue(searchParams, "category") ?? "",
    priceMin: readSearchValue(searchParams, "priceMin") ?? "",
    priceMax: readSearchValue(searchParams, "priceMax") ?? "",
    sort: readSearchValue(searchParams, "sort") ?? "new"
  };
  const page = Math.max(1, Number(readSearchValue(searchParams, "page") ?? "1") || 1);
  const [categories, allProducts] = await Promise.all([
    getStoreCategories(),
    getStoreProducts({
      availability: current.availability,
      category: current.category,
      priceMin: current.priceMin,
      priceMax: current.priceMax,
      sort: current.sort
    })
  ]);
  const totalPages = Math.max(1, Math.ceil(allProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const products = allProducts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const filterHrefState = {
    availability: current.availability,
    category: current.category,
    priceMin: current.priceMin,
    priceMax: current.priceMax,
    sort: current.sort === "new" ? undefined : current.sort
  };

  return (
    <section className="bg-[#f6f8f1] px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[1720px]">
        <h2 className="font-serif text-[3.1rem] font-normal leading-none text-neutral-950 sm:text-[5rem]">
          New Arrivals
        </h2>
        <HomeFilterControls
          locale={locale}
          total={allProducts.length}
          categories={categories.map((category) => ({
            slug: category.slug,
            label: getLocalized(category.name, locale)
          }))}
          current={current}
        />
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:mt-12 lg:grid-cols-4 lg:gap-x-12 lg:gap-y-14">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              dictionary={dictionary}
              priority={index < 4}
            />
          ))}
        </div>
        {!products.length ? (
          <div className="mt-10 border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium text-neutral-950">No products matched this filter.</p>
            <Link href={`/${locale}`} className="mt-4 inline-flex text-sm font-medium text-neutral-600 underline underline-offset-4">
              Remove filters
            </Link>
          </div>
        ) : null}
        {totalPages > 1 ? (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Home product pages">
            <Link
              href={buildHomePageHref(locale, filterHrefState, Math.max(1, safePage - 1))}
              className={`inline-flex h-11 min-w-11 items-center justify-center border px-4 text-sm font-semibold ${
                safePage === 1 ? "pointer-events-none border-neutral-200 text-neutral-300" : "border-neutral-300 text-neutral-950 hover:border-neutral-950"
              }`}
            >
              Prev
            </Link>
            {Array.from({ length: totalPages }).map((_, index) => {
              const nextPage = index + 1;
              return (
                <Link
                  key={nextPage}
                  href={buildHomePageHref(locale, filterHrefState, nextPage)}
                  className={`inline-flex h-11 min-w-11 items-center justify-center border px-4 text-sm font-semibold ${
                    nextPage === safePage
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 text-neutral-950 hover:border-neutral-950"
                  }`}
                >
                  {nextPage}
                </Link>
              );
            })}
            <Link
              href={buildHomePageHref(locale, filterHrefState, Math.min(totalPages, safePage + 1))}
              className={`inline-flex h-11 min-w-11 items-center justify-center border px-4 text-sm font-semibold ${
                safePage === totalPages ? "pointer-events-none border-neutral-200 text-neutral-300" : "border-neutral-300 text-neutral-950 hover:border-neutral-950"
              }`}
            >
              Next
            </Link>
          </nav>
        ) : null}
      </div>
    </section>
  );
}

export default async function HomePage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
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
  return <main><HeroSlider locale={locale} eyebrow={dictionary.home.eyebrow} slides={slides} fallbackSlide={fallbackSlide} secondaryHref={`/${locale}/shop`} secondaryLabel={dictionary.actions.viewCollection} metrics={[]} /><HomeProductExplorer locale={locale} searchParams={searchParams} /><HomepageSectionRenderer locale={locale} sections={sections} /><NewsletterSignup locale={locale} /></main>;
}
