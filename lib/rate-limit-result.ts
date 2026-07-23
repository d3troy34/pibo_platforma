export type RateLimitDecision = "allowed" | "limited" | "unavailable"

export interface RateLimitHttpError {
  error: string
  status: 429 | 503
  retryAfter: string
}

export function getRateLimitHttpError(
  decision: RateLimitDecision,
  limitedMessage: string
): RateLimitHttpError | null {
  if (decision === "allowed") return null

  if (decision === "limited") {
    return {
      error: limitedMessage,
      status: 429,
      retryAfter: "60",
    }
  }

  return {
    error: "No pudimos verificar esta solicitud. Intentá de nuevo en unos minutos.",
    status: 503,
    retryAfter: "30",
  }
}
