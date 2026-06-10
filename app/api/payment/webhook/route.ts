import { OrderStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { sendOrderMessagingNotifications } from "@/lib/notifications";
import { updateOrderStatus } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.id) {
      const existingOrder = await prisma.order.findFirst({
        where: { stripeSessionId: session.id },
        select: { id: true }
      });

      if (!existingOrder) {
        return NextResponse.json({ received: true });
      }

      const order = await updateOrderStatus({
        orderId: existingOrder.id,
        orderStatus: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID
      });
      await Promise.allSettled([
        sendOrderConfirmationEmail(order),
        sendOrderMessagingNotifications(order, "created")
      ]);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;

    if (session.id) {
      const existingOrder = await prisma.order.findFirst({
        where: { stripeSessionId: session.id },
        select: { id: true }
      });

      if (existingOrder) {
        await updateOrderStatus({
          orderId: existingOrder.id,
          orderStatus: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.FAILED,
          internalNotes: "Stripe checkout expired before payment."
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
