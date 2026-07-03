import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHomepageSectionManager } from "@/components/admin/AdminHomepageSectionManager";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Homepage Management | AyVella" };
export const dynamic = "force-dynamic";

export default async function AdminHomepagePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const sections = await prisma.homepageSection.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return <div><AdminPageHeader eyebrow="Storefront" title="Homepage" subtitle="Control the category and product rows customers see on the homepage." /><AdminHomepageSectionManager sections={sections.map((section) => ({ id: section.id, type: section.type as "CATEGORY_GRID" | "PRODUCT_GRID" | "CATEGORY_PRODUCT_ROWS", titleEn: section.titleEn ?? "", titleAr: section.titleAr ?? "", subtitleEn: section.subtitleEn ?? "", subtitleAr: section.subtitleAr ?? "", config: (section.config ?? {}) as { source?: "FEATURED" | "NEW" | "CATEGORY" | "TAG"; categorySlug?: string; tag?: string; limit?: number; categoryLimit?: number; actionLabelEn?: string; actionLabelAr?: string; actionLink?: string }, sortOrder: section.sortOrder, isActive: section.isActive }))} /></div>;
}
