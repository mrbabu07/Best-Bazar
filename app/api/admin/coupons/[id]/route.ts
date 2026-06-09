export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validations/admin";
import { handleApiError, noContent, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const data = couponSchema.parse(await request.json());
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data
    });

    return ok(coupon);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.coupon.delete({ where: { id: params.id } });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
