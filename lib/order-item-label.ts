import { cleanLengthSizeLabel } from "@/lib/product-size-label";

export type PrintableOrderItem = {
  nameEn: string;
  nameAr?: string | null;
  variantNameEn?: string | null;
  variantNameAr?: string | null;
  quantity: number;
  product?: { sku?: string | null } | null;
  variant?: {
    colorNameEn: string;
    colorNameAr: string;
    sizeNameEn?: string | null;
    sizeNameAr?: string | null;
  } | null;
};

export function getOrderItemDetails(item: PrintableOrderItem, locale: string) {
  const variantParts = (locale === "ar" ? item.variantNameAr ?? item.variantNameEn : item.variantNameEn)
    ?.split("/")
    .map((part) => part.trim())
    .filter(Boolean) ?? [];
  const color = locale === "ar"
    ? item.variant?.colorNameAr || item.variant?.colorNameEn || variantParts[0]
    : item.variant?.colorNameEn || variantParts[0];
  const rawSize = locale === "ar"
    ? item.variant?.sizeNameAr || item.variant?.sizeNameEn || variantParts[1]
    : item.variant?.sizeNameEn || variantParts[1];

  return {
    name: locale === "ar" ? item.nameAr || item.nameEn : item.nameEn,
    code: item.product?.sku?.trim() ?? "",
    color: color ?? "",
    size: rawSize ? cleanLengthSizeLabel(rawSize) : "",
    quantity: item.quantity
  };
}

export function formatOrderItemDetails(
  item: PrintableOrderItem,
  locale: string,
  options: { includeCode?: boolean } = {}
) {
  const details = getOrderItemDetails(item, locale);
  const includeCode = options.includeCode ?? true;

  return [
    details.name,
    includeCode && details.code ? `Code: ${details.code}` : "",
    details.color ? `Color: ${details.color}` : "",
    details.size ? `Size: ${details.size}` : "",
    `Qty: ${details.quantity}`
  ].filter(Boolean).join(" | ");
}
