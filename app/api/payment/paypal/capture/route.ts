import { OrderStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { sendOrderMessagingNotifications } from "@/lib/notifications";
import { updateOrderStatus } from "@/lib/order-status";
import { capturePayPalOrder } from "@/lib/payment-gateways";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const orderToken = url.searchParams.get("orderToken");
  const paypalOrderId = url.searchParams.get("token");
  const locale = url.searchParams.get("locale") === "ar" ? "ar" : "en";
  const siteUrl = getSiteUrl().replace(/\/$/, "");

  try {
    if (!orderId || !orderToken || !paypalOrderId) {
      throw new Error("Missing PayPal capture parameters.");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, accessToken: true, paymentProviderReference: true }
    });

    if (!order || order.accessToken !== orderToken || order.paymentProviderReference !== paypalOrderId) {
      throw new Error("Invalid PayPal order callback.");
    }

    await capturePayPalOrder(paypalOrderId);

    const updatedOrder = await updateOrderStatus({
      orderId,
      orderStatus: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID
    });
    await Promise.allSettled([
      sendOrderConfirmationEmail(updatedOrder),
      sendOrderMessagingNotifications(updatedOrder, "created")
    ]);

    return NextResponse.redirect(`${siteUrl}/${locale}/order-confirmation/${orderId}?status=success&token=${orderToken}`);
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "PayPal capture failed.");

    return NextResponse.redirect(`${siteUrl}/${locale}/checkout?status=paypal-failed&message=${message}`);
  }
}
