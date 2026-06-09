import Image from "next/image";
import type { Metadata } from "next";
import { GripVertical, Plus, Upload } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Category Management | Best Bazar"
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

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.categories}
        title={dictionary.admin.categories}
        subtitle="Create nested categories, upload imagery, toggle visibility, and define storefront order."
        action={
          <Button>
            <Plus size={17} />
            Add category
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft sm:grid-cols-[auto_96px_1fr_auto]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-md bg-paper text-neutral-400">
                <GripVertical size={18} />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-md bg-neutral-100">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={locale === "ar" ? category.nameAr : category.nameEn}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div>
                <h2 className="font-bold text-navy">{locale === "ar" ? category.nameAr : category.nameEn}</h2>
                <p className="mt-1 text-sm text-neutral-500">{category.slug}</p>
                <p className="mt-2 text-sm text-neutral-600">
                  {category._count.products} products
                  {category.parentCategory ? ` | parent: ${category.parentCategory.nameEn}` : ""}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge tone={category.isActive ? "green" : "red"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge tone="gold">#{category.sortOrder}</Badge>
              </div>
            </article>
          ))}
        </section>

        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Category editor</h2>
          <div className="mt-5 grid gap-4">
            {["Name EN", "Name AR", "Slug", "Sort order"].map((label) => (
              <label key={label} className="grid gap-2 text-sm font-semibold text-navy">
                {label}
                <input className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Parent category
              <select className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm">
                <option>None</option>
                {categories.map((category) => (
                  <option key={category.id}>{locale === "ar" ? category.nameAr : category.nameEn}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 text-sm font-bold text-navy"
            >
              <Upload size={18} />
              Upload image
            </button>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" className="accent-gold-500" defaultChecked />
              Active
            </label>
            <Button>{dictionary.actions.save}</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
