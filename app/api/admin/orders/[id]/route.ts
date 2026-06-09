export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
