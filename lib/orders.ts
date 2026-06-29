import { randomBytes } from "crypto";
import { DiscountType, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { revalidateAdminOrderViews, revalidateCacheTags } from "@/lib/cache";
import { assertPaymentMethodAvailable } from "@/lib/payment-settings";
import { prisma } from "@/lib/prisma";
import { normalizeThemeSettings } from "@/lib/theme-config";
import type { orderCreateSchema } from "@/lib/validations/store";
import { formatDeliveryDays, getShippingFee } from "@/utils/shipping";
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

function mergeOrderItems(items: OrderCreateInput["items"]) {
  const quantities = new Map<string, { productId: string; variantId?: string; quantity: number }>();

  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? ""}`;
    const existing = quantities.get(key);

    quantities.set(key, {
      productId: item.productId,
      variantId: item.variantId,
      quantity: (existing?.quantity ?? 0) + item.quantity
    });
  }

  return Array.from(quantities.values());
}

function variantNameEn(variant: { colorNameEn: string; sizeNameEn?: string | null }) {
  return [variant.colorNameEn, variant.sizeNameEn].filter(Boolean).join(" / ");
}

function variantNameAr(variant: { colorNameAr: string; sizeNameAr?: string | null; sizeNameEn?: string | null }) {
  return [variant.colorNameAr, variant.sizeNameAr ?? variant.sizeNameEn].filter(Boolean).join(" / ");
}

export async function createStoreOrder(data: OrderCreateInput, userId?: string) {
  const orderItems = mergeOrderItems(data.items);
  const productIds = Array.from(new Set(orderItems.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { where: { isActive: true } }
    }
  });

  if (products.length !== productIds.length) {
    throw new Error("One or more products are unavailable.");
  }

  const items = orderItems.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);

    if (!product) {
      throw new Error("Product not found after validation.");
    }

    const requestedVariant = item.variantId
      ? product.variants.find((candidate) => candidate.id === item.variantId)
      : undefined;
    const fallbackVariant = product.variants.find((candidate) => candidate.stock > 0) ?? product.variants[0];
    const variant = requestedVariant ?? (item.variantId ? undefined : fallbackVariant);

    if (product.variants.length && !variant) {
      throw new Error(`Choose an available color and size for ${product.nameEn}.`);
    }

    const availableStock = variant?.stock ?? product.stock;

    if (availableStock < item.quantity) {
      const label = variant ? `${product.nameEn} (${variantNameEn(variant)})` : product.nameEn;
      throw new Error(`${label} does not have enough stock.`);
    }

    return {
      product,
      variant,
      quantity: item.quantity,
      lineTotal: Number(product.price) * item.quantity
    };
  });
  const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
  await assertPaymentMethodAvailable(data.paymentMethod);
  const settings = await prisma.setting.findUniqueOrThrow({ where: { id: "store-settings" } });
  const checkoutControls = normalizeThemeSettings(settings.themeSettings).checkoutControls;
  const shippingQuote = getShippingFee(
    data.shippingAddress.emirate,
    subtotal,
    settings.shippingRates,
    Number(settings.freeShippingThreshold),
    settings.shippingRates && typeof settings.shippingRates === "object" && !Array.isArray(settings.shippingRates)
      ? ((settings.shippingRates as Record<string, unknown>).customAreaFee as Record<string, unknown> | undefined)
      : undefined
  );
  const thresholdFreeDelivery =
    checkoutControls.freeDeliveryThresholdEnabled &&
    Number(settings.freeShippingThreshold) > 0 &&
    subtotal >= Number(settings.freeShippingThreshold);
  const productFreeDelivery = items.some(({ product }) => product.freeDelivery);
  const shippingCost = checkoutControls.freeDeliveryEnabled || thresholdFreeDelivery || productFreeDelivery ? 0 : shippingQuote.fee;

  if (data.paymentMethod === PaymentMethod.COD && !shippingQuote.codAvailable) {
    throw new Error(`Cash on delivery is not available for ${shippingQuote.rate.emirate}.`);
  }
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
  const vatRate = Math.max(Number(settings.vatRate ?? 0), 0);
  const vatAmount = vatRate > 0 ? (total * vatRate) / (100 + vatRate) : 0;

  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: createOrderNumber(),
        accessToken: createOrderAccessToken(),
        userId,
        customerName: data.shippingAddress.name,
        customerEmail: data.shippingAddress.email,
        customerPhone: data.shippingAddress.phone,
        street: data.shippingAddress.street,
        apartment: data.shippingAddress.apartment,
        tower: data.shippingAddress.tower,
        city: data.shippingAddress.city,
        emirate: data.shippingAddress.emirate,
        country: data.shippingAddress.country,
        deliverySlot: data.deliverySlot,
        deliveryEstimate: formatDeliveryDays(shippingQuote.estimatedDays),
        paymentMethod: data.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
        subtotal,
        shippingCost,
        discount,
        vatRate,
        vatAmount,
        total,
        currency: data.currency,
        locale: data.locale,
        notes: data.notes,
        items: {
          create: items.map(({ product, variant, quantity }) => ({
            productId: product.id,
            variantId: variant?.id,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            variantNameEn: variant ? variantNameEn(variant) : undefined,
            variantNameAr: variant ? variantNameAr(variant) : undefined,
            variantColorHex: variant?.colorHex,
            variantSku: variant?.sku,
            price: product.price,
            quantity,
            image: variant?.imageUrl ?? product.images[0]?.url
          }))
        }
      },
      include: { items: true }
    });

    for (const { product, variant, quantity } of items) {
      const stockReservation = variant
        ? await tx.productVariant.updateMany({
            where: {
              id: variant.id,
              productId: product.id,
              isActive: true,
              stock: { gte: quantity }
            },
            data: { stock: { decrement: quantity } }
          })
        : await tx.product.updateMany({
            where: {
              id: product.id,
              isActive: true,
              stock: { gte: quantity }
            },
            data: { stock: { decrement: quantity } }
          });

      if (stockReservation.count === 0) {
        const label = variant ? `${product.nameEn} (${variantNameEn(variant)})` : product.nameEn;
        throw new Error(`${label} does not have enough stock.`);
      }

      if (variant) {
        const productStockReservation = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } }
        });

        if (productStockReservation.count === 0) {
          throw new Error(`${product.nameEn} inventory is out of sync. Please try again.`);
        }
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

  revalidateCacheTags(["storefront", "products", "admin-orders", "admin-notifications"]);
  revalidateAdminOrderViews(data.locale);

  return order;
}
