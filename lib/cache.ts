import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const STOREFRONT_REVALIDATE_SECONDS = 300;
export const SETTINGS_REVALIDATE_SECONDS = 300;

export type CacheTag =
  | "storefront"
  | "products"
  | "categories"
  | "banners"
  | "reviews"
  | "settings"
  | "admin-orders"
  | "admin-notifications";

export function revalidateCacheTags(tags: CacheTag[]) {
  for (const tag of tags) {
    revalidateTag(tag);
  }
}

export function revalidateAdminOrderViews(locale?: string) {
  const locales = locale ? [locale] : ["en", "ar"];

  for (const item of locales) {
    revalidatePath(`/${item}/admin/dashboard`);
    revalidatePath(`/${item}/admin/orders`);
    revalidatePath(`/${item}/admin/orders`, "page");
  }

  revalidateCacheTags(["admin-orders", "admin-notifications"]);
}

export function cachedJson(data: unknown, seconds = STOREFRONT_REVALIDATE_SECONDS) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`
    }
  });
}
