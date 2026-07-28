import type { MetadataRoute } from "next"

import { NON_PUBLIC_ROUTE_PREFIXES } from "@/lib/navigation"
import { SITE_URL } from "@/lib/site"

/**
 * The LMS is an authenticated application: the only crawlable surface is the
 * public landing at "/". The disallow list is derived from the same route
 * prefixes the middleware uses to gate access, so adding a private route
 * automatically keeps it out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [...NON_PUBLIC_ROUTE_PREFIXES].sort()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
