import { createHash, createHmac, timingSafeEqual } from "crypto"

export const COURSE_PRICE_USD = 180

export type PaymentProvider = "stripe" | "dlocal" | "manual"

export interface PurchaseWebhookPayload {
  email: string
  full_name?: string
  event_id?: string
  purchase_id: string
  amount?: number
  amount_usd?: number
  currency?: string
  payment_provider?: string
}

export interface VerifiedPurchase {
  email: string
  fullName: string
  eventId: string
  paymentId: string
  amount: number
  amountUsd: number
  currency: string
  provider: PaymentProvider
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function normalizeIdentifier(value: unknown): string | null {
  if (typeof value !== "string") return null
  const identifier = value.trim()
  return identifier && identifier.length <= 200 ? identifier : null
}

function parsePaymentProvider(value: unknown): PaymentProvider | null {
  if (value === undefined || value === null || value === "") return "manual"
  return value === "stripe" || value === "dlocal" || value === "manual" ? value : null
}

export function parsePurchasePayload(value: unknown): VerifiedPurchase | null {
  if (!value || typeof value !== "object") return null

  const body = value as PurchaseWebhookPayload
  const email = normalizeEmail(body.email)
  const paymentId = normalizeIdentifier(body.purchase_id)
  const eventId = normalizeIdentifier(body.event_id) ?? paymentId
  const provider = parsePaymentProvider(body.payment_provider)
  const currency = typeof body.currency === "string"
    ? body.currency.trim().toUpperCase()
    : "USD"
  const amount = body.amount ?? COURSE_PRICE_USD
  const amountUsd = body.amount_usd ?? COURSE_PRICE_USD
  const fullName = typeof body.full_name === "string"
    ? body.full_name.trim().slice(0, 120)
    : ""

  if (
    !email
    || !paymentId
    || !eventId
    || !provider
    || !Number.isFinite(amount)
    || amount <= 0
    || !Number.isFinite(amountUsd)
    || amountUsd !== COURSE_PRICE_USD
    || !/^[A-Z]{3}$/.test(currency)
    || (provider === "stripe" && (currency !== "USD" || amount !== COURSE_PRICE_USD))
  ) {
    return null
  }

  return {
    email,
    fullName,
    eventId,
    paymentId,
    amount,
    amountUsd,
    currency,
    provider,
  }
}

export function verifyPurchaseWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !signature) return false

  const expected = createHmac("sha256", secret).update(payload).digest("hex")
  const received = signature.startsWith("sha256=") ? signature.slice(7) : signature
  const expectedBuffer = Buffer.from(expected, "utf8")
  const receivedBuffer = Buffer.from(received, "utf8")

  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer)
}

export function getPurchaseInvitationToken(email: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`pibo-purchase-invite:v1:${email.trim().toLowerCase()}`)
    .digest("hex")
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function getPurchaseEmailIdempotencyKey(
  provider: PaymentProvider,
  eventId: string,
): string {
  const eventHash = createHash("sha256").update(`${provider}:${eventId}`).digest("hex")
  return `pibo-purchase-${eventHash}`
}
