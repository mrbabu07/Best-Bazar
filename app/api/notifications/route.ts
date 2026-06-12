import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return NextResponse.json(
    {
      products: products.map((product) => ({
        id: `product:${product.id}:${product.createdAt.getTime()}`,
        name: { en: product.nameEn, ar: product.nameAr },
        href: {
          en: `/en/product/${product.slug || product.id}`,
          ar: `/ar/product/${product.slug || product.id}`
        },
        createdAt: product.createdAt.toISOString()
      }))
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
