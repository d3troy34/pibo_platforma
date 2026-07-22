import { createHmac } from "crypto"
import { describe, expect, it } from "vitest"

import {
  getPurchaseEmailIdempotencyKey,
  getPurchaseInvitationToken,
  hashInvitationToken,
  parsePurchasePayload,
  verifyPurchaseWebhookSignature,
} from "./purchase-webhook"

describe("purchase webhook contract", () => {
  it("normalizes a verified local-currency purchase without confusing local and USD amounts", () => {
    expect(parsePurchasePayload({
      email: " Buyer@Example.com ",
      full_name: " Test Buyer ",
      event_id: "DP-123",
      purchase_id: "DP-123",
      amount: 756_000,
      amount_usd: 180,
      currency: "cop",
      payment_provider: "dlocal",
    })).toEqual({
      email: "buyer@example.com",
      fullName: "Test Buyer",
      eventId: "DP-123",
      paymentId: "DP-123",
      amount: 756_000,
      amountUsd: 180,
      currency: "COP",
      provider: "dlocal",
    })
  })

  it("keeps the previous internal contract compatible during rollout", () => {
    expect(parsePurchasePayload({
      email: "buyer@example.com",
      full_name: "Buyer",
      purchase_id: "payment-1",
      amount: 180,
      currency: "USD",
      payment_provider: "stripe",
    })).toMatchObject({
      eventId: "payment-1",
      amountUsd: 180,
    })
  })

  it.each([
    { label: "wrong USD course value", amount_usd: 179 },
    { label: "Stripe local currency", amount: 180, amount_usd: 180, currency: "EUR" },
    { label: "unknown provider", payment_provider: "browser" },
    { label: "invalid email", email: "not-an-email" },
  ])("rejects $label", (override) => {
    expect(parsePurchasePayload({
      email: "buyer@example.com",
      full_name: "Buyer",
      event_id: "checkout-1",
      purchase_id: "payment-1",
      amount: 180,
      amount_usd: 180,
      currency: "USD",
      payment_provider: "stripe",
      ...override,
    })).toBeNull()
  })

  it("verifies only the exact signed bytes", () => {
    const body = JSON.stringify({ purchase_id: "payment-1" })
    const secret = "test-webhook-secret"
    const signature = createHmac("sha256", secret).update(body).digest("hex")

    expect(verifyPurchaseWebhookSignature(body, signature, secret)).toBe(true)
    expect(verifyPurchaseWebhookSignature(`${body}\n`, signature, secret)).toBe(false)
  })

  it("derives stable opaque invite tokens and email idempotency keys", () => {
    const first = getPurchaseInvitationToken("Buyer@Example.com", "secret")
    const second = getPurchaseInvitationToken(" buyer@example.com ", "secret")

    expect(first).toBe(second)
    expect(first).toHaveLength(64)
    expect(hashInvitationToken(first)).toHaveLength(64)
    expect(getPurchaseEmailIdempotencyKey("stripe", "checkout-1"))
      .toBe(getPurchaseEmailIdempotencyKey("stripe", "checkout-1"))
  })
})
