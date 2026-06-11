import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { SETTINGS_REVALIDATE_SECONDS } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const publicSettingsSelect = {
  storeNameEn: true,
  storeNameAr: true,
  logo: true,
  storeEmail: true,
  phone: true,
  whatsapp: true,
  trn: true,
  vatRate: true,
  address: true,
  instagram: true,
  facebook: true,
  twitter: true,
  tiktok: true,
  announcementEn: true,
  announcementAr: true,
  announcementActive: true,
  aedToBdt: true,
  aedToUsd: true,
  freeShippingThreshold: true,
  shippingRates: true,
  themeSettings: true,
  metaTitleEn: true,
  metaTitleAr: true,
  metaDescriptionEn: true,
  metaDescriptionAr: true,
  ogImage: true,
  googleAnalyticsId: true,
  facebookPixelId: true
} satisfies Prisma.SettingSelect;

export type PublicSettings = Prisma.SettingGetPayload<{ select: typeof publicSettingsSelect }>;

async function readPublicSettings() {
  return prisma.setting.findUnique({
    where: { id: "store-settings" },
    select: publicSettingsSelect
  });
}

export const getCachedPublicSettings = unstable_cache(readPublicSettings, ["public-store-settings"], {
  revalidate: SETTINGS_REVALIDATE_SECONDS,
  tags: ["settings"]
});
