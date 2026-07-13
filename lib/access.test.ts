import { describe, expect, it } from "vitest"

import { canAccessModule } from "./access"

describe("canAccessModule", () => {
  it("allows an admin to access any module", () => {
    expect(canAccessModule(false, true, 10)).toBe(true)
  })

  it("allows an unpaid student to access the free module", () => {
    expect(canAccessModule(false, false, 0)).toBe(true)
  })

  it("blocks an unpaid student from a paid module", () => {
    expect(canAccessModule(false, false, 1)).toBe(false)
  })

  it("allows a paid student to access a paid module", () => {
    expect(canAccessModule(true, false, 1)).toBe(true)
  })
})
