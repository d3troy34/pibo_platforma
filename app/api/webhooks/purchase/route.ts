import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { welcomeEmail } from "@/lib/email-templates"
import { getResend } from "@/lib/resend/client"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const COURSE_PRICE_USD = 180

type PaymentProvider = "stripe" | "dlocal" | "manual"

interface PurchaseWebhookPayload {
  email: string
  full_name: string
  purchase_id: string
  amount?: number
  currency?: string
  payment_provider?: string
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function parsePaymentProvider(value: unknown): PaymentProvider | null {
  if (value === undefined || value === null || value === "") return "manual"
  return value === "stripe" || value === "dlocal" || value === "manual" ? value : null
}

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = createHmac("sha256", secret).update(payload).digest("hex")
  const received = signature.startsWith("sha256=") ? signature.slice(7) : signature
  const expectedBuffer = Buffer.from(expected, "utf8")
  const receivedBuffer = Buffer.from(received, "utf8")

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!verifyWebhookSignature(rawBody, request.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let body: PurchaseWebhookPayload
  try {
    body = JSON.parse(rawBody) as PurchaseWebhookPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : ""
  const purchaseId = typeof body.purchase_id === "string" ? body.purchase_id.trim().slice(0, 200) : ""
  const provider = parsePaymentProvider(body.payment_provider)
  const amount = body.amount === undefined ? COURSE_PRICE_USD : body.amount
  const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "USD"

  if (
    !email ||
    !fullName ||
    !purchaseId ||
    !provider ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    return NextResponse.json({ error: "Invalid purchase payload" }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  let userId: string | null = null
  let createdUser = false

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (profileError) throw profileError
    userId = profile?.id || null

    if (!userId) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

      if (authError) {
        const isExistingAuthUser = (authError as { code?: string }).code === "email_exists"
        if (!isExistingAuthUser) throw authError

        // In the new schema every auth user must have a profile. If it does not,
        // scanning the auth directory would hide broken data and only works for page one.
        const { data: recoveredProfile, error: recoveryError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle()

        if (recoveryError || !recoveredProfile) {
          throw new Error("Existing auth user is missing its profile")
        }

        userId = recoveredProfile.id
      } else if (authData.user) {
        userId = authData.user.id
        createdUser = true
      }
    }

    if (!userId) throw new Error("Purchase user could not be resolved")

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId)

    if (profileUpdateError) throw profileUpdateError

    const { data: processed, error: fulfillmentError } = await supabaseAdmin.rpc(
      "fulfill_purchase",
      {
        purchase_user_id: userId,
        purchase_provider: provider,
        purchase_event_id: purchaseId,
        purchase_payment_id: purchaseId,
        purchase_amount_usd: amount,
        purchase_currency: currency,
        purchase_payload: {
          purchase_id: purchaseId,
          payment_provider: provider,
          amount,
          currency,
        },
      }
    )

    if (fulfillmentError) throw fulfillmentError

    if (!processed) {
      if (createdUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "Purchase already processed",
      })
    }

    if (!createdUser) {
      return NextResponse.json({
        success: true,
        user_existed: true,
        message: "Access verified",
      })
    }

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    })

    if (resetError) {
      console.error("Purchase completed but password link generation failed", { purchaseId })
      return NextResponse.json({
        success: true,
        email_sent: false,
        purchase_id: purchaseId,
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const resetUrl = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(
      resetData.properties.hashed_token
    )}&type=${encodeURIComponent(
      resetData.properties.verification_type
    )}&next=${encodeURIComponent("/update-password")}`

    try {
      const { error: emailError } = await getResend().emails.send({
        from: "Pibo <no-reply@mipibo.com>",
        to: email,
        subject: "Bienvenido a Pibo: configurá tu acceso",
        html: welcomeEmail(fullName, email, resetUrl),
      })

      if (emailError) throw emailError
    } catch (error) {
      console.error("Purchase completed but welcome email delivery failed", { purchaseId, error })
      return NextResponse.json({
        success: true,
        email_sent: false,
        purchase_id: purchaseId,
      })
    }

    return NextResponse.json({
      success: true,
      email_sent: true,
      purchase_id: purchaseId,
    })
  } catch (error) {
    console.error("Purchase fulfillment failed", { purchaseId, error })

    if (createdUser && userId) {
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (rollbackError) console.error("Could not roll back purchase user", { purchaseId, rollbackError })
    }

    return NextResponse.json({ error: "Purchase fulfillment failed" }, { status: 500 })
  }
}
