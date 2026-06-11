export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination, getSearchParam, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

function buildReviewWhere(request: Request): Prisma.ReviewWhereInput {
  const search = getSearchParam(request, "search")?.trim();
  const status = getSearchParam(request, "status");

  return {
    ...(status === "approved" ? { isApproved: true } : {}),
    ...(status === "pending" ? { isApproved: false } : {}),
    ...(search
      ? {
          OR: [
            { comment: { contains: search, mode: "insensitive" } },
            { product: { nameEn: { contains: search, mode: "insensitive" } } },
            { product: { nameAr: { contains: search, mode: "insensitive" } } },
            { product: { sku: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { page, limit, skip } = getPagination(request);
    const where = buildReviewWhere(request);
    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        include: {
          product: { select: { id: true, slug: true, nameEn: true, nameAr: true, sku: true } },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}
