import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(3),
  contact: z.string().trim().min(3)
});

function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export async function POST(request: Request) {
  try {
    const data = trackOrderSchema.parse(await request.json());
    const contactPhone = normalizePhone(data.contact);
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: data.orderNumber.trim().toUpperCase(),
        OR: [
          { customerEmail: { equals: data.contact.toLowerCase(), mode: "insensitive" } },
          ...(contactPhone ? [{ customerPhone: { contains: contactPhone } }] : [])
        ]
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found. Check the order number and contact detail." }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      shippingAddress: {
        street: order.street,
        apartment: order.apartment,
        tower: order.tower,
        city: order.city,
        emirate: order.emirate,
        country: order.country
      },
      deliverySlot: order.deliverySlot,
      items: order.items.map((item) => ({
        id: item.id,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        variantNameEn: item.variantNameEn,
        variantNameAr: item.variantNameAr,
        quantity: item.quantity,
        price: Number(item.price),
        image: item.image
      }))
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid tracking request." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to track order." }, { status: 500 });
  }
}
