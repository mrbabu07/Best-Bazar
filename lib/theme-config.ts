import type { CSSProperties } from "react";

export type ThemeSettings = {
  primaryColor: string;
  accentColor: string;
  paperColor: string;
  inkColor: string;
  radius: "compact" | "soft" | "rounded";
  buttonStyle: "gradient" | "solid";
  productCardStyle: "standard" | "compact" | "elevated";
  maintenanceMode: boolean;
  maintenanceTitleEn: string;
  maintenanceTitleAr: string;
  maintenanceMessageEn: string;
  maintenanceMessageAr: string;
  storefrontContent: StorefrontContent;
};

export type StorefrontContent = {
  navHomeEn: string; navHomeAr: string; navShopEn: string; navShopAr: string; navAccountEn: string; navAccountAr: string;
  footerTaglineEn: string; footerTaglineAr: string;
  privacyTitleEn: string; privacyTitleAr: string; privacyBodyEn: string; privacyBodyAr: string;
  termsTitleEn: string; termsTitleAr: string; termsBodyEn: string; termsBodyAr: string;
};

export const defaultStorefrontContent: StorefrontContent = {
  navHomeEn: "Home", navHomeAr: "الرئيسية", navShopEn: "Shop", navShopAr: "المتجر", navAccountEn: "Account", navAccountAr: "الحساب",
  footerTaglineEn: "Dubai shopping, curated for everyday life.", footerTaglineAr: "تسوق دبي مختار للحياة اليومية.",
  privacyTitleEn: "Privacy policy", privacyTitleAr: "سياسة الخصوصية", privacyBodyEn: "We collect and use customer details only to process orders, delivery, payments, support, and legal requirements.", privacyBodyAr: "نجمع ونستخدم بيانات العملاء فقط لمعالجة الطلبات والتوصيل والدفع والدعم والمتطلبات القانونية.",
  termsTitleEn: "Terms and conditions", termsTitleAr: "الشروط والأحكام", termsBodyEn: "Orders are accepted after stock, delivery address, and payment details are validated. Delivery and return terms are managed by the store.", termsBodyAr: "يتم قبول الطلبات بعد التحقق من المخزون وعنوان التوصيل وبيانات الدفع. تتم إدارة شروط التوصيل والإرجاع بواسطة المتجر."
};

export const defaultThemeSettings: ThemeSettings = {
  primaryColor: "#c8a96e",
  accentColor: "#ddbd67",
  paperColor: "#f8f7f4",
  inkColor: "#2d2d2d",
  radius: "soft",
  buttonStyle: "gradient",
  productCardStyle: "standard",
  maintenanceMode: false,
  maintenanceTitleEn: "We are updating Best Mart",
  maintenanceTitleAr: "We are updating Best Mart",
  maintenanceMessageEn: "The store is temporarily unavailable while we improve the shopping experience. Please check back soon.",
  maintenanceMessageAr: "The store is temporarily unavailable while we improve the shopping experience. Please check back soon.",
  storefrontContent: defaultStorefrontContent
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function color(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export function normalizeThemeSettings(value: unknown): ThemeSettings {
  const input = isRecord(value) ? value : {};
  const content = isRecord(input.storefrontContent) ? input.storefrontContent : {};
  const contentValue = (key: keyof StorefrontContent) =>
    typeof content[key] === "string" && content[key].trim() ? (content[key] as string) : defaultStorefrontContent[key];

  return {
    primaryColor: color(input.primaryColor, defaultThemeSettings.primaryColor),
    accentColor: color(input.accentColor, defaultThemeSettings.accentColor),
    paperColor: color(input.paperColor, defaultThemeSettings.paperColor),
    inkColor: color(input.inkColor, defaultThemeSettings.inkColor),
    radius:
      input.radius === "compact" || input.radius === "rounded" || input.radius === "soft"
        ? input.radius
        : defaultThemeSettings.radius,
    buttonStyle: input.buttonStyle === "solid" ? "solid" : "gradient",
    productCardStyle:
      input.productCardStyle === "compact" || input.productCardStyle === "elevated"
        ? input.productCardStyle
        : "standard",
    maintenanceMode: input.maintenanceMode === true,
    maintenanceTitleEn:
      typeof input.maintenanceTitleEn === "string" && input.maintenanceTitleEn.trim()
        ? input.maintenanceTitleEn
        : defaultThemeSettings.maintenanceTitleEn,
    maintenanceTitleAr:
      typeof input.maintenanceTitleAr === "string" && input.maintenanceTitleAr.trim()
        ? input.maintenanceTitleAr
        : defaultThemeSettings.maintenanceTitleAr,
    maintenanceMessageEn:
      typeof input.maintenanceMessageEn === "string" && input.maintenanceMessageEn.trim()
        ? input.maintenanceMessageEn
        : defaultThemeSettings.maintenanceMessageEn,
    maintenanceMessageAr:
      typeof input.maintenanceMessageAr === "string" && input.maintenanceMessageAr.trim()
        ? input.maintenanceMessageAr
        : defaultThemeSettings.maintenanceMessageAr,
    storefrontContent: Object.fromEntries(
      Object.keys(defaultStorefrontContent).map((key) => [key, contentValue(key as keyof StorefrontContent)])
    ) as StorefrontContent
  };
}

export function storefrontThemeStyle(theme: ThemeSettings) {
  const radius = theme.radius === "compact" ? "4px" : theme.radius === "rounded" ? "14px" : "8px";

  return {
    "--bb-primary": theme.primaryColor,
    "--bb-accent": theme.accentColor,
    "--bb-paper": theme.paperColor,
    "--bb-ink": theme.inkColor,
    "--bb-radius": radius
  } as CSSProperties;
}
