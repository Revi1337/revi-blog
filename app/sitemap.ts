import type { MetadataRoute } from "next"

import { articles } from "@/lib/data/articles"
import { SITE_URL } from "@/lib/site-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/bookmark`, lastModified: new Date() },
  ]

  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter((article) => article.showOnHomepage)
    .map((article) => ({
      url: `${SITE_URL}/article/${article.slug}`,
      lastModified: new Date(article.updatedAt ?? article.date),
    }))

  return [...staticRoutes, ...articleRoutes]
}
