import "server-only"
import { createHash } from "crypto"

import type { RateLimitDecision } from "@/lib/rate-limit-result"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export { getRateLimitHttpError } from "@/lib/rate-limit-result"

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitDecision> {
  try {
    const rateKey = createHash("sha256").update(key).digest("hex")
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
    const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
      limit_rate_key: rateKey,
      limit_request_count: limit,
      limit_window_seconds: windowSeconds,
    })

    if (error) {
      console.error("Rate limit check unavailable", {
        code: error.code,
        message: error.message,
      })
      return "unavailable"
    }

    return data === true ? "allowed" : "limited"
  } catch (error) {
    console.error("Rate limit check unavailable", {
      message: error instanceof Error ? error.message : "Unknown error",
    })
    return "unavailable"
  }
}
