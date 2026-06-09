import { OrderStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";
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

      const order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.CONFIRMED
        },
        include: { items: true }
      });
      await sendOrderConfirmationEmail(order);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;

    if (session.id) {
      await prisma.order.updateMany({
        where: { stripeSessionId: session.id },
        data: {
          paymentStatus: PaymentStatus.FAILED
        }
      });
    }
  }

  return NextResponse.json({ received: true });
}
