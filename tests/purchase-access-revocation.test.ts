import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getSupabaseAdmin,
  parseAccessRevocationPayload,
  parsePurchasePayload,
  verifyPurchaseWebhookSignature,
} = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  parseAccessRevocationPayload: vi.fn(),
  parsePurchasePayload: vi.fn(),
  verifyPurchaseWebhookSignature: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin }))
vi.mock("@/lib/purchase-webhook", () => ({
  getPurchaseEmailIdempotencyKey: vi.fn(),
  getPurchaseInvitationToken: vi.fn(),
  hashInvitationToken: vi.fn(),
  parseAccessRevocationPayload,
  parsePurchasePayload,
  verifyPurchaseWebhookSignature,
}))
vi.mock("@/lib/email-templates", () => ({
  courseReadyEmail: vi.fn(),
  purchaseInvitationEmail: vi.fn(),
}))
vi.mock("@/lib/resend/client", () => ({ getResend: vi.fn() }))

import { POST } from "../app/api/webhooks/purchase/route"

function requestFor(body: unknown, signature = "valid-signature") {
  return new Request("https://lms.example.test/api/webhooks/purchase", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-signature": signature,
    },
    body: JSON.stringify(body),
  }) as never
}

beforeEach(() => {
  getSupabaseAdmin.mockReset()
  parseAccessRevocationPayload.mockReset()
  parsePurchasePayload.mockReset()
  verifyPurchaseWebhookSignature.mockReset()
  verifyPurchaseWebhookSignature.mockReturnValue(true)
  parsePurchasePayload.mockReturnValue(null)
})

describe("purchase webhook access revocation", () => {
  it("revokes access for a verified refund and returns success", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { access_status: "revoked" },
      error: null,
    })
    getSupabaseAdmin.mockReturnValue({ rpc })
    parseAccessRevocationPayload.mockReturnValue({
      eventId: "evt_refund_1",
      paymentId: "pi_refund_1",
      provider: "stripe",
      reason: "refund",
    })

    const response = await POST(requestFor({ access_action: "revoke" }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      access_status: "revoked",
      revocation_reason: "refund",
    })
    expect(rpc).toHaveBeenCalledWith("revoke_purchase_access", {
      revoke_provider: "stripe",
      revoke_event_id: "evt_refund_1",
      revoke_payment_id: "pi_refund_1",
      revoke_reason: "refund",
    })
  })

  it("returns a retryable error when the LMS cannot revoke access", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "P0001" },
    })
    getSupabaseAdmin.mockReturnValue({ rpc })
    parseAccessRevocationPayload.mockReturnValue({
      eventId: "evt_dispute_1",
      paymentId: "pi_dispute_1",
      provider: "stripe",
      reason: "dispute",
    })

    const response = await POST(requestFor({ access_action: "revoke" }))

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: "Access revocation failed" })
  })

  it("rejects unsigned revocation payloads before touching Supabase", async () => {
    verifyPurchaseWebhookSignature.mockReturnValue(false)
    parseAccessRevocationPayload.mockReturnValue({
      eventId: "evt_refund_2",
      paymentId: "pi_refund_2",
      provider: "stripe",
      reason: "refund",
    })

    const response = await POST(requestFor({ access_action: "revoke" }, "bad-signature"))

    expect(response.status).toBe(401)
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })
})
