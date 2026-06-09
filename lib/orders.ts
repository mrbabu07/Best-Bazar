import { randomBytes } from "crypto";
import { DiscountType, OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { orderCreateSchema } from "@/lib/validations/store";
import { getShippingCost, normalizeShippingSettings } from "@/utils/shipping";
import type { z } from "zod";

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

function createOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomBytes(3).toString("hex").toUpperCase();

  return `BB-${timestamp}-${suffix}`;
}

function createOrderAccessToken() {
  return randomBytes(24).toString("hex");
}

export async function createStoreOrder(data: OrderCreateInput, userId?: string) {
  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }
  });

  if (products.length !== productIds.length) {
    throw new Error("One or more products are unavailable.");
  }

  const items = data.items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);

    if (!product) {
      throw new Error("Product not found after validation.");
    }

    if (product.stock < item.quantity) {
      throw new Error(`${product.nameEn} does not have enough stock.`);
    }

    return {
      product,
      quantity: item.quantity,
      lineTotal: Number(product.price) * item.quantity
    };
  });
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  const settings = await prisma.setting.findUniqueOrThrow({ where: { id: "store-settings" } });
  const shippingCost = getShippingCost(
    normalizeShippingSettings(settings),
    data.shippingAddress.emirate,
    subtotal
  );
  let discount = 0;
  let couponReservation: { id: string; maxUses: number } | undefined;

  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode.toUpperCase() }
    });

    if (
      !coupon?.isActive ||
      coupon.expiryDate < new Date() ||
      coupon.usedCount >= coupon.maxUses ||
      Number(coupon.minOrderAmount) > subtotal
    ) {
      throw new Error("Coupon is not valid.");
    }

    discount =
      coupon.discountType === DiscountType.PERCENT
        ? Math.min((subtotal * Number(coupon.discountValue)) / 100, subtotal)
        : Math.min(Number(coupon.discountValue), subtotal);
    couponReservation = { id: coupon.id, maxUses: coupon.maxUses };
  }

  const total = Math.max(subtotal + shippingCost - discount, 0);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: createOrderNumber(),
        accessToken: createOrderAccessToken(),
        userId,
        customerName: data.shippingAddress.name,
        customerEmail: data.shippingAddress.email,
        customerPhone: data.shippingAddress.phone,
        street: data.shippingAddress.street,
        city: data.shippingAddress.city,
        emirate: data.shippingAddress.emirate,
        country: data.shippingAddress.country,
        paymentMethod: data.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
        subtotal,
        shippingCost,
        discount,
        total,
        currency: data.currency,
        notes: data.notes,
        items: {
          create: items.map(({ product, quantity }) => ({
            productId: product.id,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            price: product.price,
            quantity,
            image: product.images[0]?.url
          }))
        }
      },
      include: { items: true }
    });

    for (const { product, quantity } of items) {
      const stockReservation = await tx.product.updateMany({
        where: {
          id: product.id,
          isActive: true,
          stock: { gte: quantity }
        },
        data: { stock: { decrement: quantity } }
      });

      if (stockReservation.count === 0) {
        throw new Error(`${product.nameEn} does not have enough stock.`);
      }
    }

    if (couponReservation) {
      const couponUsage = await tx.coupon.updateMany({
        where: {
          id: couponReservation.id,
          isActive: true,
          expiryDate: { gte: new Date() },
          minOrderAmount: { lte: subtotal },
          usedCount: { lt: couponReservation.maxUses }
        },
        data: { usedCount: { increment: 1 } }
      });

      if (couponUsage.count === 0) {
        throw new Error("Coupon is no longer available.");
      }
    }

    return order;
  });
}
