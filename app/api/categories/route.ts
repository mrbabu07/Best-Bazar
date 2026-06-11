import { cachedJson } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: true, subcategories: true } }
    },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }]
  });

  return cachedJson(categories);
}
