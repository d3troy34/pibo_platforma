import "server-only"
import { createHash } from "crypto"

import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const rateKey = createHash("sha256").update(key).digest("hex")
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
    limit_rate_key: rateKey,
    limit_request_count: limit,
    limit_window_seconds: windowSeconds,
  })

  if (error) {
    console.error("Rate limit check failed")
    return false
  }

  return data === true
}
