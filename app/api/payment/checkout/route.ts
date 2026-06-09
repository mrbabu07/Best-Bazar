import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { createStoreOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import { orderCreateSchema } from "@/lib/validations/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    const data = orderCreateSchema.parse(await request.json());
    const order = await createStoreOrder({ ...data, paymentMethod: "STRIPE" }, session?.user.id);
    const siteUrl = getSiteUrl();

    const total = Number(order.total);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.customerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "aed",
            unit_amount: Math.round(total * 100),
            product_data: {
              name: `Best Bazar order ${order.orderNumber}`,
              description: `${order.items.length} item${order.items.length === 1 ? "" : "s"} including shipping and discounts`
            }
          }
        }
      ],
      success_url: `${siteUrl}/en/order-confirmation/${order.id}?status=success&token=${order.accessToken}`,
      cancel_url: `${siteUrl}/en/checkout?status=cancelled`
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id }
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: checkoutSession.url
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid checkout payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
