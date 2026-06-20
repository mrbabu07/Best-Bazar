import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache";
import { safeJsonParse } from "@/lib/safe-json";

export type HomepageSectionType = "CATEGORY_GRID" | "PRODUCT_GRID" | "CATEGORY_PRODUCT_ROWS";

export type HomepageSectionConfig = {
  source?: "FEATURED" | "NEW" | "CATEGORY" | "TAG";
  categorySlug?: string;
  tag?: string;
  limit?: number;
  categoryLimit?: number;
  actionLabelEn?: string;
  actionLabelAr?: string;
  actionLink?: string;
};

export type HomepageSection = {
  id: string;
  type: HomepageSectionType;
  title: { en: string; ar: string };
  subtitle: { en: string; ar: string };
  config: HomepageSectionConfig;
  sortOrder: number;
  isActive: boolean;
};

function asConfig(value: unknown): HomepageSectionConfig {
  const parsed = safeJsonParse<HomepageSectionConfig>(typeof value === "string" ? value : JSON.stringify(value ?? {}), {});
  return {
    source: parsed.source,
    categorySlug: parsed.categorySlug?.trim(),
    tag: parsed.tag?.trim(),
    limit: Math.min(Math.max(Number(parsed.limit) || 4, 1), 12),
    categoryLimit: Math.min(Math.max(Number(parsed.categoryLimit) || 6, 1), 12),
    actionLabelEn: parsed.actionLabelEn?.trim(),
    actionLabelAr: parsed.actionLabelAr?.trim(),
    actionLink: parsed.actionLink?.trim()
  };
}

async function readHomepageSections(): Promise<HomepageSection[]> {
  try {
    const sections = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    return sections.flatMap((section) => {
      if (
        section.type !== "CATEGORY_GRID" &&
        section.type !== "PRODUCT_GRID" &&
        section.type !== "CATEGORY_PRODUCT_ROWS"
      ) {
        return [];
      }

      return [{
        id: section.id,
        type: section.type,
        title: { en: section.titleEn ?? "", ar: section.titleAr ?? section.titleEn ?? "" },
        subtitle: { en: section.subtitleEn ?? "", ar: section.subtitleAr ?? section.subtitleEn ?? "" },
        config: asConfig(section.config),
        sortOrder: section.sortOrder,
        isActive: section.isActive
      }];
    });
  } catch (error) {
    // The fallback homepage stays available before the migration is deployed.
    console.error("Homepage sections unavailable. Using the storefront fallback.", error);
    return [];
  }
}

export const getHomepageSections = unstable_cache(readHomepageSections, ["homepage-sections"], {
  revalidate: STOREFRONT_REVALIDATE_SECONDS,
  tags: ["storefront", "homepage-sections"]
});
