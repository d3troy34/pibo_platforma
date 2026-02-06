import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resend } from "@/lib/resend/client"
import { invitationEmail } from "@/lib/email-templates"
import { checkRateLimit } from "@/lib/rate-limit"
import { randomBytes } from "crypto"
import type { Profile } from "@/types/database"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: Pick<Profile, "role"> | null }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      )
    }

    // Rate limiting: 10 invitations per minute per user
    const rateLimitKey = `invite:${user.id}`
    if (!checkRateLimit(rateLimitKey, 10, 60 * 1000)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Por favor, espera un momento." },
        { status: 429 }
      )
    }

    const { email, fullName } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      )
    }

    // Check if invitation already exists for this email
    const { data: existingInvitation } = await supabaseAdmin
      .from("invitations")
      .select("id, accepted_at")
      .eq("email", email.toLowerCase())
      .is("accepted_at", null)
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: "Este email ya tiene una cuenta registrada" },
        { status: 400 }
      )
    }

    // Generate invitation token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    // Create invitation
    const { error: insertError } = await supabaseAdmin.from("invitations")
      .insert({
        email: email.toLowerCase(),
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error("Error creating invitation:", insertError)
      return NextResponse.json(
        { error: "Error al crear la invitación" },
        { status: 500 }
      )
    }

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const inviteUrl = `${appUrl}/invite/${token}`

    const { error: emailError } = await resend.emails.send({
      from: "Mipibo <no-reply@mipibo.com>",
      to: email,
      subject: "Invitación a Mipibo - Tu acceso al curso",
      html: invitationEmail(fullName, inviteUrl),
    })

    if (emailError) {
      console.error("Error sending email:", emailError)
      // Still return success since the invitation was created
      return NextResponse.json({
        success: true,
        message: "Invitación creada pero hubo un error al enviar el email",
        inviteUrl, // Include URL for manual sharing
      })
    }

    return NextResponse.json({
      success: true,
      message: "Invitación enviada correctamente",
    })
  } catch (error) {
    console.error("Error in invite API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Get pending invitations
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: Pick<Profile, "role"> | null }

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      )
    }

    // Get all invitations
    const { data: invitations, error } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener invitaciónes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Error in get invitations API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
