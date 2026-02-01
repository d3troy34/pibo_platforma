import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resend } from "@/lib/resend/client"
import { createHmac, randomBytes } from "crypto"

interface PurchaseWebhookPayload {
  email: string
  full_name: string
  purchase_id: string
  amount?: number
  currency?: string
  timestamp?: string
  signature: string
}

function generateSecurePassword(length: number = 12): string {
  const charset = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(length)
  let password = ""
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length]
  }
  return password
}

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    console.error("WEBHOOK_SECRET not configured")
    return false
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  // DEBUG: Remove after testing
  console.log("WEBHOOK_DEBUG: secret set:", !!secret, "secret starts:", secret.substring(0, 8))
  console.log("WEBHOOK_DEBUG: payload:", payload)
  console.log("WEBHOOK_DEBUG: expected:", expectedSignature.substring(0, 16), "received:", signature.substring(0, 16))
  console.log("WEBHOOK_DEBUG: match:", signature === expectedSignature)

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

    const { email, full_name, purchase_id, amount, currency, signature } = body

    // Validate required fields
    if (!email || !full_name || !purchase_id || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: email, full_name, purchase_id, signature" },
        { status: 400 }
      )
    }

    // Verify webhook signature
    // Create payload string for signature verification (must match sender's exact format)
    const signaturePayload = JSON.stringify({
      email,
      full_name,
      purchase_id,
    })

    if (!verifyWebhookSignature(signaturePayload, signature)) {
      console.error("Error: Invalid signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
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
      // User already exists - just ensure they have enrollment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingEnrollment } = await (supabaseAdmin.from("enrollments") as any)
        .select("id")
        .eq("user_id", existingProfile.id)
        .single()

      if (!existingEnrollment) {
        // Create enrollment for existing user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin.from("enrollments") as any)
          .insert({
            user_id: existingProfile.id,
            payment_provider: "manual",
            payment_id: purchase_id,
            payment_status: "completed",
            payment_method: "mipibo_purchase",
            amount_usd: amount || 180,
            currency: currency || "USD",
            enrolled_at: new Date().toISOString(),
          })
      }

      return NextResponse.json({
        success: true,
        message: "User already exists, enrollment verified",
        user_existed: true,
      })
    }

    // Generate secure password
    const generatedPassword = generateSecurePassword(12)

    // Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: generatedPassword,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existingEnrollment } = await (supabaseAdmin.from("enrollments") as any)
            .select("id")
            .eq("user_id", existingUser.id)
            .single()

          if (!existingEnrollment) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabaseAdmin.from("enrollments") as any)
              .insert({
                user_id: existingUser.id,
                payment_provider: "manual",
                payment_id: purchase_id,
                payment_status: "completed",
                payment_method: "mipibo_purchase",
                amount_usd: amount || 180,
                currency: currency || "USD",
                enrolled_at: new Date().toISOString(),
              })
          }

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

    // Create enrollment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrollmentError } = await (supabaseAdmin.from("enrollments") as any)
      .insert({
        user_id: userId,
        payment_provider: "manual",
        payment_id: purchase_id,
        payment_status: "completed",
        payment_method: "mipibo_purchase",
        amount_usd: amount || 180,
        currency: currency || "USD",
        enrolled_at: new Date().toISOString(),
      })

    if (enrollmentError) {
      console.error("Error creating enrollment:", enrollmentError)
    }

    // Send credentials email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const loginUrl = `${appUrl}/login`

    const { error: emailError } = await resend.emails.send({
      from: "Mipibo <no-reply@mipibo.com>",
      to: email,
      subject: "Tus credenciales de acceso a Mipibo",
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
                Bienvenido a Mipibo, ${full_name}!
              </h1>

              <p style="margin-bottom: 24px; line-height: 1.6; color: #CBD5E1;">
                Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todo el contenido del curso.
              </p>

              <div style="background-color: #334155; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <h2 style="color: #7DD3FC; margin-top: 0; margin-bottom: 16px; font-size: 18px;">
                  Tus credenciales de acceso:
                </h2>

                <p style="margin: 8px 0; color: #F0F9FF;">
                  <strong>Email:</strong> ${email}
                </p>

                <p style="margin: 8px 0; color: #F0F9FF;">
                  <strong>Contrasena:</strong> <code style="background-color: #0F172A; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${generatedPassword}</code>
                </p>
              </div>

              <p style="margin-bottom: 24px; line-height: 1.6; color: #94A3B8; font-size: 14px;">
                Te recomendamos cambiar tu contrasena despues de iniciar sesion por primera vez.
              </p>

              <a href="${loginUrl}"
                 style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: #0F172A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">
                Iniciar Sesion
              </a>

              <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

              <p style="font-size: 12px; color: #64748B;">
                Si tienes problemas para acceder, puedes restablecer tu contrasena desde la pagina de login.
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
      console.error("Error sending credentials email:", emailError)
      return NextResponse.json({
        success: true,
        message: "Account created but email failed to send",
        email_sent: false,
        purchase_id,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Account created and credentials sent",
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
