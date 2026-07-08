export type EmirateOption = {
  key: string;
  nameEn: string;
  nameAr: string;
};

export type ShippingRate = {
  key: string;
  emirate: string;
  nameEn: string;
  nameAr: string;
  cost: number;
  freeFrom: number;
  deliveryDays: string;
  codAvailable: boolean;
};

export type ShippingRateRecord = Record<
  string,
  {
    fee?: unknown;
    cost?: unknown;
    freeFrom?: unknown;
    days?: unknown;
    deliveryDays?: unknown;
    cod?: unknown;
    codAvailable?: unknown;
  }
>;

export type ShippingSettings = {
  freeShippingThreshold: number;
  shippingRates: ShippingRate[];
  customAreaFee: CustomAreaFee;
};

export type CustomAreaFee = {
  enabled: boolean;
  areaLabel: string;
  fee: number;
  deliveryDays: string;
  codAvailable: boolean;
};

export type ShippingQuote = {
  fee: number;
  isFree: boolean;
  estimatedDays: string;
  codAvailable: boolean;
  rate: ShippingRate;
};

export const UAE_EMIRATES: EmirateOption[] = [
  { key: "dubai", nameEn: "Dubai", nameAr: "دبي" },
  { key: "abudhabi", nameEn: "Abu Dhabi", nameAr: "أبوظبي" },
  { key: "sharjah", nameEn: "Sharjah", nameAr: "الشارقة" },
  { key: "ajman", nameEn: "Ajman", nameAr: "عجمان" },
  { key: "rak", nameEn: "Ras Al Khaimah", nameAr: "رأس الخيمة" },
  { key: "fujairah", nameEn: "Fujairah", nameAr: "الفجيرة" },
  { key: "uaq", nameEn: "Umm Al Quwain", nameAr: "أم القيوين" }
];

const defaultRateRecord: ShippingRateRecord = {
  dubai: { fee: 15, freeFrom: 200, days: "1-2", cod: true },
  abudhabi: { fee: 20, freeFrom: 250, days: "2-3", cod: true },
  sharjah: { fee: 15, freeFrom: 200, days: "1-2", cod: true },
  ajman: { fee: 15, freeFrom: 200, days: "1-2", cod: true },
  rak: { fee: 25, freeFrom: 300, days: "2-3", cod: true },
  fujairah: { fee: 25, freeFrom: 300, days: "3-4", cod: false },
  uaq: { fee: 25, freeFrom: 300, days: "3-4", cod: false }
};

export const defaultShippingSettings: ShippingSettings = {
  freeShippingThreshold: 250,
  shippingRates: normalizeShippingRateRecord(defaultRateRecord, 250),
  customAreaFee: {
    enabled: false,
    areaLabel: "Delivery area",
    fee: 0,
    deliveryDays: "1-2",
    codAvailable: true
  }
};

function normalizeMoney(value: unknown, fallback: number) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function formatDeliveryDays(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "Delivery time unavailable";
  }

  return /\bday(?:s)?\b/i.test(normalized) ? normalized : `${normalized} days`;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeCustomAreaFee(value: unknown): CustomAreaFee {
  const custom = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    enabled: normalizeBoolean(custom.enabled, defaultShippingSettings.customAreaFee.enabled),
    areaLabel: normalizeText(custom.areaLabel, defaultShippingSettings.customAreaFee.areaLabel),
    fee: normalizeMoney(custom.fee ?? custom.cost, defaultShippingSettings.customAreaFee.fee),
    deliveryDays: normalizeText(custom.deliveryDays ?? custom.days, defaultShippingSettings.customAreaFee.deliveryDays),
    codAvailable: normalizeBoolean(custom.codAvailable ?? custom.cod, defaultShippingSettings.customAreaFee.codAvailable)
  };
}

function emirateByKey(key: string) {
  return UAE_EMIRATES.find((item) => item.key === key);
}

function emirateKey(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = UAE_EMIRATES.find(
    (item) =>
      item.key === normalized ||
      item.nameEn.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized ||
      item.nameAr.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
  );

  return match?.key ?? normalized;
}

function normalizeShippingRateRecord(record: ShippingRateRecord, fallbackFreeFrom: number): ShippingRate[] {
  return UAE_EMIRATES.map((emirate) => {
    const value = record[emirate.key] ?? {};

    return {
      key: emirate.key,
      emirate: emirate.nameEn,
      nameEn: emirate.nameEn,
      nameAr: emirate.nameAr,
      cost: normalizeMoney(value.fee ?? value.cost, 0),
      freeFrom: normalizeMoney(value.freeFrom, fallbackFreeFrom),
      deliveryDays: normalizeText(value.days ?? value.deliveryDays, "1-2"),
      codAvailable: normalizeBoolean(value.cod ?? value.codAvailable, true)
    };
  });
}

