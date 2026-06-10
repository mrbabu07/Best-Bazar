import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PaymentMethod } from "@prisma/client";
import { getOptionalServerSession } from "@/lib/auth-session";
import { createStoreOrder } from "@/lib/orders";
import {
  assertRedirectPaymentConfigured,
  createRedirectCheckout,
  createStripePaymentIntent,
  getOrderReturnUrl,
  getStripeMode,
  isRedirectPaymentMethod
} from "@/lib/payment-gateways";
import { prisma } from "@/lib/prisma";
import { orderCreateSchema } from "@/lib/validations/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getOptionalServerSession(request);
    const data = orderCreateSchema.parse(await request.json());
    const method = data.paymentMethod as PaymentMethod;

    if (!isRedirectPaymentMethod(method)) {
      return NextResponse.json({ error: "Use the order endpoint for manual payment methods." }, { status: 400 });
    }

    assertRedirectPaymentConfigured(method);

    const order = await createStoreOrder({ ...data, paymentMethod: method }, session?.user.id);

    if (method === PaymentMethod.STRIPE && getStripeMode() === "payment_element") {
      const paymentIntent = await createStripePaymentIntent(order);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentProviderReference: paymentIntent.providerReference
        }
      });

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        clientSecret: paymentIntent.clientSecret,
        orderConfirmUrl: getOrderReturnUrl(order)
      });
    }

    const checkout = await createRedirectCheckout(method, order);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: checkout.stripeSessionId,
        paymentProviderReference: checkout.providerReference,
        paymentCheckoutUrl: checkout.checkoutUrl
      }
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      checkoutUrl: checkout.checkoutUrl
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid checkout payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      const status = error.message.includes("not configured") ? 503 : 400;

      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
