export const dynamic = "force-dynamic";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET() {
  try {
    await requireAdmin();
    const [monthRevenue, totalOrders, pendingOrders, deliveredOrders, totalProducts, lowStockProducts, totalUsers, newUsersToday, recentOrders, topProducts] =
      await Promise.all([
        prisma.order.aggregate({
          where: { createdAt: { gte: startOfMonth() }, orderStatus: { not: OrderStatus.CANCELLED } },
          _sum: { total: true }
        }),
        prisma.order.count(),
        prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
        prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
        prisma.product.count(),
        prisma.product.findMany({
          where: { stock: { lt: 5 } },
          orderBy: { stock: "asc" },
          take: 5
        }),
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: startOfToday() } } }),
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
      ]);

    const statusBreakdown = await Promise.all(
      Object.values(OrderStatus).map(async (status) => ({
        status,
        count: await prisma.order.count({ where: { orderStatus: status } })
      }))
    );

    return ok({
      revenue: {
        month: monthRevenue._sum.total ?? 0
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        delivered: deliveredOrders
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      },
      users: {
        total: totalUsers,
        newToday: newUsersToday
      },
      recentOrders,
      topProducts,
      statusBreakdown
    });
  } catch (error) {
    return handleApiError(error);
  }
}
