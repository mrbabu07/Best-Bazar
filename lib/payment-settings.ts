import type { PaymentMethod } from "@prisma/client";
import {
  bankTransferSummary,
  normalizePaymentSettings,
  type PaymentSettings,
  type PublicPaymentAvailability
} from "@/lib/payment-config";
import { prisma } from "@/lib/prisma";

export type PaymentRuntimeConfig = {
  settings: PaymentSettings;
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  tabby: {
    secretKey: string;
    merchantCode: string;
    apiBaseUrl: string;
  };
  tamara: {
    apiToken: string;
    apiBaseUrl: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    apiBaseUrl: string;
  };
};

export async function getAdminPaymentSettings() {
  const settings = await prisma.setting.findUnique({
    where: { id: "store-settings" },
    select: { paymentSettings: true }
  });

  return normalizePaymentSettings(settings?.paymentSettings);
}

export async function getPaymentRuntimeConfig(): Promise<PaymentRuntimeConfig> {
  const settings = await getAdminPaymentSettings();

  return {
    settings,
    stripe: {
      publishableKey: settings.stripe.publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      secretKey: settings.stripe.secretKey || process.env.STRIPE_SECRET_KEY || "",
      webhookSecret: settings.stripe.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ""
    },
    tabby: {
      secretKey: settings.tabby.secretKey || process.env.TABBY_SECRET_KEY || "",
      merchantCode: settings.tabby.merchantCode || process.env.TABBY_MERCHANT_CODE || "",
      apiBaseUrl: settings.tabby.apiBaseUrl || process.env.TABBY_API_BASE_URL || "https://api.tabby.ai"
    },
    tamara: {
      apiToken: settings.tamara.apiToken || process.env.TAMARA_API_TOKEN || "",
      apiBaseUrl: settings.tamara.apiBaseUrl || process.env.TAMARA_API_BASE_URL || "https://api-sandbox.tamara.co"
    },
    paypal: {
      clientId: settings.paypal.clientId || process.env.PAYPAL_CLIENT_ID || "",
      clientSecret: settings.paypal.clientSecret || process.env.PAYPAL_CLIENT_SECRET || "",
      apiBaseUrl: settings.paypal.apiBaseUrl || process.env.PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com"
    }
  };
}

export async function getPaymentAvailability(): Promise<PublicPaymentAvailability> {
  const runtime = await getPaymentRuntimeConfig();
  const { settings } = runtime;
  const bankInstructions =
    bankTransferSummary(settings.bankTransfer) || process.env.BANK_TRANSFER_INSTRUCTIONS || "";
  const stripeMode = settings.stripe.mode;
  const stripeConfigured =
    Boolean(runtime.stripe.secretKey) && (stripeMode === "hosted_checkout" || Boolean(runtime.stripe.publishableKey));

  return {
    stripe: settings.stripe.enabled && stripeConfigured,
    stripeLabel: settings.stripe.displayName,
    stripeDetail: settings.stripe.instructions,
    stripePublishableKey: runtime.stripe.publishableKey,
    tabby: settings.tabby.enabled && Boolean(runtime.tabby.secretKey && runtime.tabby.merchantCode),
    tabbyLabel: settings.tabby.displayName,
    tabbyDetail: settings.tabby.instructions,
    tamara: settings.tamara.enabled && Boolean(runtime.tamara.apiToken),
    tamaraLabel: settings.tamara.displayName,
    tamaraDetail: settings.tamara.instructions,
    paypal: settings.paypal.enabled && Boolean(runtime.paypal.clientId && runtime.paypal.clientSecret),
    paypalLabel: settings.paypal.displayName,
    paypalDetail: settings.paypal.instructions,
    cod: settings.cod.enabled && process.env.COD_ENABLED !== "false",
    codLabel: settings.cod.displayName,
    codDetail: settings.cod.instructions,
    bankTransfer: settings.bankTransfer.enabled,
    bankTransferLabel: settings.bankTransfer.displayName,
    bankTransferDetail: settings.bankTransfer.instructions,
    bankTransferInstructions: bankInstructions
  };
}

export async function assertPaymentMethodAvailable(method: PaymentMethod) {
  const availability = await getPaymentAvailability();
  const enabled =
    method === "STRIPE"
      ? availability.stripe
      : method === "TABBY"
        ? availability.tabby
        : method === "TAMARA"
          ? availability.tamara
          : method === "PAYPAL"
            ? availability.paypal
            : method === "COD"
              ? availability.cod
              : availability.bankTransfer;

  if (!enabled) {
    throw new Error(`${method} is not enabled or configured.`);
  }
}
