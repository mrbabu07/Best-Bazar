import { PaymentMethod, type Order, type OrderItem } from "@prisma/client";
import type { StripeMode } from "@/lib/payment-config";
import { getPaymentAvailability, getPaymentRuntimeConfig } from "@/lib/payment-settings";
import { getSiteUrl, getStripe } from "@/lib/stripe";

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type RedirectPaymentMethod = typeof PaymentMethod.STRIPE;

type CheckoutResult = {
  checkoutUrl: string;
  providerReference?: string;
  stripeSessionId?: string;
};

type PaymentIntentResult = {
  clientSecret: string;
  providerReference: string;
};

const redirectPaymentMethods: readonly PaymentMethod[] = [PaymentMethod.STRIPE];

export function isRedirectPaymentMethod(method: PaymentMethod): method is RedirectPaymentMethod {
  return redirectPaymentMethods.includes(method);
}

export async function getStripeMode(): Promise<StripeMode> {
  const runtime = await getPaymentRuntimeConfig();

  return runtime.settings.stripe.mode || (process.env.STRIPE_MODE === "hosted_checkout" ? "hosted_checkout" : "payment_element");
}

export async function assertRedirectPaymentConfigured(method: RedirectPaymentMethod) {
  const availability = await getPaymentAvailability();
  const enabled = method === PaymentMethod.STRIPE ? availability.stripe : false;

  if (!enabled) {
    throw new Error(`${method} is not configured. Add the required payment environment variables.`);
  }
}

function orderLocale(order: OrderWithItems) {
  return order.locale === "ar" ? "ar" : "en";
}

export function getOrderReturnUrl(order: OrderWithItems) {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const locale = orderLocale(order);

  return `${siteUrl}/${locale}/order-confirmation/${order.id}?status=success&token=${order.accessToken}`;
}

function cancelUrl(order: OrderWithItems, status = "cancelled") {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const locale = orderLocale(order);

  return `${siteUrl}/${locale}/checkout?status=${status}`;
}

async function createStripeCheckout(order: OrderWithItems): Promise<CheckoutResult> {
  const runtime = await getPaymentRuntimeConfig();
  const stripe = getStripe(runtime.stripe.secretKey);

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const session = await stripe.checkout.sessions.create({
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
          unit_amount: Math.round(Number(order.total) * 100),
          product_data: {
            name: `Best Bazar order ${order.orderNumber}`,
            description: `${order.items.length} item${order.items.length === 1 ? "" : "s"} including shipping and discounts`
          }
        }
      }
    ],
    success_url: getOrderReturnUrl(order),
    cancel_url: cancelUrl(order)
  });

  if (!session.url) {
    throw new Error("Stripe checkout URL was not returned.");
  }

  return {
    checkoutUrl: session.url,
    providerReference: session.id,
    stripeSessionId: session.id
  };
}

export async function createStripePaymentIntent(order: OrderWithItems): Promise<PaymentIntentResult> {
  const runtime = await getPaymentRuntimeConfig();
  const stripe = getStripe(runtime.stripe.secretKey);

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(order.total) * 100),
    currency: "aed",
    receipt_email: order.customerEmail,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber
    }
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe payment intent client secret was not returned.");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    providerReference: paymentIntent.id
  };
}

export async function createRedirectCheckout(method: RedirectPaymentMethod, order: OrderWithItems) {
  if (method === PaymentMethod.STRIPE) {
    return createStripeCheckout(order);
  }

  throw new Error(`${method} is not supported.`);
}
