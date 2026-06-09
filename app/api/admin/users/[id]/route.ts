export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { handleApiError, noContent, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.user.delete({ where: { id: params.id } });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
