import { DiscountType, OrderStatus, PaymentStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderCreateSchema } from "@/lib/validations/store";

export const dynamic = "force-dynamic";

function createOrderNumber() {
  return `BB-${Date.now().toString().slice(-8)}`;
}

function getShippingCost(settings: { shippingRates: unknown; freeShippingThreshold: unknown }, emirate: string, subtotal: number) {
  const freeThreshold = Number(settings.freeShippingThreshold ?? 250);

  if (subtotal >= freeThreshold) {
    return 0;
  }

  const rates = Array.isArray(settings.shippingRates)
    ? (settings.shippingRates as Array<{ emirate: string; cost: number }>)
    : [];
  const match = rates.find((rate) => rate.emirate.toLowerCase() === emirate.toLowerCase());

  return Number(match?.cost ?? 20);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(JSON.parse(JSON.stringify(orders)));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const data = orderCreateSchema.parse(await request.json());
  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products are unavailable." }, { status: 422 });
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
  const shippingCost = getShippingCost(settings, data.shippingAddress.emirate, subtotal);
  let discount = 0;
  let couponId: string | undefined;

  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode.toUpperCase() }
    });

    if (coupon?.isActive && coupon.expiryDate >= new Date() && coupon.usedCount < coupon.maxUses && Number(coupon.minOrderAmount) <= subtotal) {
      discount =
        coupon.discountType === DiscountType.PERCENT
          ? Math.min((subtotal * Number(coupon.discountValue)) / 100, subtotal)
          : Math.min(Number(coupon.discountValue), subtotal);
      couponId = coupon.id;
    }
  }

  const total = Math.max(subtotal + shippingCost - discount, 0);
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: createOrderNumber(),
        userId: session?.user.id,
        customerName: data.shippingAddress.name,
        customerEmail: data.shippingAddress.email,
        customerPhone: data.shippingAddress.phone,
        street: data.shippingAddress.street,
        city: data.shippingAddress.city,
        emirate: data.shippingAddress.emirate,
        country: data.shippingAddress.country,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === "COD" ? PaymentStatus.PENDING : PaymentStatus.PENDING,
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

    await Promise.all(
      items.map(({ product, quantity }) =>
        tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: quantity } }
        })
      )
    );

    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } }
      });
    }

    return created;
  });

  return NextResponse.json(JSON.parse(JSON.stringify(order)), { status: 201 });
}
