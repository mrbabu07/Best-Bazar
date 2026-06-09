export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validations/admin";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const data = orderStatusSchema.parse(await request.json());
    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: { items: true }
    });

    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
