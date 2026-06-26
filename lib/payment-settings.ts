import type { PaymentMethod } from "@prisma/client";
import {
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
    }
  };
}

export async function getPaymentAvailability(): Promise<PublicPaymentAvailability> {
  const runtime = await getPaymentRuntimeConfig();
  const { settings } = runtime;
  const stripeMode = settings.stripe.mode;
  const stripeConfigured =
    Boolean(runtime.stripe.secretKey) && (stripeMode === "hosted_checkout" || Boolean(runtime.stripe.publishableKey));

  return {
    stripe: settings.stripe.enabled && stripeConfigured,
    stripeLabel: settings.stripe.displayName,
    stripeDetail: settings.stripe.instructions,
    stripePublishableKey: runtime.stripe.publishableKey,
    cod: settings.cod.enabled && process.env.COD_ENABLED !== "false",
    codAvailabilityMode: settings.cod.availabilityMode,
    codMinOrderAmount: settings.cod.minOrderAmount,
    codLabel: settings.cod.displayName,
    codDetail: settings.cod.instructions
  };
}

export async function assertPaymentMethodAvailable(method: PaymentMethod, subtotal?: number) {
  const availability = await getPaymentAvailability();
  const enabled =
    method === "STRIPE"
      ? availability.stripe
      : method === "COD"
        ? availability.cod &&
          (availability.codAvailabilityMode !== "minimum" ||
            typeof subtotal !== "number" ||
            subtotal >= availability.codMinOrderAmount)
        : false;

  if (!enabled) {
    if (method === "COD" && availability.codAvailabilityMode === "minimum") {
      throw new Error(`Cash on delivery is available from AED ${availability.codMinOrderAmount}.`);
    }

    throw new Error(`${method} is not enabled or configured.`);
  }
}
