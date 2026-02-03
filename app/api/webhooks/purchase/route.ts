import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resend } from "@/lib/resend/client"
import { createHmac } from "crypto"

interface PurchaseWebhookPayload {
  email: string
  full_name: string
  purchase_id: string
  amount?: number
  currency?: string
  payment_provider?: string
  timestamp?: string
  signature?: string // Legacy: signature in body (deprecated, use header instead)
}

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    console.error("No signature provided")
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

    // Get signature from header (preferred) or body (legacy/backwards compatible)
    const headerSignature = request.headers.get("x-webhook-signature")
    const bodySignature = body.signature

    // Verify webhook signature against raw body
    // Try header first, then fall back to body signature for backwards compatibility
    if (!verifyWebhookSignature(rawBody, headerSignature || bodySignature || null)) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("enrollments") as any)
        .upsert({
          user_id: existingProfile.id,
          payment_provider: payment_provider || "manual",
          payment_id: purchase_id,
          payment_status: "completed",
          payment_method: "mipibo_purchase",
          amount_usd: amount || 180,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((authError as any).code === "email_exists") {
        // User exists in auth - find them and ensure enrollment
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

        if (existingUser) {
          // Use upsert for idempotency
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabaseAdmin.from("enrollments") as any)
            .upsert({
              user_id: existingUser.id,
              payment_provider: payment_provider || "manual",
              payment_id: purchase_id,
              payment_status: "completed",
              payment_method: "mipibo_purchase",
              amount_usd: amount || 180,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("profiles") as any)
      .update({
        full_name,
      })
      .eq("id", userId)

    // Create enrollment (use upsert for idempotency)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrollmentError } = await (supabaseAdmin.from("enrollments") as any)
      .upsert({
        user_id: userId,
        payment_provider: payment_provider || "manual",
        payment_id: purchase_id,
        payment_status: "completed",
        payment_method: "mipibo_purchase",
        amount_usd: amount || 180,
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

    const resetUrl = resetData.properties.action_link

    // Send welcome email with password setup link (NOT plaintext password)
    const { error: emailError } = await resend.emails.send({
      from: "Mipibo <no-reply@mipibo.com>",
      to: email,
      subject: "Bienvenido a Mipibo - Configura tu acceso",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0F172A; color: #F0F9FF; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 40px;">
              <h1 style="color: #7DD3FC; margin-bottom: 24px; font-size: 28px;">
                ¡Bienvenido a Mipibo, ${full_name}!
              </h1>

              <p style="margin-bottom: 24px; line-height: 1.6; color: #CBD5E1;">
                Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todo el contenido del curso.
              </p>

              <div style="background-color: #334155; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h2 style="color: #7DD3FC; margin-top: 0; margin-bottom: 16px; font-size: 18px;">
                  Configura tu contraseña:
                </h2>

                <p style="margin: 8px 0; color: #F0F9FF;">
                  <strong>Email:</strong> ${email}
                </p>

                <p style="margin: 12px 0; color: #CBD5E1; font-size: 14px;">
                  Haz clic en el botón de abajo para configurar tu contraseña y acceder al curso.
                </p>
              </div>

              <a href="${resetUrl}"
                 style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: #0F172A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">
                Configurar Contraseña
              </a>

              <p style="margin-top: 24px; margin-bottom: 16px; line-height: 1.6; color: #94A3B8; font-size: 14px;">
                Este enlace expira en 24 horas. Si tienes problemas, puedes solicitar un nuevo enlace desde la página de inicio de sesión.
              </p>

              <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

              <p style="font-size: 12px; color: #64748B;">
                Si no solicitaste esta cuenta, puedes ignorar este email.
              </p>

              <p style="font-size: 12px; color: #64748B; margin-top: 16px;">
                © ${new Date().getFullYear()} Mipibo. Todos los derechos reservados.
              </p>
            </div>
          </body>
        </html>
      `,
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
