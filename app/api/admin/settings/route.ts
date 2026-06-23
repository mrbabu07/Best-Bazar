export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidateCacheTags } from "@/lib/cache";
import { settingsSchema } from "@/lib/validations/admin";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await prisma.setting.findUnique({
      where: { id: "store-settings" }
    });

    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const data = settingsSchema.parse(await request.json());
    const settingsData = {
      ...data,
      shippingRates: data.shippingRates as Prisma.InputJsonValue
    };
    const settings = await prisma.setting.upsert({
      where: { id: "store-settings" },
      update: settingsData,
      create: { id: "store-settings", ...settingsData }
    });

    revalidateCacheTags(["settings"]);

    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
