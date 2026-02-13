import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resend } from "@/lib/resend/client"
import { resetPasswordEmail } from "@/lib/email-templates"
import { checkRateLimit } from "@/lib/rate-limit"

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  return email.length > 0 ? email : null
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(`auth_reset_password:${ip}`, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const email = normalizeEmail(body?.email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    })

    // Avoid user enumeration: behave as success even when the user doesn't exist.
    if (error) {
      const code = (error as { code?: string }).code
      if (code === "user_not_found") {
        return NextResponse.json({ success: true })
      }

      console.error("Error generating recovery link:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const tokenHash = data.properties.hashed_token
    const type = data.properties.verification_type
    const resetUrl = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(
      tokenHash
    )}&type=${encodeURIComponent(type)}&next=${encodeURIComponent("/update-password")}`

    const { error: emailError } = await resend.emails.send({
      from: "Mipibo <no-reply@mipibo.com>",
      to: email,
      subject: "Restablecer contrasena - Mipibo",
      html: resetPasswordEmail(resetUrl),
    })

    if (emailError) {
      console.error("Error sending reset password email:", emailError)
      return NextResponse.json(
        { error: "No se pudo enviar el email. Intenta de nuevo." },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in auth/reset-password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

