import { createHash, randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { invitationEmail } from "@/lib/email-templates"
import { checkRateLimit } from "@/lib/rate-limit"
import { getResend } from "@/lib/resend/client"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null
  const email = value.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

function normalizeFullName(value: unknown): string | null {
  if (typeof value !== "string") return null
  const fullName = value.trim()
  return fullName ? fullName.slice(0, 120) : null
}

async function getAdminId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: Pick<Profile, "role"> | null }

  return profile?.role === "admin" ? user.id : null
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await getAdminId()
    if (!adminId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    if (!(await checkRateLimit(`invite:${adminId}`, 10, 60 * 1000))) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Esperá un momento." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const email = normalizeEmail(body?.email)
    const fullName = normalizeFullName(body?.fullName)

    if (!email) {
      return NextResponse.json({ error: "Ingresá un email válido" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: existingInvitation, error: invitationLookupError } = await supabaseAdmin
      .from("invitations")
      .select("id")
      .eq("email", email)
      .is("accepted_at", null)
      .maybeSingle()

    if (invitationLookupError) {
      console.error("Could not check pending invitation", invitationLookupError)
      return NextResponse.json({ error: "No pudimos verificar la invitación" }, { status: 500 })
    }

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 409 }
      )
    }

    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (profileLookupError) {
      console.error("Could not check existing profile", profileLookupError)
      return NextResponse.json({ error: "No pudimos verificar la cuenta" }, { status: 500 })
    }

    if (existingProfile) {
      return NextResponse.json(
        { error: "Este email ya tiene una cuenta registrada" },
        { status: 409 }
      )
    }

    const token = randomBytes(32).toString("hex")
    const tokenHash = createHash("sha256").update(token).digest("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: insertError } = await supabaseAdmin.from("invitations").insert({
      email,
      full_name: fullName,
      token_hash: tokenHash,
      invited_by: adminId,
      expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      console.error("Could not create invitation", insertError)
      return NextResponse.json({ error: "No pudimos crear la invitación" }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const inviteUrl = `${appUrl}/invite/${token}`

    try {
      const { error: emailError } = await getResend().emails.send({
        from: "Pibo <no-reply@mipibo.com>",
        to: email,
        subject: "Tu invitación a Pibo",
        html: invitationEmail(fullName || undefined, inviteUrl),
      })

      if (emailError) throw emailError
    } catch (error) {
      console.error("Invitation created but email delivery failed", error)
      return NextResponse.json({
        success: true,
        message: "La invitación quedó creada, pero el email no salió",
        inviteUrl,
      })
    }

    return NextResponse.json({ success: true, message: "Invitación enviada" })
  } catch (error) {
    console.error("Unexpected invite API error", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const adminId = await getAdminId()
    if (!adminId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const { data: invitations, error } = await getSupabaseAdmin()
      .from("invitations")
      .select("id, email, full_name, invited_by, accepted_by, accepted_at, expires_at, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Could not list invitations", error)
      return NextResponse.json({ error: "No pudimos obtener las invitaciones" }, { status: 500 })
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Unexpected invitation list error", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