function normalizeLegacyRate(value: unknown, fallbackFreeFrom: number): ShippingRate | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rate = value as Record<string, unknown>;
  const emirateName = normalizeText(rate.emirate ?? rate.nameEn, "");

  if (!emirateName) {
    return null;
  }

  const key = emirateKey(emirateName);
  const emirate = emirateByKey(key);

  return {
    key,
    emirate: emirate?.nameEn ?? emirateName,
    nameEn: emirate?.nameEn ?? emirateName,
    nameAr: emirate?.nameAr ?? emirateName,
    cost: normalizeMoney(rate.fee ?? rate.cost, 0),
    freeFrom: normalizeMoney(rate.freeFrom, fallbackFreeFrom),
    deliveryDays: normalizeText(rate.days ?? rate.deliveryDays, "1-2"),
    codAvailable: normalizeBoolean(rate.cod ?? rate.codAvailable, true)
  };
}

function normalizeShippingRates(value: unknown, fallbackFreeFrom: number): ShippingRate[] {
  if (Array.isArray(value)) {
    const rates = value
      .map((rate) => normalizeLegacyRate(rate, fallbackFreeFrom))
      .filter((rate): rate is ShippingRate => Boolean(rate));

    return rates.length ? rates : defaultShippingSettings.shippingRates;
  }

  if (value && typeof value === "object") {
    return normalizeShippingRateRecord(value as ShippingRateRecord, fallbackFreeFrom);
  }

  return defaultShippingSettings.shippingRates;
}

export function normalizeShippingSettings(settings?: Partial<{
  freeShippingThreshold: unknown;
  shippingRates: unknown;
  customAreaFee: unknown;
}> | null): ShippingSettings {
  const freeShippingThreshold = normalizeMoney(
    settings?.freeShippingThreshold,
    defaultShippingSettings.freeShippingThreshold
  );

  const customAreaFeeSource =
    settings?.customAreaFee ??
    (settings?.shippingRates && typeof settings.shippingRates === "object" && !Array.isArray(settings.shippingRates)
      ? (settings.shippingRates as Record<string, unknown>).customAreaFee
      : undefined);
  const customAreaFee = normalizeCustomAreaFee(customAreaFeeSource);

  return {
    freeShippingThreshold,
    shippingRates: normalizeShippingRates(settings?.shippingRates, freeShippingThreshold),
    customAreaFee
  };
}

export function getShippingFee(
  emirate: string,
  subtotal: number,
  shippingRates?: unknown,
  freeShippingThreshold = defaultShippingSettings.freeShippingThreshold,
  customAreaFee?: unknown
): ShippingQuote {
  const settings = normalizeShippingSettings({
    freeShippingThreshold,
    shippingRates,
    customAreaFee
  });
  if (settings.customAreaFee.enabled) {
    const custom = settings.customAreaFee;
    const area = normalizeText(emirate, custom.areaLabel);
    const rate: ShippingRate = {
      key: "custom-area",
      emirate: area,
      nameEn: custom.areaLabel,
      nameAr: custom.areaLabel,
      cost: custom.fee,
      freeFrom: Number.MAX_SAFE_INTEGER,
      deliveryDays: custom.deliveryDays,
      codAvailable: custom.codAvailable
    };

    return {
      fee: custom.fee,
      isFree: false,
      estimatedDays: custom.deliveryDays,
      codAvailable: custom.codAvailable,
      rate
    };
  }
  const key = emirateKey(emirate);
  const rate =
    settings.shippingRates.find((item) => item.key === key) ??
    settings.shippingRates.find((item) => item.emirate.trim().toLowerCase() === emirate.trim().toLowerCase()) ??
    settings.shippingRates[0] ??
    defaultShippingSettings.shippingRates[0];
  const isFree = subtotal <= 0;

  return {
    fee: isFree ? 0 : rate.cost,
    isFree,
    estimatedDays: rate.deliveryDays,
    codAvailable: rate.codAvailable,
    rate
  };
}

export function getShippingCost(settings: ShippingSettings, emirate: string, subtotal: number) {
  return getShippingFee(emirate, subtotal, settings.shippingRates, settings.freeShippingThreshold).fee;
}

export function shippingRatesToRecord(rates: ShippingRate[], customAreaFee?: CustomAreaFee): ShippingRateRecord {
  const record = rates.reduce<ShippingRateRecord>((record, rate) => {
    record[rate.key] = {
      fee: rate.cost,
      freeFrom: rate.freeFrom,
      days: rate.deliveryDays,
      cod: rate.codAvailable
    };

    return record;
  }, {});

  if (customAreaFee) {
    (record as Record<string, unknown>).customAreaFee = customAreaFee;
  }

  return record;
}
