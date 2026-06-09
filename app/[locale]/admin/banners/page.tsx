import Image from "next/image";
import type { Metadata } from "next";
import { GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { settings } from "@/lib/data";
import { isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Banner Management | Best Bazar"
};

export default function AdminBannersPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const title = locale === "ar" ? "البانرات" : "Banners";

  return (
    <div>
      <AdminPageHeader
        eyebrow={title}
        title={title}
        subtitle="Manage homepage hero slider images, bilingual text, links, ordering, and visibility."
        action={
          <Button>
            <Plus size={17} />
            Add banner
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="grid gap-3">
          {settings.banners.map((banner, index) => (
            <article
              key={banner.link}
              className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-soft sm:grid-cols-[auto_160px_1fr_auto]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-md bg-paper text-neutral-400">
                <GripVertical size={18} />
              </div>
              <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-neutral-100">
                <Image
                  src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=700&q=80"
                  alt={banner.title.en}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-bold text-navy">{locale === "ar" ? banner.title.ar : banner.title.en}</h2>
                <p className="mt-1 text-sm text-neutral-500">{banner.link}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={banner.isActive ? "green" : "red"}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge tone="gold">#{index + 1}</Badge>
                </div>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-md border border-red-100 text-sale hover:bg-red-50"
                aria-label="Delete banner"
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </section>

        <aside className="rounded-lg border border-neutral-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-navy">Banner editor</h2>
          <div className="mt-5 grid gap-4">
            {[
              "Title EN",
              "Title AR",
              "Subtitle EN",
              "Subtitle AR",
              "Button text EN",
              "Button text AR",
              "Button link URL",
              "Sort order"
            ].map((label) => (
              <label key={label} className="grid gap-2 text-sm font-semibold text-navy">
                {label}
                <input className="h-11 rounded-md border border-neutral-200 bg-paper px-3 text-sm" />
              </label>
            ))}
            <button
              type="button"
              className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 text-sm font-bold text-navy"
            >
              <ImagePlus size={18} />
              Desktop image
            </button>
            <button
              type="button"
              className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 text-sm font-bold text-navy"
            >
              <ImagePlus size={18} />
              Mobile image
            </button>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" className="accent-gold-500" defaultChecked />
              Active
            </label>
            <Button>Save changes</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
