/**
 * Public identity of the LMS host.
 *
 * The apex domain 301s to www (mipibo.com -> www.mipibo.com/login), so www is
 * the only host that answers 200 and therefore the only valid canonical.
 */
export const SITE_URL = "https://www.mipibo.com"

/** Marketing site. Owns all commercial and informational search intent. */
export const MARKETING_URL = "https://www.estudiaargentina.com"

export const SITE_NAME = "Pibo"
export const CONTACT_EMAIL = "piboesp@mipibo.com"
export const INSTAGRAM_URL = "https://www.instagram.com/piibo.esp/"

/**
 * JSON-LD for the public landing. The Course entity is canonicalised to the
 * marketing site via `url` so the two domains describe one product rather than
 * competing for the same queries.
 */
export const landingJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/pibo-wordmark.png`,
      },
      email: CONTACT_EMAIL,
      sameAs: [INSTAGRAM_URL, `${MARKETING_URL}/`],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: `${SITE_NAME} — Plataforma de estudiantes`,
      inLanguage: "es",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Course",
      "@id": `${MARKETING_URL}/#course`,
      name: "Master Class Pibo — Estudiar en Argentina",
      description:
        "Masterclass en video de 9 módulos sobre el proceso completo para estudiar en Argentina siendo extranjero. Se cursa en la plataforma de Pibo e incluye guías en PDF, comunidad privada y soporte personalizado.",
      url: `${MARKETING_URL}/#curso`,
      inLanguage: "es",
      provider: { "@id": `${SITE_URL}/#organization` },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT9H",
      },
    },
  ],
} as const
