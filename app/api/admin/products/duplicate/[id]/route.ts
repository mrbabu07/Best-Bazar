export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { created, handleApiError, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const original = await prisma.product.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        images: true,
        specifications: true
      }
    });
    const suffix = Date.now();

    const product = await prisma.product.create({
      data: {
        nameEn: `${original.nameEn} Copy`,
        nameAr: `${original.nameAr} Copy`,
        descriptionEn: original.descriptionEn,
        descriptionAr: original.descriptionAr,
        slug: `${original.slug}-copy-${suffix}`,
        categoryId: original.categoryId,
        subcategoryId: original.subcategoryId,
        price: original.price,
        comparePrice: original.comparePrice,
        stock: original.stock,
        sku: `${original.sku}-COPY-${suffix}`,
        brand: original.brand,
        tags: original.tags,
        isActive: false,
        isFeatured: false,
        images: {
          create: original.images.map(({ url, alt, sortOrder }) => ({ url, alt, sortOrder }))
        },
        specifications: {
          create: original.specifications.map(({ keyEn, keyAr, valueEn, valueAr, sortOrder }) => ({
            keyEn,
            keyAr,
            valueEn,
            valueAr,
            sortOrder
          }))
        }
      },
      include: {
        images: true,
        specifications: true
      }
    });

    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
}
