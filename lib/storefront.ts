import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { fallbackCategoryImage, fallbackProductImage, safeRemoteImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { reviewUserInclude, serializeStoreReview } from "@/lib/reviews";
import type { Category, Product, ProductColor } from "@/lib/types";

const categoryInclude = {
  products: {
    where: { isActive: true },
    select: { id: true }
  }
} satisfies Prisma.CategoryInclude;

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
  specifications: { orderBy: { sortOrder: "asc" } }
} satisfies Prisma.ProductInclude;

const productListInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }
} satisfies Prisma.ProductInclude;

type CategoryRecord = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;
type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type ProductListRecord = Prisma.ProductGetPayload<{ include: typeof productListInclude }>;

const storefrontCache = {
  revalidate: 60,
  tags: ["storefront"]
};

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  return value == null ? undefined : Number(value);
}

export function mapStoreCategory(category: CategoryRecord): Category {
  return {
    id: category.id,
    slug: category.slug,
    name: { en: category.nameEn, ar: category.nameAr },
    image: safeRemoteImage(category.image, fallbackCategoryImage),
    productCount: category.products.length,
    parentCategory: category.parentCategoryId ?? undefined,
    isActive: category.isActive,
    sortOrder: category.sortOrder
  };
}

export function mapStoreProduct(product: ProductRecord | ProductListRecord): Product {
  const images = product.images.length
    ? product.images.map((image) => ({
        url: safeRemoteImage(image.url, fallbackProductImage),
        alt: image.alt ?? product.nameEn
      }))
    : [{ url: fallbackProductImage, alt: product.nameEn }];
  const variants = product.variants.map((variant) => {
    const imageUrl = safeRemoteImage(variant.imageUrl, "");

    return {
      id: variant.id,
      name: { en: variant.colorNameEn, ar: variant.colorNameAr },
      colorHex: variant.colorHex ?? undefined,
      imageUrl: imageUrl || undefined,
      sku: variant.sku ?? undefined,
      stock: variant.stock,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder
    };
  });
  const variantStock = variants.reduce((total, variant) => total + variant.stock, 0);

  return {
    id: product.id,
    slug: product.slug,
    name: { en: product.nameEn, ar: product.nameAr },
    description: { en: product.descriptionEn, ar: product.descriptionAr },
    category: product.category.slug,
    subcategory: product.subcategoryId ?? undefined,
    price: Number(product.price),
    comparePrice: toNumber(product.comparePrice),
    images,
    stock: variants.length ? variantStock : product.stock,
    sku: product.sku,
    brand: product.brand,
    variants,
    specifications: ("specifications" in product ? product.specifications : []).map((specification) => ({
      key: { en: specification.keyEn, ar: specification.keyAr },
      value: { en: specification.valueEn, ar: specification.valueAr }
    })),
    tags: product.tags,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    createdAt: product.createdAt.toISOString()
  };
}

async function readStoreCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: categoryInclude,
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }]
  });

  return categories.map(mapStoreCategory);
}

export const getStoreCategories = unstable_cache(readStoreCategories, ["store-categories"], {
  ...storefrontCache,
  tags: ["storefront", "categories"]
});

async function readStoreBrands() {
  const brands = await prisma.product.findMany({
    where: { isActive: true },
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" }
  });

  return brands.map((item) => item.brand);
}

export const getStoreBrands = unstable_cache(readStoreBrands, ["store-brands"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

async function readStoreVariantColors() {
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      product: { isActive: true }
    },
    select: {
      colorNameEn: true,
      colorNameAr: true,
      colorHex: true
    },
    orderBy: [{ sortOrder: "asc" }, { colorNameEn: "asc" }]
  });
  const colors = new Map<string, ProductColor>();

  for (const variant of variants) {
    const key = variant.colorNameEn.trim().toLowerCase();
    const current = colors.get(key);

    colors.set(key, {
      key,
      name: current?.name ?? { en: variant.colorNameEn, ar: variant.colorNameAr },
      colorHex: current?.colorHex ?? variant.colorHex ?? undefined,
      count: (current?.count ?? 0) + 1
    });
  }

  return Array.from(colors.values());
}

