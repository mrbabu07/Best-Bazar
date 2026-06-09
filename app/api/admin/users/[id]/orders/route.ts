export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const orders = await prisma.order.findMany({
      where: { userId: params.id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    return ok(orders);
  } catch (error) {
    return handleApiError(error);
  }
}
