import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

/**
 * Only the public landing belongs in the index. Every other route requires a
 * session, so listing it here would just feed Google URLs that redirect to
 * /login. Commercial and informational URLs live on estudiaargentina.com and
 * are published from that site's own sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date("2026-07-28"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
