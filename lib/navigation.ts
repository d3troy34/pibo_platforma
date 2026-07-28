const INTERNAL_ORIGIN = "https://internal.invalid"

const protectedRoutes = [
  "/curso",
  "/progreso",
  "/perfil",
  "/mensajes",
  "/anuncios",
  "/catalogo",
  "/onboarding",
  "/update-password",
]
const adminRoutes = ["/admin"]
const authRoutes = ["/login", "/register", "/reset-password"]

/**
 * Every path prefix that is not part of the public, indexable surface.
 * app/robots.ts derives its disallow list from this so a new private route can
 * never be added to the app while staying crawlable by accident.
 */
export const NON_PUBLIC_ROUTE_PREFIXES = [
  ...protectedRoutes,
  ...adminRoutes,
  ...authRoutes,
  "/invite",
  "/auth",
  "/api",
]

export function getSafeInternalPath(
  value: string | null | undefined,
  fallback: string
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN)

    if (url.origin !== INTERNAL_ORIGIN) {
      return fallback
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export function classifyRouteAccess(path: string) {
  return {
    isProtectedRoute: protectedRoutes.some((route) => path.startsWith(route)),
    isAdminRoute: adminRoutes.some((route) => path.startsWith(route)),
    isAuthRoute: authRoutes.some((route) => path.startsWith(route)),
  }
}
