import type { Prisma } from "@prisma/client";
import type { ProductReview } from "@/lib/types";

export const reviewUserInclude = {
  user: { select: { name: true, image: true } }
} satisfies Prisma.ReviewInclude;

export type ReviewWithUser = Prisma.ReviewGetPayload<{ include: typeof reviewUserInclude }>;

export function serializeStoreReview(review: ReviewWithUser): ProductReview {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    user: {
      name: review.user.name ?? "AyVella customer",
      image: review.user.image ?? undefined
    }
  };
}

export async function getProductReviewSummary(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { rating: true, reviewCount: true }
  });

  return {
    rating: Number(product?.rating ?? 0),
    reviewCount: product?.reviewCount ?? 0
  };
}

export async function recalculateApprovedReviewSummary(tx: Prisma.TransactionClient, productId: string) {
  const summary = await tx.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true }
  });
  const rating = Number((summary._avg.rating ?? 0).toFixed(2));
  const reviewCount = summary._count._all;

  await tx.product.update({
    where: { id: productId },
    data: { rating, reviewCount }
  });

  return { rating, reviewCount };
}
