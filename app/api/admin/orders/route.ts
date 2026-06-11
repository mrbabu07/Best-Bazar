export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination, getSearchParam, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

function buildOrderWhere(request: Request): Prisma.OrderWhereInput {
  const search = getSearchParam(request, "search");
  const status = getSearchParam(request, "status");
  const dateFrom = getSearchParam(request, "dateFrom");
  const dateTo = getSearchParam(request, "dateTo");

  return {
    ...(status ? { orderStatus: status as Prisma.EnumOrderStatusFilter["equals"] } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {})
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { page, limit, skip } = getPagination(request);
    const where = buildOrderWhere(request);
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}
