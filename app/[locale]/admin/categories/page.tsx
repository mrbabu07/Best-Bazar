import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminCategoryManager } from "@/components/admin/AdminCategoryManager";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { normalizeCategoryCustomFields, normalizeProductType } from "@/lib/category-fields";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Category Management | AyVella"
};

export default async function AdminCategoriesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const categories = await prisma.category.findMany({
    include: {
      parentCategory: true,
      _count: { select: { products: true, subcategories: true } }
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
  const categoryRows = categories.map((category) => ({
    id: category.id,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    slug: category.slug,
    image: category.image ?? "",
    productType: normalizeProductType(category.productType),
    customFields: normalizeCategoryCustomFields(category.customFields),
    parentCategoryId: category.parentCategoryId ?? "",
    parentCategoryNameEn: category.parentCategory?.nameEn ?? "",
    productCount: category._count.products,
    subcategoryCount: category._count.subcategories,
    sortOrder: category.sortOrder,
    isActive: category.isActive
  }));

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.categories}
        title={dictionary.admin.categories}
        subtitle="Create nested categories, upload imagery, toggle visibility, and define storefront order."
        action={
          <a
            href="#category-editor"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-semibold text-navy shadow-soft transition hover:from-gold-400 hover:to-gold-200"
          >
            <Plus size={17} />
            Add category
          </a>
        }
      />

      <AdminCategoryManager locale={locale} categories={categoryRows} saveLabel={dictionary.actions.save} />
    </div>
  );
}
