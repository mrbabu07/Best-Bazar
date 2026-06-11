import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const STOREFRONT_REVALIDATE_SECONDS = 300;
export const SETTINGS_REVALIDATE_SECONDS = 300;

export type CacheTag = "storefront" | "products" | "categories" | "banners" | "reviews" | "settings";

export function revalidateCacheTags(tags: CacheTag[]) {
  for (const tag of tags) {
    revalidateTag(tag);
  }
}

export function cachedJson(data: unknown, seconds = STOREFRONT_REVALIDATE_SECONDS) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`
    }
  });
}
