import { OrderStatus, type OrderItem, type PaymentStatus, type Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api/admin";
import { prisma } from "@/lib/prisma";

export const CUSTOMER_CANCELLABLE_ORDER_STATUSES = [OrderStatus.PENDING, OrderStatus.CONFIRMED] as const;

type OrderItemStock = Pick<OrderItem, "productId" | "quantity" | "nameEn">;

type UpdateOrderStatusInput = {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus?: PaymentStatus;
  internalNotes?: string | null;
  userId?: string;
  allowedCurrentStatuses?: readonly OrderStatus[];
};

function orderData(
  orderStatus: OrderStatus,
  paymentStatus?: PaymentStatus,
  internalNotes?: string | null
): Prisma.OrderUpdateManyMutationInput {
  return {
    orderStatus,
    ...(paymentStatus !== undefined ? { paymentStatus } : {}),
    ...(internalNotes !== undefined ? { internalNotes } : {})
  };
}

function withProductId(item: OrderItemStock): item is OrderItemStock & { productId: string } {
  return Boolean(item.productId);
}

async function restoreStock(tx: Prisma.TransactionClient, items: OrderItemStock[]) {
  for (const item of items.filter(withProductId)) {
    await tx.product.updateMany({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } }
    });
  }
}

async function reserveStock(tx: Prisma.TransactionClient, items: OrderItemStock[]) {
  for (const item of items.filter(withProductId)) {
    const result = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } }
    });

    if (result.count === 0) {
      throw new ApiError(`${item.nameEn} does not have enough stock to reactivate this order.`, 409);
    }
  }
}

export async function updateOrderStatus({
  orderId,
  orderStatus,
  paymentStatus,
  internalNotes,
  userId,
  allowedCurrentStatuses
}: UpdateOrderStatusInput) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        ...(userId ? { userId } : {})
      },
      include: { items: true }
    });

    if (!order) {
      throw new ApiError("Order not found.", 404);
    }

    if (allowedCurrentStatuses && !allowedCurrentStatuses.includes(order.orderStatus)) {
      throw new ApiError("This order can no longer be cancelled from your account.", 409);
    }

    const data = orderData(orderStatus, paymentStatus, internalNotes);

    if (orderStatus === OrderStatus.CANCELLED && !order.stockRestored) {
      const result = await tx.order.updateMany({
        where: { id: order.id, stockRestored: false },
        data: { ...data, stockRestored: true }
      });

      if (result.count === 1) {
        await restoreStock(tx, order.items);
      }
    } else if (orderStatus !== OrderStatus.CANCELLED && order.stockRestored) {
      await reserveStock(tx, order.items);

      const result = await tx.order.updateMany({
        where: { id: order.id, stockRestored: true },
        data: { ...data, stockRestored: false }
      });

      if (result.count === 0) {
        throw new ApiError("Order was updated by another request. Please try again.", 409);
      }
    } else {
      await tx.order.update({
        where: { id: order.id },
        data
      });
    }

    const updatedOrder = await tx.order.findUnique({
      where: { id: order.id },
      include: { items: true }
    });

    if (!updatedOrder) {
      throw new ApiError("Order not found.", 404);
    }

    return updatedOrder;
  });
}
