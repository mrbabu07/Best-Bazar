export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/admin";
import { created, getPagination, getSearchParam, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

function buildProductWhere(request: Request): Prisma.ProductWhereInput {
  const search = getSearchParam(request, "search");
  const categoryId = getSearchParam(request, "categoryId");
  const status = getSearchParam(request, "status");

  return {
    ...(categoryId ? { categoryId } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(search
      ? {
          OR: [
            { nameEn: { contains: search, mode: "insensitive" } },
            { nameAr: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { page, limit, skip } = getPagination(request);
    const where = buildProductWhere(request);
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          specifications: { orderBy: { sortOrder: "asc" } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { images, specifications, ...data } = productSchema.parse(await request.json());
    const product = await prisma.product.create({
      data: {
        ...data,
        images: { create: images },
        specifications: { create: specifications }
      },
      include: {
        category: true,
        images: true,
        specifications: true
      }
    });

    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
}
