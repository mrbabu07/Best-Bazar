export const PRODUCT_TYPE_GENERAL = "GENERAL";
export const PRODUCT_TYPE_WOMENS_FASHION = "WOMENS_FASHION";

export const productTypeOptions = [
  { value: PRODUCT_TYPE_GENERAL, label: "General product" },
  { value: PRODUCT_TYPE_WOMENS_FASHION, label: "Women's Fashion" }
] as const;

export const customFieldTypeOptions = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "TEXTAREA", label: "Long text" }
] as const;

export type ProductType = (typeof productTypeOptions)[number]["value"];
export type CategoryCustomFieldType = (typeof customFieldTypeOptions)[number]["value"];

export type CategoryCustomField = {
  id: string;
  labelEn: string;
  labelAr: string;
  type: CategoryCustomFieldType;
  required: boolean;
};

export type FashionFields = {
  fabric: string;
  material: string;
  lining: string;
  occasion: string;
  season: string;
  care: string;
  fit: string;
  style: string;
  length: string;
  closure: string;
  transparency: string;
  origin: string;
  warranty: string;
  returnNote: string;
  halalBadge: boolean;
};

export const emptyFashionFields: FashionFields = {
  fabric: "",
  material: "",
  lining: "",
  occasion: "",
  season: "",
  care: "",
  fit: "",
  style: "",
  length: "",
  closure: "",
  transparency: "",
  origin: "",
  warranty: "",
  returnNote: "",
  halalBadge: false
};

export const fashionCoreFields = [
  { key: "fabric", labelEn: "Fabric", labelAr: "\u0627\u0644\u0642\u0645\u0627\u0634", type: "text" },
  { key: "material", labelEn: "Material", labelAr: "\u0627\u0644\u062e\u0627\u0645\u0629", type: "text" },
  { key: "lining", labelEn: "Lining", labelAr: "\u0627\u0644\u0628\u0637\u0627\u0646\u0629", type: "text" },
  { key: "occasion", labelEn: "Occasion", labelAr: "\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629", type: "text" },
  { key: "season", labelEn: "Season", labelAr: "\u0627\u0644\u0645\u0648\u0633\u0645", type: "text" },
  { key: "care", labelEn: "Care", labelAr: "\u0627\u0644\u0639\u0646\u0627\u064a\u0629", type: "text" },
  { key: "fit", labelEn: "Fit", labelAr: "\u0627\u0644\u0645\u0642\u0627\u0633", type: "text" },
  { key: "style", labelEn: "Style", labelAr: "\u0627\u0644\u0646\u0645\u0637", type: "text" },
  { key: "length", labelEn: "Length", labelAr: "\u0627\u0644\u0637\u0648\u0644", type: "text" },
  { key: "closure", labelEn: "Closure", labelAr: "\u0627\u0644\u0625\u063a\u0644\u0627\u0642", type: "text" },
  { key: "transparency", labelEn: "Transparency", labelAr: "\u0627\u0644\u0634\u0641\u0627\u0641\u064a\u0629", type: "text" },
  { key: "origin", labelEn: "Origin", labelAr: "\u0628\u0644\u062f \u0627\u0644\u0645\u0646\u0634\u0623", type: "text" },
  { key: "warranty", labelEn: "Warranty", labelAr: "\u0627\u0644\u0636\u0645\u0627\u0646", type: "text" },
  { key: "returnNote", labelEn: "Return note", labelAr: "\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0625\u0631\u062c\u0627\u0639", type: "text" },
  { key: "halalBadge", labelEn: "Halal badge", labelAr: "\u0634\u0627\u0631\u0629 \u062d\u0644\u0627\u0644", type: "boolean" }
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function makeCustomFieldId(label: string) {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `field-${Date.now()}`;
}

export function normalizeProductType(value: unknown): ProductType {
  return value === PRODUCT_TYPE_WOMENS_FASHION ? PRODUCT_TYPE_WOMENS_FASHION : PRODUCT_TYPE_GENERAL;
}

export function isFashionProductType(value: unknown) {
  return normalizeProductType(value) === PRODUCT_TYPE_WOMENS_FASHION;
}

export function normalizeCategoryCustomFields(value: unknown): CategoryCustomField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((field) => {
      const labelEn = String(field.labelEn ?? "").trim();
      const labelAr = String(field.labelAr ?? "").trim();
      const type = customFieldTypeOptions.some((option) => option.value === field.type)
        ? (field.type as CategoryCustomFieldType)
        : "TEXT";

      return {
        id: String(field.id ?? makeCustomFieldId(labelEn)).trim() || makeCustomFieldId(labelEn),
        labelEn,
        labelAr,
        type,
        required: Boolean(field.required)
      };
    })
    .filter((field) => field.labelEn && field.labelAr);
}

export function normalizeFashionFields(value: unknown): FashionFields {
  if (!isRecord(value)) {
    return { ...emptyFashionFields };
  }

  return {
    fabric: String(value.fabric ?? ""),
    material: String(value.material ?? ""),
    lining: String(value.lining ?? ""),
    occasion: String(value.occasion ?? ""),
    season: String(value.season ?? ""),
    care: String(value.care ?? ""),
    fit: String(value.fit ?? ""),
    style: String(value.style ?? ""),
    length: String(value.length ?? ""),
    closure: String(value.closure ?? ""),
    transparency: String(value.transparency ?? ""),
    origin: String(value.origin ?? ""),
    warranty: String(value.warranty ?? ""),
    returnNote: String(value.returnNote ?? ""),
    halalBadge: Boolean(value.halalBadge)
  };
}

export function normalizeCustomFieldValues(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, typeof item === "boolean" ? item : String(item ?? "")])
  );
}
