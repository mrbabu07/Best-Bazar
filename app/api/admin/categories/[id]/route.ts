export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/admin";
import { handleApiError, noContent, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const data = categorySchema.parse(await request.json());
    const category = await prisma.category.update({
      where: { id: params.id },
      data
    });

    return ok(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.category.delete({ where: { id: params.id } });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
