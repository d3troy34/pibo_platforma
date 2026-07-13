import { describe, expect, it } from "vitest"

import { getModuleProgressPercent } from "./progress"

describe("getModuleProgressPercent", () => {
  it("returns zero before playback starts", () => {
    expect(getModuleProgressPercent(0, 100, false)).toBe(0)
  })

  it("rounds partial progress", () => {
    expect(getModuleProgressPercent(30, 80, false)).toBe(38)
  })

  it("returns ninety percent", () => {
    expect(getModuleProgressPercent(90, 100, false)).toBe(90)
  })

  it("clamps progress beyond the duration", () => {
    expect(getModuleProgressPercent(120, 100, false)).toBe(100)
  })

  it("returns one hundred for completed modules", () => {
    expect(getModuleProgressPercent(0, 0, true)).toBe(100)
  })

  it.each([0, -1, Number.POSITIVE_INFINITY, Number.NaN])(
    "returns zero for the invalid duration %s",
    (durationSeconds) => {
      expect(getModuleProgressPercent(50, durationSeconds, false)).toBe(0)
    }
  )

  it.each([-1, Number.POSITIVE_INFINITY, Number.NaN])(
    "returns zero for the invalid progress %s",
    (progressSeconds) => {
      expect(getModuleProgressPercent(progressSeconds, 100, false)).toBe(0)
    }
  )
})
