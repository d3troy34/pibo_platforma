const INTERNAL_ORIGIN = "https://internal.invalid"

const protectedRoutes = [
  "/curso",
  "/progreso",
  "/perfil",
  "/mensajes",
  "/anuncios",
  "/catalogo",
  "/update-password",
]
const adminRoutes = ["/admin"]
const authRoutes = ["/login", "/register", "/reset-password"]

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
