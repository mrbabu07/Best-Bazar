export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { revalidateCacheTags } from "@/lib/cache";
import { bannerReorderSchema } from "@/lib/validations/admin";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const { ids } = bannerReorderSchema.parse(await request.json());

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.banner.update({
          where: { id },
          data: { sortOrder: index + 1 }
        })
      )
    );

    revalidateCacheTags(["storefront", "banners"]);

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
