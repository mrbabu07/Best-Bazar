export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { revalidateCacheTags } from "@/lib/cache";
import { categorySchema } from "@/lib/validations/admin";
import { created, getSearchParam, handleApiError, ok, requireAdmin } from "@/lib/api/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const search = getSearchParam(request, "search");

    const categories = await prisma.category.findMany({
      where: search
        ? {
            OR: [
              { nameEn: { contains: search, mode: "insensitive" } },
              { nameAr: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } }
            ]
          }
        : undefined,
      include: {
        parentCategory: true,
        _count: { select: { products: true, subcategories: true } }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    return ok(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = categorySchema.parse(await request.json());
    const category = await prisma.category.create({ data });

    revalidateCacheTags(["storefront", "categories", "products"]);

    return created(category);
  } catch (error) {
    return handleApiError(error);
  }
}