export const getStoreVariantColors = unstable_cache(readStoreVariantColors, ["store-variant-colors"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

export type StoreProductFilters = {
  category?: string;
  brand?: string;
  color?: string;
  rating?: string;
  priceMax?: string;
  search?: string;
  sort?: string;
  tag?: string;
};

function getProductWhere(filters: StoreProductFilters = {}) {
  const rating = filters.rating ? Number(filters.rating) : undefined;
  const priceMax = filters.priceMax ? Number(filters.priceMax) : undefined;
  const color = filters.color?.trim();
  const search = filters.search?.trim();
  const tag = filters.tag?.trim();

  return {
    isActive: true,
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(filters.brand ? { brand: filters.brand } : {}),
    ...(color
      ? {
          variants: {
            some: {
              isActive: true,
              stock: { gt: 0 },
              colorNameEn: { equals: color, mode: "insensitive" }
            }
          }
        }
      : {}),
    ...(rating && Number.isFinite(rating) ? { rating: { gte: rating } } : {}),
    ...(priceMax && Number.isFinite(priceMax) ? { price: { lte: priceMax } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(search
      ? {
          OR: [
            { nameEn: { contains: search, mode: "insensitive" } },
            { nameAr: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { tags: { has: search } }
          ]
        }
      : {})
  } satisfies Prisma.ProductWhereInput;
}

function getProductOrder(sort = "featured") {
  if (sort === "price-asc") {
    return [{ price: "asc" }, { createdAt: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[];
  }

  if (sort === "price-desc") {
    return [{ price: "desc" }, { createdAt: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[];
  }

  if (sort === "rating") {
    return [{ rating: "desc" }, { reviewCount: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[];
  }

  if (sort === "new") {
    return [{ createdAt: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[];
  }

  return [{ isFeatured: "desc" }, { createdAt: "desc" }] satisfies Prisma.ProductOrderByWithRelationInput[];
}

function stableProductFilters(filters: StoreProductFilters = {}) {
  return JSON.stringify({
    brand: filters.brand ?? "",
    category: filters.category ?? "",
    color: filters.color?.trim().toLowerCase() ?? "",
    priceMax: filters.priceMax ?? "",
    rating: filters.rating ?? "",
    search: filters.search ?? "",
    sort: filters.sort ?? "",
    tag: filters.tag ?? ""
  });
}

const getCachedStoreProducts = unstable_cache(
  async (filtersJson: string) => {
    const filters = JSON.parse(filtersJson) as StoreProductFilters;
    const products = await prisma.product.findMany({
      where: getProductWhere(filters),
      include: productListInclude,
      orderBy: getProductOrder(filters.sort)
    });

    return products.map(mapStoreProduct);
  },
  ["store-products"],
  { ...storefrontCache, tags: ["storefront", "products"] }
);

export async function getStoreProducts(filters: StoreProductFilters = {}) {
  return getCachedStoreProducts(stableProductFilters(filters));
}

async function readFeaturedProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: productListInclude,
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit
  });

  return products.map(mapStoreProduct);
}

export const getFeaturedProducts = unstable_cache(readFeaturedProducts, ["featured-products"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

async function readNewArrivals(limit = 4) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: productListInclude,
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return products.map(mapStoreProduct);
}

export const getNewArrivals = unstable_cache(readNewArrivals, ["new-arrivals"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

async function readActiveBanners(limit = 3) {
  return prisma.banner.findMany({
    where: { isActive: true },
    select: {
      id: true,
      titleEn: true,
      titleAr: true,
      subtitleEn: true,
      subtitleAr: true,
      buttonTextEn: true,
      buttonTextAr: true,
      buttonLink: true,
      desktopImage: true,
      mobileImage: true,
      sortOrder: true
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit
  });
}

export const getActiveBanners = unstable_cache(readActiveBanners, ["active-banners"], {
  ...storefrontCache,
  tags: ["storefront", "banners"]
});

async function readProductBySlugOrId(id: string) {
  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ id }, { slug: id }]
    },
    include: productInclude
  });

  return product ? mapStoreProduct(product) : null;
}

export const getProductBySlugOrId = unstable_cache(readProductBySlugOrId, ["product-by-slug-or-id"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

async function readProductReviews(productId: string, limit = 12) {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: reviewUserInclude,
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return reviews.map(serializeStoreReview);
}

export const getProductReviews = unstable_cache(readProductReviews, ["product-reviews"], {
  ...storefrontCache,
  tags: ["storefront", "reviews"]
});

async function readRelatedProducts(categorySlug: string, productId: string, limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { slug: categorySlug },
      id: { not: productId }
    },
    include: productListInclude,
    orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    take: limit
  });

  return products.map(mapStoreProduct);
}

export const getRelatedProducts = unstable_cache(readRelatedProducts, ["related-products"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

async function readSitemapProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      updatedAt: true,
      createdAt: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export const getSitemapProducts = unstable_cache(readSitemapProducts, ["sitemap-products"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});
