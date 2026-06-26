export type StripeMode = "payment_element" | "hosted_checkout";
export type PaymentSettings = {
  cod: {
    enabled: boolean;
    displayName: string;
    instructions: string;
  };
  stripe: {
    enabled: boolean;
    displayName: string;
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    mode: StripeMode;
    instructions: string;
  };
};

export type PublicPaymentAvailability = {
  stripe: boolean;
  stripeLabel: string;
  stripeDetail: string;
  stripePublishableKey: string;
  cod: boolean;
  codLabel: string;
  codDetail: string;
};

export const defaultPaymentSettings: PaymentSettings = {
  cod: {
    enabled: true,
    displayName: "Cash on delivery",
    instructions: "Pay cash when your Dubai delivery arrives."
  },
  stripe: {
    enabled: false,
    displayName: "Card payment",
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    mode: "payment_element",
    instructions: "Visa, Mastercard, Apple Pay, and Google Pay through Stripe."
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  const result = typeof value === "string" ? value : "";
  return result.trim() ? result : fallback;
}

function enabled(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizePaymentSettings(value: unknown): PaymentSettings {
  const input = isRecord(value) ? value : {};
  const cod = isRecord(input.cod) ? input.cod : {};
  const stripe = isRecord(input.stripe) ? input.stripe : {};
  const stripeMode = stripe.mode === "hosted_checkout" ? "hosted_checkout" : "payment_element";

  return {
    cod: {
      enabled: enabled(cod.enabled, defaultPaymentSettings.cod.enabled),
      displayName: text(cod.displayName, defaultPaymentSettings.cod.displayName),
      instructions: text(cod.instructions, defaultPaymentSettings.cod.instructions)
    },
    stripe: {
      enabled: enabled(stripe.enabled, defaultPaymentSettings.stripe.enabled),
      displayName: text(stripe.displayName, defaultPaymentSettings.stripe.displayName),
      publishableKey: text(stripe.publishableKey),
      secretKey: text(stripe.secretKey),
      webhookSecret: text(stripe.webhookSecret),
      mode: stripeMode,
      instructions: text(stripe.instructions, defaultPaymentSettings.stripe.instructions)
    }
  };
}
