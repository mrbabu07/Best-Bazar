export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { revalidateCacheTags } from "@/lib/cache";
import { bannerSchema } from "@/lib/validations/admin";
import { handleApiError, noContent, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const data = bannerSchema.parse(await request.json());
    const banner = await prisma.banner.update({
      where: { id: params.id },
      data
    });

    revalidateCacheTags(["storefront", "banners"]);

    return ok(banner);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.banner.delete({ where: { id: params.id } });

    revalidateCacheTags(["storefront", "banners"]);

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
