import type { Prisma } from "@prisma/client";
import { fallbackCategoryImage, fallbackProductImage, safeRemoteImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { reviewUserInclude, serializeStoreReview } from "@/lib/reviews";
import type { Category, Product } from "@/lib/types";

const categoryInclude = {
  products: {
    where: { isActive: true },
    select: { id: true }
  }
} satisfies Prisma.CategoryInclude;

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  specifications: { orderBy: { sortOrder: "asc" } }
} satisfies Prisma.ProductInclude;

type CategoryRecord = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;
type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

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

export function mapStoreProduct(product: ProductRecord): Product {
  const images = product.images.length
    ? product.images.map((image) => ({
        url: safeRemoteImage(image.url, fallbackProductImage),
        alt: image.alt ?? product.nameEn
      }))
    : [{ url: fallbackProductImage, alt: product.nameEn }];

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
    stock: product.stock,
    sku: product.sku,
    brand: product.brand,
    specifications: product.specifications.map((specification) => ({
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

export async function getStoreCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: categoryInclude,
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }]
  });

  return categories.map(mapStoreCategory);
}

export async function getStoreBrands() {
  const brands = await prisma.product.findMany({
    where: { isActive: true },
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" }
  });

  return brands.map((item) => item.brand);
}

export type StoreProductFilters = {
  category?: string;
  brand?: string;
  rating?: string;
  priceMax?: string;
  search?: string;
  sort?: string;
  tag?: string;
};

function getProductWhere(filters: StoreProductFilters = {}) {
  const rating = filters.rating ? Number(filters.rating) : undefined;
  const priceMax = filters.priceMax ? Number(filters.priceMax) : undefined;
  const search = filters.search?.trim();
  const tag = filters.tag?.trim();

  return {
    isActive: true,
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(filters.brand ? { brand: filters.brand } : {}),
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

export async function getStoreProducts(filters: StoreProductFilters = {}) {
  const products = await prisma.product.findMany({
    where: getProductWhere(filters),
    include: productInclude,
    orderBy: getProductOrder(filters.sort)
  });

  return products.map(mapStoreProduct);
}

export async function getFeaturedProducts(limit = 4) {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: productInclude,
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit
  });

  return products.map(mapStoreProduct);
}

export async function getNewArrivals(limit = 4) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return products.map(mapStoreProduct);
}

export async function getActiveBanners(limit = 3) {
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

export async function getProductBySlugOrId(id: string) {
  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ id }, { slug: id }]
    },
    include: productInclude
  });

  return product ? mapStoreProduct(product) : null;
}

export async function getProductReviews(productId: string, limit = 12) {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: reviewUserInclude,
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return reviews.map(serializeStoreReview);
}

export async function getRelatedProducts(categorySlug: string, productId: string, limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { slug: categorySlug },
      id: { not: productId }
    },
    include: productInclude,
    orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    take: limit
  });

  return products.map(mapStoreProduct);
}

export async function getSitemapProducts() {
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
