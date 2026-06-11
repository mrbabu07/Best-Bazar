import { PaymentMethod, type Order, type OrderItem } from "@prisma/client";
import type { StripeMode } from "@/lib/payment-config";
import { getPaymentAvailability, getPaymentRuntimeConfig } from "@/lib/payment-settings";
import { getSiteUrl, getStripe } from "@/lib/stripe";

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type RedirectPaymentMethod =
  | typeof PaymentMethod.STRIPE
  | typeof PaymentMethod.TABBY
  | typeof PaymentMethod.TAMARA
  | typeof PaymentMethod.PAYPAL;

type CheckoutResult = {
  checkoutUrl: string;
  providerReference?: string;
  stripeSessionId?: string;
};

type PaymentIntentResult = {
  clientSecret: string;
  providerReference: string;
};

const redirectPaymentMethods: readonly PaymentMethod[] = [
  PaymentMethod.STRIPE,
  PaymentMethod.TABBY,
  PaymentMethod.TAMARA,
  PaymentMethod.PAYPAL
];

export function isRedirectPaymentMethod(method: PaymentMethod): method is RedirectPaymentMethod {
  return redirectPaymentMethods.includes(method);
}

export async function getStripeMode(): Promise<StripeMode> {
  const runtime = await getPaymentRuntimeConfig();

  return runtime.settings.stripe.mode || (process.env.STRIPE_MODE === "hosted_checkout" ? "hosted_checkout" : "payment_element");
}

export async function assertRedirectPaymentConfigured(method: RedirectPaymentMethod) {
  const availability = await getPaymentAvailability();
  const enabled =
    method === PaymentMethod.STRIPE
      ? availability.stripe
      : method === PaymentMethod.TABBY
        ? availability.tabby
        : method === PaymentMethod.TAMARA
          ? availability.tamara
          : availability.paypal;

  if (!enabled) {
    throw new Error(`${method} is not configured. Add the required payment environment variables.`);
  }
}

function amount(value: unknown) {
  return Number(value ?? 0).toFixed(2);
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

function customerNameParts(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Customer";
  const lastName = parts.slice(1).join(" ") || firstName;

  return { firstName, lastName };
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function lineAddress(order: OrderWithItems) {
  return [order.street, order.tower, order.apartment].filter(Boolean).join(", ");
}

function firstCheckoutUrlFromTabby(result: Record<string, unknown>) {
  const configuration = result.configuration as Record<string, unknown> | undefined;
  const availableProducts = configuration?.available_products as Record<string, unknown> | undefined;

  if (!availableProducts) {
    return "";
  }

  for (const value of Object.values(availableProducts)) {
    const rows = Array.isArray(value) ? value : [value];
    const row = rows.find((item) => {
      return typeof item === "object" && item !== null && typeof (item as { web_url?: unknown }).web_url === "string";
    }) as { web_url?: string } | undefined;

    if (row?.web_url) {
      return row.web_url;
    }
  }

  return "";
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

async function createTabbyCheckout(order: OrderWithItems): Promise<CheckoutResult> {
  const runtime = await getPaymentRuntimeConfig();
  const secretKey = runtime.tabby.secretKey;
  const merchantCode = runtime.tabby.merchantCode;
  const baseUrl = runtime.tabby.apiBaseUrl.replace(/\/$/, "");

  if (!secretKey || !merchantCode) {
    throw new Error("Tabby is not configured.");
  }

  const result = await fetch(`${baseUrl}/api/v2/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      payment: {
        amount: amount(order.total),
        currency: "AED",
        buyer: {
          name: order.customerName,
          email: order.customerEmail,
          phone: phoneDigits(order.customerPhone)
        },
        shipping_address: {
          city: order.city,
          address: lineAddress(order),
          zip: "00000"
        },
        order: {
          reference_id: order.orderNumber,
          items: order.items.map((item) => ({
            title: item.nameEn,
            quantity: item.quantity,
            unit_price: amount(item.price),
            category: "Best Bazar",
            reference_id: item.variantSku || item.productId || item.id,
            description: item.variantNameEn || item.nameEn,
            discount_amount: "0.00",
            image_url: item.image || undefined,
            product_url: getSiteUrl(),
            is_refundable: true
          })),
          updated_at: order.updatedAt.toISOString(),
          tax_amount: amount(order.vatAmount),
          shipping_amount: amount(order.shippingCost),
          discount_amount: amount(order.discount)
        },
        description: `Best Bazar order ${order.orderNumber}`,
        meta: {
          order_id: order.id,
          order_number: order.orderNumber
        }
      },
      lang: orderLocale(order),
      merchant_code: merchantCode,
      merchant_urls: {
        success: getOrderReturnUrl(order),
        cancel: cancelUrl(order, "tabby-cancelled"),
        failure: cancelUrl(order, "tabby-failed")
      },
      token: null
    })
  });
  const data = (await result.json()) as Record<string, unknown>;

  if (!result.ok) {
    throw new Error(`Tabby checkout failed: ${JSON.stringify(data)}`);
  }

  const checkoutUrl = firstCheckoutUrlFromTabby(data);

  if (!checkoutUrl) {
    throw new Error("Tabby checkout URL was not returned.");
  }

  const payment = data.payment as { id?: string } | undefined;

  return {
    checkoutUrl,
    providerReference: payment?.id || String(data.id ?? "")
  };
}

async function createTamaraCheckout(order: OrderWithItems): Promise<CheckoutResult> {
  const runtime = await getPaymentRuntimeConfig();
  const apiToken = runtime.tamara.apiToken;
  const baseUrl = runtime.tamara.apiBaseUrl.replace(/\/$/, "");
  const { firstName, lastName } = customerNameParts(order.customerName);

  if (!apiToken) {
    throw new Error("Tamara is not configured.");
  }

  const result = await fetch(`${baseUrl}/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      total_amount: { amount: amount(order.total), currency: "AED" },
      shipping_amount: { amount: amount(order.shippingCost), currency: "AED" },
      tax_amount: { amount: amount(order.vatAmount), currency: "AED" },
      order_reference_id: order.id,
      order_number: order.orderNumber,
      items: order.items.map((item) => ({
        name: item.nameEn,
        quantity: item.quantity,
        reference_id: item.productId || item.id,
        type: "Physical",
        sku: item.variantSku || item.productId || item.id,
        unit_price: { amount: amount(item.price), currency: "AED" },
        total_amount: { amount: amount(Number(item.price) * item.quantity), currency: "AED" }
      })),
      consumer: {
        first_name: firstName,
        last_name: lastName,
        phone_number: order.customerPhone,
        email: order.customerEmail
      },
      country_code: "AE",
      description: `Best Bazar order ${order.orderNumber}`,
      merchant_url: {
        success: getOrderReturnUrl(order),
        failure: cancelUrl(order, "tamara-failed"),
        cancel: cancelUrl(order, "tamara-cancelled"),
        notification: `${getSiteUrl().replace(/\/$/, "")}/api/payment/webhook/tamara`
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        line1: order.street,
        line2: [order.tower, order.apartment].filter(Boolean).join(", "),
        city: order.city,
        region: order.emirate,
        country_code: "AE",
        phone_number: order.customerPhone
      },
      platform: "Best Bazar",
      is_mobile: false,
      locale: order.locale === "ar" ? "ar_SA" : "en_US"
    })
  });
  const data = (await result.json()) as Record<string, unknown>;

  if (!result.ok) {
    throw new Error(`Tamara checkout failed: ${JSON.stringify(data)}`);
  }

  const checkoutUrl = typeof data.checkout_url === "string" ? data.checkout_url : "";

  if (!checkoutUrl) {
    throw new Error("Tamara checkout URL was not returned.");
  }

  return {
    checkoutUrl,
    providerReference: String(data.checkout_id ?? data.order_id ?? "")
  };
}

