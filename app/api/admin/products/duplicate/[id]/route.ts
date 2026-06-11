export const dynamic = "force-dynamic";

import { revalidateCacheTags } from "@/lib/cache";
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
        variants: true,
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
        metaTitleEn: original.metaTitleEn,
        metaTitleAr: original.metaTitleAr,
        metaDescriptionEn: original.metaDescriptionEn,
        metaDescriptionAr: original.metaDescriptionAr,
        ogImage: original.ogImage,
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
        variants: {
          create: original.variants.map(({ colorNameEn, colorNameAr, colorHex, sizeKey, sizeNameEn, sizeNameAr, imageUrl, sku, stock, sortOrder, isActive }) => ({
            colorNameEn,
            colorNameAr,
            colorHex,
            sizeKey,
            sizeNameEn,
            sizeNameAr,
            imageUrl,
            sku: sku ? `${sku}-COPY-${suffix}` : null,
            stock,
            sortOrder,
            isActive
          }))
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
        variants: true,
        specifications: true
      }
    });

    revalidateCacheTags(["storefront", "products"]);

    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
}
