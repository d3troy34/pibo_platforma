import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

const {
  getAuthenticatedAdminId,
  checkRateLimit,
  getRateLimitHttpError,
  getResend,
  getSupabaseAdmin,
  invitationEmail,
} = vi.hoisted(() => ({
  getAuthenticatedAdminId: vi.fn(),
  checkRateLimit: vi.fn(),
  getRateLimitHttpError: vi.fn(),
  getResend: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  invitationEmail: vi.fn(() => "<html>invitation</html>"),
}))

vi.mock("@/lib/admin-auth", () => ({ getAuthenticatedAdminId }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit, getRateLimitHttpError }))
vi.mock("@/lib/resend/client", () => ({ getResend }))
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin }))
vi.mock("@/lib/email-templates", () => ({ invitationEmail }))

import { POST } from "../app/api/admin/invitations/[id]/resend/route"

const invitationId = "11111111-1111-4111-8111-111111111111"
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

function requestFor(id: string) {
  return new Request(`https://lms.example.test/api/admin/invitations/${id}/resend`, {
    method: "POST",
  }) as never
}

function makeQuery(result: unknown) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.is.mockReturnValue(query)
  query.update.mockReturnValue(query)
  query.maybeSingle.mockResolvedValue(result)
  return query
}

function setupAdminClient(invitationResult: unknown, profileResult: unknown, updateResult: unknown) {
  const invitationLookup = makeQuery(invitationResult)
  const profileLookup = makeQuery(profileResult)
  const invitationUpdate = makeQuery(updateResult)
  const from = vi.fn()
    .mockReturnValueOnce(invitationLookup)
    .mockReturnValueOnce(profileLookup)
    .mockReturnValueOnce(invitationUpdate)

  getSupabaseAdmin.mockReturnValue({ from })
  return { invitationLookup, profileLookup, invitationUpdate }
}

beforeEach(() => {
  getAuthenticatedAdminId.mockReset()
  checkRateLimit.mockReset()
  getRateLimitHttpError.mockReset()
  getResend.mockReset()
  getSupabaseAdmin.mockReset()
  invitationEmail.mockClear()

  getAuthenticatedAdminId.mockResolvedValue("admin-1")
  checkRateLimit.mockResolvedValue("allowed")
  getRateLimitHttpError.mockReturnValue(null)
  process.env.NEXT_PUBLIC_APP_URL = "https://www.mipibo.com"
})

afterAll(() => {
  if (originalAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL
  else process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
})

describe("admin invitation renewal", () => {
  it("requires an authenticated administrator", async () => {
    getAuthenticatedAdminId.mockResolvedValue(null)

    const response = await POST(requestFor(invitationId), {
      params: Promise.resolve({ id: invitationId }),
    })

    expect(response.status).toBe(403)
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })

  it("rejects malformed invitation IDs before querying the database", async () => {
    const response = await POST(requestFor("not-an-id"), {
      params: Promise.resolve({ id: "not-an-id" }),
    })

    expect(response.status).toBe(400)
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })

  it("rotates the token, extends expiry, and sends the new invitation", async () => {
    const { invitationUpdate } = setupAdminClient(
      {
        data: {
          id: invitationId,
          email: "buyer@example.com",
          full_name: "Buyer",
          accepted_at: null,
        },
        error: null,
      },
      { data: null, error: null },
      { data: { id: invitationId }, error: null },
    )
    const send = vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null })
    getResend.mockReturnValue({ emails: { send } })

    const before = Date.now() + 6 * 24 * 60 * 60 * 1000
    const response = await POST(requestFor(invitationId), {
      params: Promise.resolve({ id: invitationId }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, message: "Invitación reenviada" })
    expect(invitationUpdate.update).toHaveBeenCalledWith(expect.objectContaining({
      token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      invited_by: "admin-1",
      expires_at: expect.any(String),
    }))
    expect(new Date(invitationUpdate.update.mock.calls[0][0].expires_at).getTime()).toBeGreaterThan(before)
    expect(invitationUpdate.eq).toHaveBeenCalledWith("id", invitationId)
    expect(invitationUpdate.is).toHaveBeenCalledWith("accepted_at", null)
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      to: "buyer@example.com",
      subject: "Tu nueva invitación a Pibo",
      html: "<html>invitation</html>",
    }))
    expect(invitationEmail).toHaveBeenCalledWith("Buyer", expect.stringMatching(
      /^https:\/\/www\.mipibo\.com\/invite\/[a-f0-9]{64}$/,
    ))
  })

  it("does not rotate an invitation that was already accepted", async () => {
    setupAdminClient(
      {
        data: {
          id: invitationId,
          email: "buyer@example.com",
          full_name: null,
          accepted_at: "2026-07-27T00:00:00.000Z",
        },
        error: null,
      },
      null,
      null,
    )

    const response = await POST(requestFor(invitationId), {
      params: Promise.resolve({ id: invitationId }),
    })

    expect(response.status).toBe(409)
    expect(getResend).not.toHaveBeenCalled()
  })
})
