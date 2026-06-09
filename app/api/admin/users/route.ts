export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination, getSearchParam, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

function buildUserWhere(request: Request): Prisma.UserWhereInput {
  const search = getSearchParam(request, "search");
  const role = getSearchParam(request, "role");

  return {
    ...(role ? { role: role.toUpperCase() as Prisma.EnumUserRoleFilter["equals"] } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { page, limit, skip } = getPagination(request);
    const where = buildUserWhere(request);
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          avatar: true,
          phone: true,
          city: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { orders: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}