async function getPayPalAccessToken() {
  const runtime = await getPaymentRuntimeConfig();
  const clientId = runtime.paypal.clientId;
  const clientSecret = runtime.paypal.clientSecret;
  const baseUrl = runtime.paypal.apiBaseUrl.replace(/\/$/, "");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured.");
  }

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ grant_type: "client_credentials" })
  });
  const data = (await response.json()) as { access_token?: string };

  if (!response.ok || !data.access_token) {
    throw new Error(`PayPal access token failed: ${JSON.stringify(data)}`);
  }

  return { accessToken: data.access_token, baseUrl };
}

async function createPayPalCheckout(order: OrderWithItems): Promise<CheckoutResult> {
  const { accessToken, baseUrl } = await getPayPalAccessToken();
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const locale = orderLocale(order);
  const returnUrl = `${siteUrl}/api/payment/paypal/capture?orderId=${encodeURIComponent(order.id)}&orderToken=${encodeURIComponent(order.accessToken ?? "")}&locale=${locale}`;
  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": order.id
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.id,
          invoice_id: order.orderNumber.slice(0, 127),
          amount: {
            currency_code: "AED",
            value: amount(order.total)
          },
          description: `Best Bazar order ${order.orderNumber}`.slice(0, 127)
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Best Bazar",
            locale: locale === "ar" ? "ar-AE" : "en-AE",
            landing_page: "LOGIN",
            shipping_preference: "SET_PROVIDED_ADDRESS",
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl(order, "paypal-cancelled")
          }
        }
      }
    })
  });
  const data = (await response.json()) as {
    id?: string;
    links?: Array<{ href: string; rel: string }>;
  };

  if (!response.ok) {
    throw new Error(`PayPal checkout failed: ${JSON.stringify(data)}`);
  }

  const checkoutUrl = data.links?.find((link) => link.rel === "approve" || link.rel === "payer-action")?.href;

  if (!checkoutUrl || !data.id) {
    throw new Error("PayPal approval URL was not returned.");
  }

  return {
    checkoutUrl,
    providerReference: data.id
  };
}

export async function createRedirectCheckout(method: RedirectPaymentMethod, order: OrderWithItems) {
  if (method === PaymentMethod.STRIPE) {
    return createStripeCheckout(order);
  }

  if (method === PaymentMethod.TABBY) {
    return createTabbyCheckout(order);
  }

  if (method === PaymentMethod.TAMARA) {
    return createTamaraCheckout(order);
  }

  return createPayPalCheckout(order);
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const { accessToken, baseUrl } = await getPayPalAccessToken();
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`PayPal capture failed: ${JSON.stringify(data)}`);
  }

  return data;
}
