export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validations/admin";
import { created, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

    return ok(coupons);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = couponSchema.parse(await request.json());
    const coupon = await prisma.coupon.create({ data });

    return created(coupon);
  } catch (error) {
    return handleApiError(error);
  }
}
