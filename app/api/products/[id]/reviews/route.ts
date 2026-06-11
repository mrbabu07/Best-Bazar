import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { cachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import {
  getProductReviewSummary,
  recalculateApprovedReviewSummary,
  reviewUserInclude,
  serializeStoreReview
} from "@/lib/reviews";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(1000)
});

async function findActiveProduct(id: string) {
  return prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ id }, { slug: id }]
    },
    select: { id: true, rating: true, reviewCount: true }
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const product = await findActiveProduct(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, isApproved: true },
    include: reviewUserInclude,
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return cachedJson(
    {
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      reviews: reviews.map(serializeStoreReview)
    },
    60
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const data = reviewSchema.parse(await request.json());
    const product = await findActiveProduct(params.id);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingReview = await tx.review.findFirst({
        where: { productId: product.id, userId: session.user.id },
        select: { id: true, isApproved: true }
      });
      const review = existingReview
        ? await tx.review.update({
            where: { id: existingReview.id },
            data: {
              rating: data.rating,
              comment: data.comment,
              isApproved: false
            },
            include: reviewUserInclude
          })
        : await tx.review.create({
            data: {
              productId: product.id,
              userId: session.user.id,
              rating: data.rating,
              comment: data.comment,
              isApproved: false
            },
            include: reviewUserInclude
          });
      const summary = existingReview?.isApproved
        ? await recalculateApprovedReviewSummary(tx, product.id)
        : await getProductReviewSummary(tx, product.id);

      return { review, summary };
    });

    return NextResponse.json({
      ...result.summary,
      pending: true,
      review: serializeStoreReview(result.review)
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid review details." },
        { status: 422 }
      );
    }

    return NextResponse.json({ error: "Unable to save review." }, { status: 500 });
  }
}
