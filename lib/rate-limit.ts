/**
 * Simple in-memory rate limiting for API routes.
 * Note: This is reset on server restart and not shared across instances.
 * For production at scale, consider using Redis or Vercel KV.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  })
}, CLEANUP_INTERVAL)

/**
 * Check if a request is within rate limits.
 * @param key - Unique identifier for the rate limit (e.g., IP address or user ID)
 * @param limit - Maximum number of requests allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // If no record or window expired, create new record
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  // If within limit, increment and allow
  if (record.count < limit) {
    record.count++
    return true
  }

  // Rate limited
  return false
}

/**
 * Get rate limit info for a key.
 * @param key - Unique identifier for the rate limit
 * @returns Object with remaining requests and reset time, or null if no record
 */
export function getRateLimitInfo(key: string): { remaining: number; resetTime: number } | null {
  const record = rateLimitMap.get(key)
  if (!record) return null

  const now = Date.now()
  if (now > record.resetTime) return null

  return {
    remaining: Math.max(0, record.count),
    resetTime: record.resetTime,
  }
}
