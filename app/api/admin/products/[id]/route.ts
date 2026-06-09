export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/admin";
import { handleApiError, noContent, ok, requireAdmin } from "@/lib/api/admin";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
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
    const { images, specifications, ...data } = productSchema.parse(await request.json());
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productSpecification.deleteMany({ where: { productId: params.id } });

      return tx.product.update({
        where: { id: params.id },
        data: {
          ...data,
          images: { create: images },
          specifications: { create: specifications }
        },
        include: {
          category: true,
          images: true,
          specifications: true
        }
      });
    });

    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    await prisma.product.delete({ where: { id: params.id } });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
