export const dynamic = "force-dynamic";

import { Prisma } from "@prisma/client";
import { revalidateCacheTags } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/admin";
import { created, getPagination, getSearchParam, handleApiError, ok, requireAdmin } from "@/lib/api/admin";
import { sendNewProductOfferEmail } from "@/lib/email";
import { titleCaseWords } from "@/lib/text-format";

function buildProductWhere(request: Request): Prisma.ProductWhereInput {
  const search = getSearchParam(request, "search");
  const categoryId = getSearchParam(request, "categoryId");
  const status = getSearchParam(request, "status");

  return {
    ...(categoryId ? { categoryId } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(search
      ? {
          OR: [
            { nameEn: { contains: search, mode: "insensitive" } },
            { nameAr: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function stockFromVariants(stock: number, variants: Array<{ stock: number; isActive: boolean }>) {
  const activeVariantStock = variants
    .filter((variant) => variant.isActive)
    .reduce((total, variant) => total + variant.stock, 0);

  return variants.length ? activeVariantStock : stock;
}

async function getAvailableProductSlug(requestedSlug: string) {
  const baseSlug = requestedSlug.trim().toLowerCase();
  let candidate = baseSlug;
  let suffix = 2;

  while (await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { page, limit, skip } = getPagination(request);
    const where = buildProductWhere(request);
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: { sortOrder: "asc" } },
          specifications: { orderBy: { sortOrder: "asc" } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { images, variants, specifications, stock, ...data } = productSchema.parse(await request.json());
    const normalizedNameEn = titleCaseWords(data.nameEn);
    const availableSlug = await getAvailableProductSlug(data.slug);
    const product = await prisma.product.create({
      data: {
        ...data,
        slug: availableSlug,
        nameEn: normalizedNameEn,
        nameAr: data.nameAr || normalizedNameEn,
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

    revalidateCacheTags(["storefront", "products", "admin-notifications"]);
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true }
    });
    sendNewProductOfferEmail({
      product,
      recipients: subscribers.map((subscriber) => subscriber.email)
    }).catch((error) => {
      console.error("Newsletter product email failed", error);
    });

    return created(product);
  } catch (error) {
    return handleApiError(error);
  }
}
