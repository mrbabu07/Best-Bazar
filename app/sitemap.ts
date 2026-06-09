import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getSitemapProducts } from "@/lib/storefront";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://best-bazar.vercel.app";
  const publicRoutes = ["", "/shop", "/cart", "/checkout", "/account"];
  const products = await getSitemapProducts().catch((error) => {
    console.error("Unable to load product URLs for sitemap.", error);
    return [];
  });

  const routeEntries = locales.flatMap((locale) =>
    publicRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8
    }))
  );

  const productEntries = locales.flatMap((locale) =>
    products.map((product) => ({
      url: `${baseUrl}/${locale}/product/${product.slug}`,
      lastModified: product.updatedAt ?? product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  );

  return [...routeEntries, ...productEntries];
}
