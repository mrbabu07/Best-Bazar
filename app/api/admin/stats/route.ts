export const dynamic = "force-dynamic";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma, withRetry } from "@/lib/prisma";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

type NumericLike = Prisma.Decimal | number | bigint | string | null | undefined;

type AdminStatsRow = {
  monthRevenue: NumericLike;
  totalOrders: NumericLike;
  pendingOrders: NumericLike;
  confirmedOrders: NumericLike;
  processingOrders: NumericLike;
  shippedOrders: NumericLike;
  deliveredOrders: NumericLike;
  cancelledOrders: NumericLike;
  totalProducts: NumericLike;
  totalUsers: NumericLike;
  newUsersToday: NumericLike;
};

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toNumber(value: NumericLike) {
  return Number(value ?? 0);
}

function statusCount(row: AdminStatsRow | undefined, status: OrderStatus) {
  const counts = {
    [OrderStatus.PENDING]: row?.pendingOrders,
    [OrderStatus.CONFIRMED]: row?.confirmedOrders,
    [OrderStatus.PROCESSING]: row?.processingOrders,
    [OrderStatus.SHIPPED]: row?.shippedOrders,
    [OrderStatus.DELIVERED]: row?.deliveredOrders,
    [OrderStatus.CANCELLED]: row?.cancelledOrders
  };

  return toNumber(counts[status]);
}

export async function GET() {
  try {
    await requireAdmin();
    
    // Use withRetry wrapper for connection resilience
    const [statsRows, lowStockProducts, recentOrders, topProducts] = await withRetry(() =>
      prisma.$transaction([
        prisma.$queryRaw<AdminStatsRow[]>(
          Prisma.sql`
            SELECT
              (SELECT COALESCE(SUM(total), 0) FROM "Order"
                WHERE "createdAt" >= ${startOfMonth()}
                  AND "orderStatus" <> ${OrderStatus.CANCELLED}::"OrderStatus") AS "monthRevenue",
              (SELECT COUNT(*) FROM "Order") AS "totalOrders",
              (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = ${OrderStatus.PENDING}::"OrderStatus") AS "pendingOrders",
              (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = ${OrderStatus.CONFIRMED}::"OrderStatus") AS "confirmedOrders",
              (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = ${OrderStatus.PROCESSING}::"OrderStatus") AS "processingOrders",
              (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = ${OrderStatus.SHIPPED}::"OrderStatus") AS "shippedOrders",
              (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = ${OrderStatus.DELIVERED}::"OrderStatus") AS "deliveredOrders",
              (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = ${OrderStatus.CANCELLED}::"OrderStatus") AS "cancelledOrders",
              (SELECT COUNT(*) FROM "Product") AS "totalProducts",
              (SELECT COUNT(*) FROM "User") AS "totalUsers",
              (SELECT COUNT(*) FROM "User" WHERE "createdAt" >= ${startOfToday()}) AS "newUsersToday"
          `
        ),
        prisma.product.findMany({
          where: { stock: { lt: 5 } },
          orderBy: { stock: "asc" },
          take: 5
        }),
        prisma.order.findMany({
          include: { items: true },
          orderBy: { createdAt: "desc" },
          take: 5
        }),
        prisma.orderItem.groupBy({
          by: ["productId", "nameEn"],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: "desc" } },
          take: 5
        })
      ])
    );
    
    const stats = statsRows[0];

    return ok({
      revenue: {
        month: toNumber(stats?.monthRevenue)
      },
      orders: {
        total: toNumber(stats?.totalOrders),
        pending: toNumber(stats?.pendingOrders),
        delivered: toNumber(stats?.deliveredOrders)
      },
      products: {
        total: toNumber(stats?.totalProducts),
        lowStock: lowStockProducts
      },
      users: {
        total: toNumber(stats?.totalUsers),
        newToday: toNumber(stats?.newUsersToday)
      },
      recentOrders,
      topProducts,
      statusBreakdown: Object.values(OrderStatus).map((status) => ({
        status,
        count: statusCount(stats, status)
      }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
