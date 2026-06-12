import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://best-mart.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/en/admin/", "/ar/admin/"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
