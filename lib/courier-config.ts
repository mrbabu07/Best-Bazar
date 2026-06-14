export type CourierProvider = "manual" | "aramex" | "fetchr" | "dhl" | "shiprocket" | "other";

export type CourierSettings = {
  enabled: boolean;
  provider: CourierProvider;
  displayName: string;
  accountNumber: string;
  apiKey: string;
  apiSecret: string;
  webhookSecret: string;
  trackingUrlTemplate: string;
  pickupCity: string;
  serviceLevel: string;
  notes: string;
};

export const courierProviderOptions: Array<{ value: CourierProvider; label: string }> = [
  { value: "manual", label: "Manual courier" },
  { value: "aramex", label: "Aramex UAE" },
  { value: "fetchr", label: "Fetchr" },
  { value: "dhl", label: "DHL Express" },
  { value: "shiprocket", label: "Shiprocket / partner" },
  { value: "other", label: "Other Dubai courier" }
];

export const defaultCourierSettings: CourierSettings = {
  enabled: false,
  provider: "manual",
  displayName: "Dubai delivery partner",
  accountNumber: "",
  apiKey: "",
  apiSecret: "",
  webhookSecret: "",
  trackingUrlTemplate: "",
  pickupCity: "Dubai",
  serviceLevel: "standard",
  notes: ""
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function provider(value: unknown): CourierProvider {
  return courierProviderOptions.some((option) => option.value === value) ? (value as CourierProvider) : "manual";
}

export function normalizeCourierSettings(value: unknown): CourierSettings {
  const input = isRecord(value) ? value : {};

  return {
    enabled: typeof input.enabled === "boolean" ? input.enabled : defaultCourierSettings.enabled,
    provider: provider(input.provider),
    displayName: text(input.displayName, defaultCourierSettings.displayName),
    accountNumber: text(input.accountNumber),
    apiKey: text(input.apiKey),
    apiSecret: text(input.apiSecret),
    webhookSecret: text(input.webhookSecret),
    trackingUrlTemplate: text(input.trackingUrlTemplate),
    pickupCity: text(input.pickupCity, defaultCourierSettings.pickupCity),
    serviceLevel: text(input.serviceLevel, defaultCourierSettings.serviceLevel),
    notes: text(input.notes)
  };
}
