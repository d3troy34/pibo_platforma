import { describe, expect, it } from "vitest"

import { getRateLimitHttpError } from "./rate-limit-result"

describe("getRateLimitHttpError", () => {
  it("allows the request when the limiter approves it", () => {
    expect(getRateLimitHttpError("allowed", "Esperá un minuto.")).toBeNull()
  })

  it("returns 429 only for a real limit", () => {
    expect(getRateLimitHttpError("limited", "Esperá un minuto.")).toEqual({
      error: "Esperá un minuto.",
      status: 429,
      retryAfter: "60",
    })
  })

  it("does not disguise an infrastructure failure as user abuse", () => {
    expect(getRateLimitHttpError("unavailable", "Esperá un minuto.")).toEqual({
      error: "No pudimos verificar esta solicitud. Intentá de nuevo en unos minutos.",
      status: 503,
      retryAfter: "30",
    })
  })
})
