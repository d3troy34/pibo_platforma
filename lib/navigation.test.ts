import { describe, expect, it } from "vitest"

import { classifyRouteAccess, getSafeInternalPath } from "./navigation"

describe("getSafeInternalPath", () => {
  it.each([
    ["/curso", "/curso"],
    ["/curso?id=1", "/curso?id=1"],
    ["/curso?id=1#contenido", "/curso?id=1#contenido"],
  ])("keeps the internal path %s", (value, expected) => {
    expect(getSafeInternalPath(value, "/curso")).toBe(expected)
  })

  it.each([
    null,
    undefined,
    "",
    "   ",
    "https://otro.example/curso",
    "//otro.example/curso",
    "//usuario:clave@otro.example/curso",
    "javascript:alert(1)",
    "/\\otro.example/curso",
  ])("falls back for the unsafe value %s", (value) => {
    expect(getSafeInternalPath(value, "/curso")).toBe("/curso")
  })
})

describe("classifyRouteAccess", () => {
  it("requires a session for the password update page", () => {
    expect(classifyRouteAccess("/update-password")).toEqual({
      isProtectedRoute: true,
      isAdminRoute: false,
      isAuthRoute: false,
    })
  })

  it.each(["/login", "/register", "/reset-password"])(
    "keeps %s restricted to signed-out users",
    (path) => {
      expect(classifyRouteAccess(path).isAuthRoute).toBe(true)
    }
  )
})
