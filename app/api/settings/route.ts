import { SETTINGS_REVALIDATE_SECONDS, cachedJson } from "@/lib/cache";
import { getCachedPublicSettings } from "@/lib/settings";

export const revalidate = SETTINGS_REVALIDATE_SECONDS;

export async function GET() {
  const settings = await getCachedPublicSettings();

  return cachedJson(settings, SETTINGS_REVALIDATE_SECONDS);
}
