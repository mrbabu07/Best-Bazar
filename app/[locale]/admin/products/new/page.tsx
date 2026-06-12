import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminProductCreateForm } from "@/components/admin/AdminProductCreateForm";
import { normalizeCategoryCustomFields, normalizeProductType } from "@/lib/category-fields";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Add Product | Best Mart"
};

export default async function AdminNewProductPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }]
  });
  const categoryRows = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    productType: normalizeProductType(category.productType),
    customFields: normalizeCategoryCustomFields(category.customFields)
  }));
  const productsHref = `/${locale}/admin/products`;

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.products}
        title="Add ecommerce product"
        subtitle="Build one complete product with gallery images, category-wise sizes, color/size stock rows, pricing, and storefront controls."
        backLabel="Back"
        backHref={productsHref}
        action={
          <Link
            href={productsHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-gold-200 bg-white px-5 text-sm font-semibold text-navy shadow-soft transition hover:border-gold-400 hover:bg-gold-50"
          >
            <Package size={17} />
            Products
          </Link>
        }
      />

      {categoryRows.length ? (
        <AdminProductCreateForm locale={locale} categories={categoryRows} productsHref={productsHref} />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-soft">
          <h2 className="text-xl font-bold text-navy">Create a category first</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Products need an active category before they can be added.
          </p>
          <Link
            href={`/${locale}/admin/categories`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-bold text-navy shadow-soft hover:from-gold-400 hover:to-gold-200"
          >
            Manage categories
          </Link>
        </div>
      )}
    </div>
  );
}
