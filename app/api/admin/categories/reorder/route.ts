export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { categoryReorderSchema } from "@/lib/validations/admin";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const { ids } = categoryReorderSchema.parse(await request.json());

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder: index + 1 }
        })
      )
    );

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
