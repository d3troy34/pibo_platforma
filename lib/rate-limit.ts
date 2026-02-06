// TODO: Implement proper rate limiting with Upstash Redis
// In-memory rate limiting does not work on Vercel serverless
// as each invocation gets fresh memory.
// For now, rely on Supabase RLS and middleware for protection.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  return true
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRateLimitInfo(key: string): { remaining: number; resetAt: Date } {
  return { remaining: Infinity, resetAt: new Date() }
}
