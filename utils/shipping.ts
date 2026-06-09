export type ShippingRate = {
  emirate: string;
  cost: number;
  deliveryDays?: string;
};

export type ShippingSettings = {
  freeShippingThreshold: number;
  shippingRates: ShippingRate[];
};

export const defaultShippingSettings: ShippingSettings = {
  freeShippingThreshold: 250,
  shippingRates: [
    { emirate: "Dubai", cost: 20, deliveryDays: "1-2" },
    { emirate: "Abu Dhabi", cost: 35, deliveryDays: "2-3" },
    { emirate: "Sharjah", cost: 25, deliveryDays: "1-3" },
    { emirate: "Ajman", cost: 30, deliveryDays: "2-3" },
    { emirate: "Ras Al Khaimah", cost: 40, deliveryDays: "3-4" },
    { emirate: "Fujairah", cost: 40, deliveryDays: "3-4" },
    { emirate: "Umm Al Quwain", cost: 35, deliveryDays: "3-4" }
  ]
};

function normalizeMoney(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeRate(value: unknown): ShippingRate | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rate = value as Record<string, unknown>;
  const emirate = typeof rate.emirate === "string" ? rate.emirate.trim() : "";

  if (!emirate) {
    return null;
  }

  return {
    emirate,
    cost: normalizeMoney(rate.cost, 0),
    deliveryDays: typeof rate.deliveryDays === "string" ? rate.deliveryDays : undefined
  };
}

export function normalizeShippingSettings(settings?: Partial<{
  freeShippingThreshold: unknown;
  shippingRates: unknown;
}> | null): ShippingSettings {
  const rates = Array.isArray(settings?.shippingRates)
    ? settings.shippingRates.map(normalizeRate).filter((rate): rate is ShippingRate => Boolean(rate))
    : defaultShippingSettings.shippingRates;

  return {
    freeShippingThreshold: normalizeMoney(
      settings?.freeShippingThreshold,
      defaultShippingSettings.freeShippingThreshold
    ),
    shippingRates: rates.length ? rates : defaultShippingSettings.shippingRates
  };
}

export function getShippingCost(settings: ShippingSettings, emirate: string, subtotal: number) {
  const normalized = normalizeShippingSettings(settings);

  if (subtotal <= 0 || subtotal >= normalized.freeShippingThreshold) {
    return 0;
  }

  const normalizedEmirate = emirate.trim().toLowerCase();
  const rate = normalized.shippingRates.find(
    (item) => item.emirate.trim().toLowerCase() === normalizedEmirate
  );

  return rate?.cost ?? normalized.shippingRates[0]?.cost ?? 0;
}
