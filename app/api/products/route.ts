import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getParam(request: Request, key: string) {
  return new URL(request.url).searchParams.get(key) ?? undefined;
}

export async function GET(request: Request) {
  const search = getParam(request, "search");
  const category = getParam(request, "category");
  const brand = getParam(request, "brand");
  const rating = getParam(request, "rating");
  const priceMax = getParam(request, "priceMax");
  const sort = getParam(request, "sort") ?? "featured";
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand } : {}),
    ...(rating ? { rating: { gte: Number(rating) } } : {}),
    ...(priceMax ? { price: { lte: Number(priceMax) } } : {}),
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

  return NextResponse.json(JSON.parse(JSON.stringify(products)));
}
