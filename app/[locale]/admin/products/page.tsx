import Image from "next/image";
import type { Metadata } from "next";
import { Eye, Plus, Upload } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/utils/currency";

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
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }]
    }),
    prisma.product.findMany({
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow={dictionary.admin.products}
        title={dictionary.admin.products}
        subtitle="Add, edit, preview, price, feature, and manage product inventory."
        action={
          <Button>
            <Plus size={17} />
            Add product
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-paper text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 rtl:text-right">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 overflow-hidden rounded-md bg-neutral-100">
                          <Image
                            src={product.images[0]?.url ?? "https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=400&q=80"}
                            alt={product.images[0]?.alt ?? product.nameEn}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-navy">{locale === "ar" ? product.nameAr : product.nameEn}</p>
                          <p className="text-xs text-neutral-500">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {locale === "ar" ? product.category.nameAr : product.category.nameEn}
                    </td>
                    <td className="px-5 py-4 font-bold text-navy">
                      {formatCurrency(Number(product.price), "AED", locale)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={product.stock <= 10 ? "red" : "green"}>{product.stock}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={product.isActive ? "green" : "red"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {product.isFeatured ? <Badge tone="gold">Featured</Badge> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-gold-200 px-3 text-xs font-bold text-navy hover:bg-gold-50"
                      >
                        <Eye size={15} />
                        {dictionary.actions.preview}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Product editor</h2>
          <div className="mt-5 grid gap-4">
            {["Name EN", "Name AR", "SKU", "Brand", "Price AED", "Compare price", "Stock"].map((label) => (
              <label key={label} className="grid gap-2 text-sm font-semibold text-navy">
                {label}
                <input className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
              </label>
            ))}
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Category
              <select className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm">
                {categories.map((category) => (
                  <option key={category.id}>{locale === "ar" ? category.nameAr : category.nameEn}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Description
              <textarea rows={4} className="rounded-md border border-neutral-200 bg-paper px-3 py-3 text-sm" />
            </label>
            <button
              type="button"
              className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 text-sm font-bold text-navy"
            >
              <Upload size={18} />
              Cloudinary images
            </button>
            <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-navy">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-gold-500" defaultChecked />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-gold-500" />
                Featured
              </label>
            </div>
            <Button>{dictionary.actions.save}</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
