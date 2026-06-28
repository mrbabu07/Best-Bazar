export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import { revalidateCacheTags } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { created, handleApiError, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

function cloneJson(value: Prisma.JsonValue): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

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
        shortVideoUrl: original.shortVideoUrl,
        slug: `${original.slug}-copy-${suffix}`,
        categoryId: original.categoryId,
        subcategoryId: original.subcategoryId,
        price: original.price,
        comparePrice: original.comparePrice,
        stock: original.stock,
        sku: `${original.sku}-COPY-${suffix}`,
        brand: original.brand,
        tags: original.tags,
        fashionFields: cloneJson(original.fashionFields),
        customFieldValues: cloneJson(original.customFieldValues),
        isActive: false,
        isFeatured: false,
        freeDelivery: original.freeDelivery,
        images: {
          create: original.images.map(({ url, alt, sortOrder }) => ({ url, alt, sortOrder }))
        },
        variants: {
          create: original.variants.map(({ colorNameEn, colorNameAr, colorHex, sizeKey, sizeNameEn, sizeNameAr, styleNameEn, styleNameAr, fitNameEn, fitNameAr, imageUrl, sku, stock, sortOrder, isActive }) => ({
            colorNameEn,
            colorNameAr,
            colorHex,
            sizeKey,
            sizeNameEn,
            sizeNameAr,
            styleNameEn,
            styleNameAr,
            fitNameEn,
            fitNameAr,
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

    revalidateCacheTags(["storefront", "products", "admin-notifications"]);

    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
}
