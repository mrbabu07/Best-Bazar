export const dynamic = "force-dynamic";

import { revalidateCacheTags } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/admin";
import { handleApiError, noContent, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

function stockFromVariants(stock: number, variants: Array<{ stock: number; isActive: boolean }>) {
  const activeVariantStock = variants
    .filter((variant) => variant.isActive)
    .reduce((total, variant) => total + variant.stock, 0);

  return variants.length ? activeVariantStock : stock;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
        specifications: { orderBy: { sortOrder: "asc" } }
      }
    });

    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { images, variants, specifications, stock, ...data } = productSchema.parse(await request.json());
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productVariant.deleteMany({ where: { productId: params.id } });
      await tx.productSpecification.deleteMany({ where: { productId: params.id } });

      return tx.product.update({
        where: { id: params.id },
        data: {
          ...data,
          stock: stockFromVariants(stock, variants),
          images: { create: images },
          variants: { create: variants },
          specifications: { create: specifications }
        },
        include: {
          category: true,
          images: true,
          variants: true,
          specifications: true
        }
      });
    });

    revalidateCacheTags(["storefront", "products", "admin-notifications"]);

    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.product.delete({ where: { id: params.id } });

    revalidateCacheTags(["storefront", "products", "admin-notifications"]);

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
