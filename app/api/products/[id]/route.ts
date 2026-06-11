import { NextResponse } from "next/server";
import { cachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ id: params.id }, { slug: params.id }]
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return cachedJson(product);
}
