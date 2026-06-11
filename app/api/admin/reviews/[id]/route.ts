export const dynamic = "force-dynamic";

import { z } from "zod";
import { revalidateCacheTags } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { handleApiError, noContent, ok, requireAdmin } from "@/lib/api/admin";
import { recalculateApprovedReviewSummary } from "@/lib/reviews";

type RouteContext = {
  params: { id: string };
};

const reviewStatusSchema = z.object({
  isApproved: z.boolean()
});

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const data = reviewStatusSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const review = await tx.review.update({
        where: { id: params.id },
        data,
        include: {
          product: { select: { id: true, slug: true, nameEn: true, nameAr: true, sku: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      });
      const summary = await recalculateApprovedReviewSummary(tx, review.productId);

      return { review, summary };
    });

    revalidateCacheTags(["storefront", "reviews", "products"]);

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      const review = await tx.review.delete({
        where: { id: params.id },
        select: { productId: true }
      });
      await recalculateApprovedReviewSummary(tx, review.productId);
    });

    revalidateCacheTags(["storefront", "reviews", "products"]);

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
