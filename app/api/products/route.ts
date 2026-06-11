import { Prisma } from "@prisma/client";
import { cachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getParam(request: Request, key: string) {
  return new URL(request.url).searchParams.get(key) ?? undefined;
}

function csvValues(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const search = getParam(request, "search");
  const category = getParam(request, "category");
  const brand = getParam(request, "brand");
  const colors = csvValues(getParam(request, "color"));
  const sizes = csvValues(getParam(request, "size"));
  const rating = getParam(request, "rating");
  const priceMin = getParam(request, "priceMin");
  const priceMax = getParam(request, "priceMax");
  const sort = getParam(request, "sort") ?? "featured";
  const variantClauses: Prisma.ProductVariantWhereInput[] = [];
  const price: Prisma.DecimalFilter = {};

  if (colors.length) {
    variantClauses.push({
      OR: colors.map((color) => ({
        colorNameEn: { equals: color, mode: "insensitive" }
      }))
    });
  }

  if (sizes.length) {
    variantClauses.push({
      OR: sizes.flatMap((size) => [
        { sizeKey: { equals: size, mode: "insensitive" } },
        { sizeNameEn: { equals: size, mode: "insensitive" } }
      ])
    });
  }

  if (priceMin && Number.isFinite(Number(priceMin))) {
    price.gte = Number(priceMin);
  }

  if (priceMax && Number.isFinite(Number(priceMax))) {
    price.lte = Number(priceMax);
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand } : {}),
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
    ...(rating ? { rating: { gte: Number(rating) } } : {}),
    ...(Object.keys(price).length ? { price } : {}),
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
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-asc"
      ? { price: "asc" }
      : sort === "price-desc"
        ? { price: "desc" }
        : sort === "rating"
          ? { rating: "desc" }
          : sort === "new"
            ? { createdAt: "desc" }
            : { isFeatured: "desc" };

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } }
    },
    orderBy
  });

  return cachedJson(products);
}
