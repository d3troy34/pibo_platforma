import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resend } from "@/lib/resend/client"
import { confirmAccountEmail } from "@/lib/email-templates"
import { checkRateLimit } from "@/lib/rate-limit"

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  return email.length > 0 ? email : null
}

function sanitizeRedirect(value: unknown): string {
  if (typeof value !== "string") return "/curso"
  const next = value.trim()
  if (!next.startsWith("/")) return "/curso"
  if (next.startsWith("//")) return "/curso"
  return next
}

export async function POST(request: NextRequest) {
  try {
    // Lightweight rate limiting stub (currently no-op in Vercel).
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(`auth_register:${ip}`, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 }
      )
    }

    const body = await request.json()

    const email = normalizeEmail(body?.email)
    const password = typeof body?.password === "string" ? body.password : null
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : null
    const country = typeof body?.country === "string" ? body.country.trim() : null
    const redirectTo = sanitizeRedirect(body?.redirect)

    if (!email || !password || !fullName || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contrasena debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    // Create signup verification token + user record, but send the email via Resend.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          country,
        },
      },
    })

    if (error) {
      const msg = (error as { message?: string }).message || "Error creating account"
      const lower = msg.toLowerCase()
      const isDuplicate =
        lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists")

      return NextResponse.json(
        { error: isDuplicate ? "Este email ya esta registrado" : msg },
        { status: isDuplicate ? 400 : 500 }
      )
    }

    const tokenHash = data.properties.hashed_token
    const type = data.properties.verification_type
    const confirmUrl = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(
      tokenHash
    )}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(redirectTo)}`

    const { error: emailError } = await resend.emails.send({
      from: "Mipibo <no-reply@mipibo.com>",
      to: email,
      subject: "Confirma tu cuenta - Mipibo",
      html: confirmAccountEmail(fullName, confirmUrl),
    })

    if (emailError) {
      console.error("Error sending signup confirmation email:", emailError)
      // Avoid orphan users without a way to receive a confirmation link.
      if (data.user?.id) {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      }
      return NextResponse.json(
        { error: "No se pudo enviar el email. Intenta de nuevo." },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in auth/register:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

