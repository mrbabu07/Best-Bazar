import { cachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.setting.findUnique({
    where: { id: "store-settings" }
  });

  return cachedJson(settings, 60);
}
