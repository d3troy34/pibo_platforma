import { NextRequest, NextResponse } from "next/server"

import { courseReadyEmail, purchaseInvitationEmail } from "@/lib/email-templates"
import {
  getPurchaseEmailIdempotencyKey,
  getPurchaseInvitationToken,
  hashInvitationToken,
  parsePurchasePayload,
  verifyPurchaseWebhookSignature,
} from "@/lib/purchase-webhook"
import { getResend } from "@/lib/resend/client"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"

export const runtime = "nodejs"

const MAX_WEBHOOK_BYTES = 64 * 1024
const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

type AccessStatus = "pending_account" | "active" | "revoked"
type EmailKind = "invitation" | "course_ready"
type EmailStatus = "pending" | "sending" | "sent" | "failed"

interface EmailClaim {
  claimed: boolean
  email: string
  full_name: string | null
  email_kind: EmailKind
  email_status: EmailStatus
  access_status: AccessStatus
}

function parseEmailClaim(value: unknown): EmailClaim | null {
  if (!value || typeof value !== "object") return null
  const claim = value as Record<string, unknown>

  if (
    typeof claim.claimed !== "boolean"
    || typeof claim.email !== "string"
    || (claim.full_name !== null && typeof claim.full_name !== "string")
    || (claim.email_kind !== "invitation" && claim.email_kind !== "course_ready")
    || !["pending", "sending", "sent", "failed"].includes(String(claim.email_status))
    || !["pending_account", "active", "revoked"].includes(String(claim.access_status))
  ) {
    return null
  }

  return claim as unknown as EmailClaim
}

function getAppOrigin(request: NextRequest): string | null {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin

  try {
    const url = new URL(value)
    const isLocalHttp = url.protocol === "http:"
      && (url.hostname === "localhost" || url.hostname === "127.0.0.1")

    if (
      (url.protocol !== "https:" && !isLocalHttp)
      || url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) {
      return null
    }

    return url.origin
  } catch {
    return null
  }
}

function retryableDeliveryResponse(accessStatus: AccessStatus = "pending_account") {
  return NextResponse.json(
    {
      success: false,
      purchase_recorded: true,
      access_status: accessStatus,
      email_status: "pending",
    },
    { status: 503 },
  )
}

export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Invalid purchase payload" }, { status: 413 })
  }

  const rawBody = await request.text()
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ error: "Invalid purchase payload" }, { status: 413 })
  }

  const webhookSecret = process.env.WEBHOOK_SECRET
  if (!verifyPurchaseWebhookSignature(
    rawBody,
    request.headers.get("x-webhook-signature"),
    webhookSecret,
  )) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const purchase = parsePurchasePayload(body)
  const appOrigin = getAppOrigin(request)
  if (!purchase || !appOrigin || !webhookSecret) {
    return NextResponse.json({ error: "Invalid purchase payload" }, { status: 400 })
  }

  const invitationToken = getPurchaseInvitationToken(purchase.email, webhookSecret)
  const invitationExpiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS).toISOString()
  const supabaseAdmin = getSupabaseAdmin()

  const { error: provisionError } = await supabaseAdmin.rpc("provision_purchase", {
    purchase_email: purchase.email,
    purchase_full_name: purchase.fullName,
    purchase_provider: purchase.provider,
    purchase_event_id: purchase.eventId,
    purchase_payment_id: purchase.paymentId,
    purchase_amount: purchase.amount,
    purchase_amount_usd: purchase.amountUsd,
    purchase_currency: purchase.currency,
    purchase_invitation_token_hash: hashInvitationToken(invitationToken),
    purchase_invitation_expires_at: invitationExpiresAt,
    purchase_payload: body as Json,
  })

  if (provisionError) {
    console.error("Purchase provisioning failed", {
      provider: purchase.provider,
      eventId: purchase.eventId,
      code: provisionError.code,
    })
    return NextResponse.json({ error: "Purchase provisioning failed" }, { status: 500 })
  }

  const { data: claimData, error: claimError } = await supabaseAdmin.rpc(
    "claim_purchase_email",
    {
      purchase_provider: purchase.provider,
      purchase_event_id: purchase.eventId,
    },
  )
  const claim = parseEmailClaim(claimData)

  if (claimError || !claim) {
    console.error("Purchase recorded but email claim failed", {
      provider: purchase.provider,
      eventId: purchase.eventId,
      code: claimError?.code,
    })
    return retryableDeliveryResponse()
  }

  if (claim.email_status === "sent") {
    return NextResponse.json({
      success: true,
      duplicate: true,
      access_status: claim.access_status,
      email_status: "sent",
    })
  }

  if (!claim.claimed) {
    return retryableDeliveryResponse(claim.access_status)
  }

  const actionUrl = claim.email_kind === "invitation"
    ? `${appOrigin}/invite/${invitationToken}`
    : `${appOrigin}/login?redirect=${encodeURIComponent("/curso")}`
  const html = claim.email_kind === "invitation"
    ? purchaseInvitationEmail(claim.full_name || undefined, actionUrl)
    : courseReadyEmail(claim.full_name || undefined, actionUrl)

  try {
    const { data, error } = await getResend().emails.send(
      {
        from: process.env.RESEND_FROM_EMAIL?.trim() || "Pibo <no-reply@mipibo.com>",
        to: claim.email,
        subject: claim.email_kind === "invitation"
          ? "Tu compra de Pibo esta aprobada"
          : "Tu curso Pibo ya esta habilitado",
        html,
      },
      {
        headers: {
          "Idempotency-Key": getPurchaseEmailIdempotencyKey(
            purchase.provider,
            purchase.eventId,
          ),
        },
      },
    )

    if (error) throw error

    const { data: completed, error: completionError } = await supabaseAdmin.rpc(
      "complete_purchase_email",
      {
        purchase_provider: purchase.provider,
        purchase_event_id: purchase.eventId,
        purchase_email_provider_id: data?.id || "",
      },
    )

    if (completionError || !completed) {
      console.error("Purchase email sent but completion was not recorded", {
        provider: purchase.provider,
        eventId: purchase.eventId,
        code: completionError?.code,
      })
      return retryableDeliveryResponse(claim.access_status)
    }
  } catch (error) {
    await supabaseAdmin.rpc("fail_purchase_email", {
      purchase_provider: purchase.provider,
      purchase_event_id: purchase.eventId,
      purchase_error_code: "delivery_failed",
    })
    console.error("Purchase recorded but email delivery failed", {
      provider: purchase.provider,
      eventId: purchase.eventId,
      error,
    })
    return retryableDeliveryResponse(claim.access_status)
  }

  return NextResponse.json({
    success: true,
    access_status: claim.access_status,
    email_status: "sent",
  })
}
