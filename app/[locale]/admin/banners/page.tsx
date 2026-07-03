import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminBannerManager } from "@/components/admin/AdminBannerManager";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Banner Management | AyVella"
};

export default async function AdminBannersPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;

  if (!isLocale(locale)) {
    notFound();
  }

  const banners = await prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
  const bannerRows = banners.map((banner) => ({
    id: banner.id,
    titleEn: banner.titleEn,
    titleAr: banner.titleAr,
    subtitleEn: banner.subtitleEn ?? "",
    subtitleAr: banner.subtitleAr ?? "",
    buttonTextEn: banner.buttonTextEn ?? "",
    buttonTextAr: banner.buttonTextAr ?? "",
    buttonLink: banner.buttonLink,
    desktopImage: banner.desktopImage,
    mobileImage: banner.mobileImage ?? "",
    sortOrder: banner.sortOrder,
    isActive: banner.isActive
  }));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Banners"
        title="Banners"
        subtitle="Manage homepage hero slider images, bilingual text, links, ordering, and visibility."
        action={
          <a
            href="#banner-editor"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-300 px-5 text-sm font-semibold text-navy shadow-soft transition hover:from-gold-400 hover:to-gold-200"
          >
            <Plus size={17} />
            Add banner
          </a>
        }
      />

      <AdminBannerManager locale={locale} banners={bannerRows} />
    </div>
  );
}
