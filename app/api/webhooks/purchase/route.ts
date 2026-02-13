import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resend } from "@/lib/resend/client"
import { welcomeEmail } from "@/lib/email-templates"
import { createHmac } from "crypto"

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

function toPaymentProvider(value?: string): PaymentProvider {
  if (value === "stripe" || value === "dlocal" || value === "manual") return value
  return "manual"
}

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    console.error("No signature provided in x-webhook-signature header")
    return false
  }

  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    console.error("WEBHOOK_SECRET not configured")
    return false
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    let body: PurchaseWebhookPayload

    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      )
    }

    // Verify webhook signature from header against raw body
    const signature = request.headers.get("x-webhook-signature")

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("Error: Invalid signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const { email, full_name, purchase_id, amount, currency, payment_provider } = body

    // Validate required fields
    if (!email || !full_name || !purchase_id) {
      return NextResponse.json(
        { error: "Missing required fields: email, full_name, purchase_id" },
        { status: 400 }
      )
    }

    console.log(`Success: Access granted for ${email}`)

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single()

    if (existingProfile) {
      // User already exists - just ensure they have enrollment (use upsert for idempotency)
      await supabaseAdmin.from("enrollments")
        .upsert({
          user_id: existingProfile.id,
          payment_provider: toPaymentProvider(payment_provider),
          payment_id: purchase_id,
          payment_status: "completed",
          payment_method: "mipibo_purchase",
          amount_usd: amount || COURSE_PRICE_USD,
          currency: currency || "USD",
          enrolled_at: new Date().toISOString(),
        }, { onConflict: "user_id" })

      return NextResponse.json({
        success: true,
        message: "User already exists, enrollment verified",
        user_existed: true,
      })
    }

    // Create user account WITHOUT password (will use password reset flow)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    })

    // Handle case where user already exists in auth but not in profiles
    if (authError) {
      if ((authError as { code?: string }).code === "email_exists") {
        // User exists in auth - find them and ensure enrollment
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

        if (existingUser) {
          // Use upsert for idempotency
          await supabaseAdmin.from("enrollments")
            .upsert({
              user_id: existingUser.id,
              payment_provider: toPaymentProvider(payment_provider),
              payment_id: purchase_id,
              payment_status: "completed",
              payment_method: "mipibo_purchase",
              amount_usd: amount || COURSE_PRICE_USD,
              currency: currency || "USD",
              enrolled_at: new Date().toISOString(),
            }, { onConflict: "user_id" })

          return NextResponse.json({
            success: true,
            message: "User already exists, enrollment verified",
            user_existed: true,
          })
        }
      }

      console.error("Error creating user:", authError)
      return NextResponse.json(
        { error: "Error creating user account" },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Update profile with full name
    await supabaseAdmin.from("profiles")
      .update({
        full_name,
      })
      .eq("id", userId)

    // Create enrollment (use upsert for idempotency)
    const { error: enrollmentError } = await supabaseAdmin.from("enrollments")
      .upsert({
        user_id: userId,
        payment_provider: toPaymentProvider(payment_provider),
        payment_id: purchase_id,
        payment_status: "completed",
        payment_method: "mipibo_purchase",
        amount_usd: amount || COURSE_PRICE_USD,
        currency: currency || "USD",
        enrolled_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (enrollmentError) {
      console.error("Error creating enrollment:", enrollmentError)
    }

    // Generate password reset link for secure password setup
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email.toLowerCase(),
    })

    if (resetError) {
      console.error("Error generating password reset link:", resetError)
      return NextResponse.json({
        success: true,
        message: "Account created but password reset link failed",
        email_sent: false,
        purchase_id,
      })
    }

    // Use our app confirm route (verifyOtp) instead of the Supabase /verify link,
    // so we can set cookies/session on our domain consistently.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const resetUrl = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(
      resetData.properties.hashed_token
    )}&type=${encodeURIComponent(
      resetData.properties.verification_type
    )}&next=${encodeURIComponent("/update-password")}`

    // Send welcome email with password setup link (NOT plaintext password)
    const { error: emailError } = await resend.emails.send({
      from: "Mipibo <no-reply@mipibo.com>",
      to: email,
      subject: "Bienvenido a Mipibo - Configura tu acceso",
      html: welcomeEmail(full_name, email, resetUrl),
    })

    if (emailError) {
      console.error("Error sending welcome email:", emailError)
      return NextResponse.json({
        success: true,
        message: "Account created but email failed to send",
        email_sent: false,
        purchase_id,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Account created and password setup email sent",
      email_sent: true,
      purchase_id,
    })
  } catch (error) {
    console.error("Error in purchase webhook:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
