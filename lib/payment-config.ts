export type StripeMode = "payment_element" | "hosted_checkout";

export type PaymentSettings = {
  cod: {
    enabled: boolean;
    displayName: string;
    instructions: string;
  };
  bankTransfer: {
    enabled: boolean;
    displayName: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    swift: string;
    branch: string;
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
  tabby: {
    enabled: boolean;
    displayName: string;
    secretKey: string;
    merchantCode: string;
    apiBaseUrl: string;
    instructions: string;
  };
  tamara: {
    enabled: boolean;
    displayName: string;
    apiToken: string;
    apiBaseUrl: string;
    instructions: string;
  };
  paypal: {
    enabled: boolean;
    displayName: string;
    clientId: string;
    clientSecret: string;
    apiBaseUrl: string;
    instructions: string;
  };
};

export type PublicPaymentAvailability = {
  stripe: boolean;
  stripeLabel: string;
  stripeDetail: string;
  stripePublishableKey: string;
  tabby: boolean;
  tabbyLabel: string;
  tabbyDetail: string;
  tamara: boolean;
  tamaraLabel: string;
  tamaraDetail: string;
  paypal: boolean;
  paypalLabel: string;
  paypalDetail: string;
  cod: boolean;
  codLabel: string;
  codDetail: string;
  bankTransfer: boolean;
  bankTransferLabel: string;
  bankTransferDetail: string;
  bankTransferInstructions: string;
};

export const defaultPaymentSettings: PaymentSettings = {
  cod: {
    enabled: true,
    displayName: "Cash on delivery",
    instructions: "Pay cash when your Dubai delivery arrives."
  },
  bankTransfer: {
    enabled: false,
    displayName: "Bank transfer",
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    swift: "",
    branch: "",
    instructions: "Transfer after order confirmation and share the receipt on WhatsApp."
  },
  stripe: {
    enabled: true,
    displayName: "Card payment",
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    mode: "payment_element",
    instructions: "Visa, Mastercard, Apple Pay, and Google Pay through Stripe."
  },
  tabby: {
    enabled: true,
    displayName: "Tabby",
    secretKey: "",
    merchantCode: "",
    apiBaseUrl: "https://api.tabby.ai",
    instructions: "Pay in installments through Tabby hosted checkout."
  },
  tamara: {
    enabled: true,
    displayName: "Tamara",
    apiToken: "",
    apiBaseUrl: "https://api-sandbox.tamara.co",
    instructions: "Pay later through Tamara hosted checkout."
  },
  paypal: {
    enabled: true,
    displayName: "PayPal",
    clientId: "",
    clientSecret: "",
    apiBaseUrl: "https://api-m.sandbox.paypal.com",
    instructions: "PayPal wallet hosted approval and capture."
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
  const bankTransfer = isRecord(input.bankTransfer) ? input.bankTransfer : {};
  const stripe = isRecord(input.stripe) ? input.stripe : {};
  const tabby = isRecord(input.tabby) ? input.tabby : {};
  const tamara = isRecord(input.tamara) ? input.tamara : {};
  const paypal = isRecord(input.paypal) ? input.paypal : {};
  const stripeMode = stripe.mode === "hosted_checkout" ? "hosted_checkout" : "payment_element";

  return {
    cod: {
      enabled: enabled(cod.enabled, defaultPaymentSettings.cod.enabled),
      displayName: text(cod.displayName, defaultPaymentSettings.cod.displayName),
      instructions: text(cod.instructions, defaultPaymentSettings.cod.instructions)
    },
    bankTransfer: {
      enabled: enabled(bankTransfer.enabled, defaultPaymentSettings.bankTransfer.enabled),
      displayName: text(bankTransfer.displayName, defaultPaymentSettings.bankTransfer.displayName),
      bankName: text(bankTransfer.bankName),
      accountName: text(bankTransfer.accountName),
      accountNumber: text(bankTransfer.accountNumber),
      iban: text(bankTransfer.iban),
      swift: text(bankTransfer.swift),
      branch: text(bankTransfer.branch),
      instructions: text(bankTransfer.instructions, defaultPaymentSettings.bankTransfer.instructions)
    },
    stripe: {
      enabled: enabled(stripe.enabled, defaultPaymentSettings.stripe.enabled),
      displayName: text(stripe.displayName, defaultPaymentSettings.stripe.displayName),
      publishableKey: text(stripe.publishableKey),
      secretKey: text(stripe.secretKey),
      webhookSecret: text(stripe.webhookSecret),
      mode: stripeMode,
      instructions: text(stripe.instructions, defaultPaymentSettings.stripe.instructions)
    },
    tabby: {
      enabled: enabled(tabby.enabled, defaultPaymentSettings.tabby.enabled),
      displayName: text(tabby.displayName, defaultPaymentSettings.tabby.displayName),
      secretKey: text(tabby.secretKey),
      merchantCode: text(tabby.merchantCode),
      apiBaseUrl: text(tabby.apiBaseUrl, defaultPaymentSettings.tabby.apiBaseUrl),
      instructions: text(tabby.instructions, defaultPaymentSettings.tabby.instructions)
    },
    tamara: {
      enabled: enabled(tamara.enabled, defaultPaymentSettings.tamara.enabled),
      displayName: text(tamara.displayName, defaultPaymentSettings.tamara.displayName),
      apiToken: text(tamara.apiToken),
      apiBaseUrl: text(tamara.apiBaseUrl, defaultPaymentSettings.tamara.apiBaseUrl),
      instructions: text(tamara.instructions, defaultPaymentSettings.tamara.instructions)
    },
    paypal: {
      enabled: enabled(paypal.enabled, defaultPaymentSettings.paypal.enabled),
      displayName: text(paypal.displayName, defaultPaymentSettings.paypal.displayName),
      clientId: text(paypal.clientId),
      clientSecret: text(paypal.clientSecret),
      apiBaseUrl: text(paypal.apiBaseUrl, defaultPaymentSettings.paypal.apiBaseUrl),
      instructions: text(paypal.instructions, defaultPaymentSettings.paypal.instructions)
    }
  };
}

export function bankTransferSummary(settings: PaymentSettings["bankTransfer"]) {
  return [
    settings.instructions,
    settings.bankName ? `Bank: ${settings.bankName}` : "",
    settings.accountName ? `Account name: ${settings.accountName}` : "",
    settings.accountNumber ? `Account no: ${settings.accountNumber}` : "",
    settings.iban ? `IBAN: ${settings.iban}` : "",
    settings.swift ? `SWIFT: ${settings.swift}` : "",
    settings.branch ? `Branch: ${settings.branch}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}
