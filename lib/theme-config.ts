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
  maintenanceMessageAr: "The store is temporarily unavailable while we improve the shopping experience. Please check back soon."
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function color(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export function normalizeThemeSettings(value: unknown): ThemeSettings {
  const input = isRecord(value) ? value : {};

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
        : defaultThemeSettings.maintenanceMessageAr
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
