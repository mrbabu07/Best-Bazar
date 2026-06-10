import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminProductManager } from "@/components/admin/AdminProductManager";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Product Management | Best Bazar"
};

export default async function AdminProductsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }]
    }),
    prisma.product.findMany({
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
        specifications: { orderBy: { sortOrder: "asc" } }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);
  const categoryRows = categories.map((category) => ({
    id: category.id,
    nameEn: category.nameEn,
    nameAr: category.nameAr
  }));
  const productRows = products.map((product) => ({
    id: product.id,
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    descriptionEn: product.descriptionEn,
    descriptionAr: product.descriptionAr,
    slug: product.slug,
    categoryId: product.categoryId,
    categoryNameEn: product.category.nameEn,
    categoryNameAr: product.category.nameAr,
    subcategoryId: product.subcategoryId ?? "",
    price: Number(product.price),
    comparePrice: product.comparePrice == null ? null : Number(product.comparePrice),
    stock: product.stock,
    sku: product.sku,
    brand: product.brand,
    tags: product.tags,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt ?? "",
      sortOrder: String(image.sortOrder)
    })),
    variants: product.variants.map((variant) => ({
      colorNameEn: variant.colorNameEn,
      colorNameAr: variant.colorNameAr,
      colorHex: variant.colorHex ?? "",
      imageUrl: variant.imageUrl ?? "",
      sku: variant.sku ?? "",
      stock: String(variant.stock),
      sortOrder: String(variant.sortOrder),
      isActive: variant.isActive
    })),
    specifications: product.specifications.map((specification) => ({
      keyEn: specification.keyEn,
      keyAr: specification.keyAr,
      valueEn: specification.valueEn,
      valueAr: specification.valueAr,
      sortOrder: String(specification.sortOrder)
    }))
  }));

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.products}
        title={dictionary.admin.products}
        subtitle="Create ecommerce products with gallery images, color-wise stock, pricing, and storefront publishing."
        action={
          <a
            href={`/${locale}/admin/products/new`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-semibold text-navy shadow-soft transition hover:from-gold-400 hover:to-gold-200"
          >
            <Plus size={17} />
            Add ecommerce product
          </a>
        }
      />

      <AdminProductManager
        locale={locale}
        dictionary={dictionary}
        categories={categoryRows}
        products={productRows}
        saveLabel={dictionary.actions.save}
        createHref={`/${locale}/admin/products/new`}
      />
    </div>
  );
}
