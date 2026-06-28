import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache";
import { normalizeCategoryCustomFields, normalizeCustomFieldValues, normalizeFashionFields } from "@/lib/category-fields";
import { getPresetColorHex, normalizeColorKey, shopColorPalette } from "@/lib/color-palette";
import { cleanLengthSizeLabel, normalizeSizeFilterValue, sizeFilterCandidates } from "@/lib/product-size-label";
import { fallbackCategoryImage, fallbackProductImage, safeRemoteImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { reviewUserInclude, serializeStoreReview } from "@/lib/reviews";
import { safeJsonParse, safeJsonStringify } from "@/lib/safe-json";
import type { Category, Product, ProductColor, ProductSize } from "@/lib/types";

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
  revalidate: STOREFRONT_REVALIDATE_SECONDS,
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
    image: safeRemoteImage(category.image, fallbackCategoryImage, { width: 900 }),
    productCount: category.products.length,
    parentCategory: category.parentCategoryId ?? undefined,
    isActive: category.isActive,
    sortOrder: category.sortOrder
  };
}

export function mapStoreProduct(product: ProductRecord | ProductListRecord): Product {
  const images = product.images.length
    ? product.images.map((image) => ({
        url: safeRemoteImage(image.url, fallbackProductImage, { width: 1400 }),
        alt: image.alt ?? product.nameEn
      }))
    : [{ url: safeRemoteImage(fallbackProductImage, fallbackProductImage, { width: 1400 }), alt: product.nameEn }];
  const variants = product.variants.map((variant) => {
    const imageUrl = safeRemoteImage(variant.imageUrl, "", { width: 1200 });
    const sizeNameEn = variant.sizeNameEn?.trim();
    const sizeNameAr = variant.sizeNameAr?.trim();
    const styleNameEn = variant.styleNameEn?.trim();
    const styleNameAr = variant.styleNameAr?.trim();
    const fitNameEn = variant.fitNameEn?.trim();
    const fitNameAr = variant.fitNameAr?.trim();
    const nameEn = [variant.colorNameEn, sizeNameEn, styleNameEn, fitNameEn].filter(Boolean).join(" / ");
    const nameAr = [variant.colorNameAr, sizeNameAr, styleNameAr, fitNameAr].filter(Boolean).join(" / ");

    return {
      id: variant.id,
      name: { en: nameEn, ar: nameAr },
      colorName: { en: variant.colorNameEn, ar: variant.colorNameAr },
      colorHex: variant.colorHex ?? undefined,
      sizeKey: variant.sizeKey ?? undefined,
      sizeName: sizeNameEn || sizeNameAr ? { en: sizeNameEn ?? sizeNameAr ?? "", ar: sizeNameAr ?? sizeNameEn ?? "" } : undefined,
      styleName: styleNameEn || styleNameAr ? { en: styleNameEn ?? styleNameAr ?? "", ar: styleNameAr ?? styleNameEn ?? "" } : undefined,
      fitName: fitNameEn || fitNameAr ? { en: fitNameEn ?? fitNameAr ?? "", ar: fitNameAr ?? fitNameEn ?? "" } : undefined,
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
    seo: {
      title:
        product.metaTitleEn || product.metaTitleAr
          ? { en: product.metaTitleEn ?? product.nameEn, ar: product.metaTitleAr ?? product.metaTitleEn ?? product.nameAr }
          : undefined,
      description:
        product.metaDescriptionEn || product.metaDescriptionAr
          ? {
              en: product.metaDescriptionEn ?? product.descriptionEn,
              ar: product.metaDescriptionAr ?? product.metaDescriptionEn ?? product.descriptionAr
            }
          : undefined,
      ogImage: safeRemoteImage(product.ogImage, "", { width: 1200 }) || undefined
    },
    category: product.category.slug,
    subcategory: product.subcategoryId ?? undefined,
    price: Number(product.price),
    comparePrice: toNumber(product.comparePrice),
    images,
    shortVideoUrl: product.shortVideoUrl ?? undefined,
    stock: variants.length ? variantStock : product.stock,
    sku: product.sku,
    brand: product.brand,
    variants,
    specifications: ("specifications" in product ? product.specifications : []).map((specification) => ({
      key: { en: specification.keyEn, ar: specification.keyAr },
      value: { en: specification.valueEn, ar: specification.valueAr }
    })),
    fashionFields: normalizeFashionFields(product.fashionFields),
    customFields: normalizeCategoryCustomFields(product.category.customFields).map((field) => ({
      id: field.id,
      label: { en: field.labelEn, ar: field.labelAr },
      type: field.type,
      required: field.required
    })),
    customFieldValues: normalizeCustomFieldValues(product.customFieldValues),
    tags: product.tags,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    freeDelivery: product.freeDelivery,
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

  for (const preset of shopColorPalette) {
    colors.set(preset.key, {
      key: preset.key,
      name: { en: preset.nameEn, ar: preset.nameAr },
      colorHex: preset.colorHex,
      count: 0
    });
  }

  for (const variant of variants) {
    const key = normalizeColorKey(variant.colorNameEn);

    if (!key) {
      continue;
    }

    const current = colors.get(key);
    const fallbackHex = getPresetColorHex(variant.colorNameEn);

    colors.set(key, {
      key,
      name: current?.name ?? { en: variant.colorNameEn, ar: variant.colorNameAr },
      colorHex: variant.colorHex ?? current?.colorHex ?? fallbackHex,
      count: (current?.count ?? 0) + 1
    });
  }

  return Array.from(colors.values()).sort((first, second) => {
    const stockPriority = Number(second.count > 0) - Number(first.count > 0);

    if (stockPriority) {
      return stockPriority;
    }

    return first.name.en.localeCompare(second.name.en);
  });
}

export const getStoreVariantColors = unstable_cache(readStoreVariantColors, ["store-variant-colors"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

async function readStoreVariantSizes() {
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      product: { isActive: true },
      OR: [{ sizeKey: { not: null } }, { sizeNameEn: { not: null } }, { sizeNameAr: { not: null } }]
    },
    select: {
      sizeKey: true,
      sizeNameEn: true,
      sizeNameAr: true
    },
    orderBy: [{ sortOrder: "asc" }, { sizeNameEn: "asc" }]
  });
  const sizes = new Map<string, ProductSize>();

  for (const variant of variants) {
    const rawLabelEn = variant.sizeNameEn?.trim() || variant.sizeNameAr?.trim() || variant.sizeKey?.trim() || "";
    const labelEn = cleanLengthSizeLabel(rawLabelEn);

    if (!labelEn) {
      continue;
    }

    const key = normalizeSizeFilterValue(labelEn);
    const current = sizes.get(key);

    sizes.set(key, {
      key,
      name: current?.name ?? {
        en: labelEn,
        ar: cleanLengthSizeLabel(variant.sizeNameAr?.trim() || labelEn)
      },
      count: (current?.count ?? 0) + 1
    });
  }

  return Array.from(sizes.values());
}

export const getStoreVariantSizes = unstable_cache(readStoreVariantSizes, ["store-variant-sizes"], {
  ...storefrontCache,
  tags: ["storefront", "products"]
});

export type StoreProductFilters = {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  rating?: string;
  priceMin?: string;
  priceMax?: string;
  search?: string;
  sort?: string;
  tag?: string;
  availability?: string;
};

function csvValues(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getProductWhere(filters: StoreProductFilters = {}) {
  const rating = filters.rating ? Number(filters.rating) : undefined;
  const priceMin = filters.priceMin ? Number(filters.priceMin) : undefined;
  const priceMax = filters.priceMax ? Number(filters.priceMax) : undefined;
  const colors = csvValues(filters.color);
  const sizes = csvValues(filters.size);
  const search = filters.search?.trim();
  const tag = filters.tag?.trim();
  const availability = filters.availability?.trim();
  const price: Prisma.DecimalFilter = {};
  const variantClauses: Prisma.ProductVariantWhereInput[] = [];

  if (priceMin !== undefined && Number.isFinite(priceMin)) {
    price.gte = priceMin;
  }

  if (priceMax !== undefined && Number.isFinite(priceMax)) {
    price.lte = priceMax;
  }

  if (colors.length) {
    variantClauses.push({
      OR: colors.map((color) => ({
        colorNameEn: { equals: color, mode: "insensitive" }
      }))
    });
  }

  if (sizes.length) {
    variantClauses.push({
      OR: sizes.flatMap((size) =>
        sizeFilterCandidates(size).flatMap((candidate) => [
          { sizeKey: { equals: candidate, mode: "insensitive" } },
          { sizeNameEn: { equals: candidate, mode: "insensitive" } },
          { sizeNameAr: { equals: candidate, mode: "insensitive" } }
        ])
      )
    });
  }

  return {
    isActive: true,
    ...(availability === "in-stock"
      ? {
          AND: [
            {
              OR: [
                { stock: { gt: 0 } },
                { variants: { some: { isActive: true, stock: { gt: 0 } } } }
              ]
            }
          ]
        }
      : {}),
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(filters.brand ? { brand: filters.brand } : {}),
    ...(variantClauses.length
      ? {
          variants: {
            some: {
              isActive: true,
              stock: { gt: 0 },
              AND: variantClauses
            }
          }
        }
      : {}),
    ...(rating && Number.isFinite(rating) ? { rating: { gte: rating } } : {}),
    ...(Object.keys(price).length ? { price } : {}),
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
  return safeJsonStringify({
    brand: filters.brand ?? "",
    category: filters.category ?? "",
    color: filters.color?.trim().toLowerCase() ?? "",
    size: filters.size?.trim().toLowerCase() ?? "",
    priceMin: filters.priceMin ?? "",
    priceMax: filters.priceMax ?? "",
    rating: filters.rating ?? "",
    search: filters.search ?? "",
    sort: filters.sort ?? "",
    tag: filters.tag ?? ""
    ,availability: filters.availability ?? ""
  }) ?? "{}";
}

const getCachedStoreProducts = unstable_cache(
  async (filtersJson: string) => {
    const filters = safeJsonParse<StoreProductFilters>(filtersJson, {});
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
