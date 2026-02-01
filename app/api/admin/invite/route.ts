import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { resend } from "@/lib/resend/client"
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
        { error: "Ya existe una invitacion pendiente para este email" },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabaseAdmin.from("invitations") as any)
      .insert({
        email: email.toLowerCase(),
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error("Error creating invitation:", insertError)
      return NextResponse.json(
        { error: "Error al crear la invitacion" },
        { status: 500 }
      )
    }

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const inviteUrl = `${appUrl}/invite/${token}`

    const { error: emailError } = await resend.emails.send({
      from: "Mipibo <no-reply@mipibo.com>",
      to: email,
      subject: "Invitacion a Mipibo - Tu acceso al curso",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0F172A; color: #F0F9FF; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; padding: 40px;">
              <h1 style="color: #7DD3FC; margin-bottom: 24px; font-size: 28px;">
                Bienvenido a Mipibo
              </h1>

              ${fullName ? `<p style="margin-bottom: 16px;">Hola ${fullName},</p>` : ""}

              <p style="margin-bottom: 24px; line-height: 1.6; color: #CBD5E1;">
                Has sido invitado a unirte a Mipibo, tu plataforma de preparacion para universidades argentinas.
              </p>

              <p style="margin-bottom: 32px; line-height: 1.6; color: #CBD5E1;">
                Haz clic en el boton de abajo para completar tu registro y acceder al curso:
              </p>

              <a href="${inviteUrl}"
                 style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: #0F172A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 32px;">
                Aceptar Invitacion
              </a>

              <p style="margin-top: 32px; font-size: 14px; color: #94A3B8;">
                Este enlace expira en 7 dias.
              </p>

              <p style="margin-top: 16px; font-size: 14px; color: #94A3B8;">
                Si no esperabas este email, puedes ignorarlo.
              </p>

              <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0;">

              <p style="font-size: 12px; color: #64748B;">
                © ${new Date().getFullYear()} Mipibo. Todos los derechos reservados.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (emailError) {
      console.error("Error sending email:", emailError)
      // Still return success since the invitation was created
      return NextResponse.json({
        success: true,
        message: "Invitacion creada pero hubo un error al enviar el email",
        inviteUrl, // Include URL for manual sharing
      })
    }

    return NextResponse.json({
      success: true,
      message: "Invitacion enviada correctamente",
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
        { error: "Error al obtener invitaciones" },
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
