import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(1000)
});

const reviewInclude = {
  user: { select: { name: true, image: true } }
} satisfies Prisma.ReviewInclude;

function serializeReview(review: Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    user: {
      name: review.user.name ?? "Best Bazar customer",
      image: review.user.image ?? undefined
    }
  };
}

async function findActiveProduct(id: string) {
  return prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ id }, { slug: id }]
    },
    select: { id: true, rating: true, reviewCount: true }
  });
}

async function updateProductReviewSummary(tx: Prisma.TransactionClient, productId: string) {
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

export async function GET(_request: Request, { params }: RouteContext) {
  const product = await findActiveProduct(params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, isApproved: true },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return NextResponse.json({
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    reviews: reviews.map(serializeReview)
  });
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
        select: { id: true }
      });
      const review = existingReview
        ? await tx.review.update({
            where: { id: existingReview.id },
            data: {
              rating: data.rating,
              comment: data.comment,
              isApproved: true
            },
            include: reviewInclude
          })
        : await tx.review.create({
            data: {
              productId: product.id,
              userId: session.user.id,
              rating: data.rating,
              comment: data.comment,
              isApproved: true
            },
            include: reviewInclude
          });
      const summary = await updateProductReviewSummary(tx, product.id);

      return { review, summary };
    });

    return NextResponse.json({
      ...result.summary,
      review: serializeReview(result.review)
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
