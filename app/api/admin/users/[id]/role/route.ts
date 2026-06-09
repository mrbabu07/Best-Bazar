export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { userRoleSchema } from "@/lib/validations/admin";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const data = userRoleSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, isBanned: true }
    });

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}
