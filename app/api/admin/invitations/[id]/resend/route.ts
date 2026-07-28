import { createHash, randomBytes } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedAdminId } from "@/lib/admin-auth"
import { invitationEmail } from "@/lib/email-templates"
import { checkRateLimit, getRateLimitHttpError } from "@/lib/rate-limit"
import { getResend } from "@/lib/resend/client"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

const invitationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getInvitationId(params: { id?: string }): string | null {
  return params.id && invitationIdPattern.test(params.id) ? params.id : null
}

function nextInvitationExpiry() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  return expiresAt.toISOString()
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const adminId = await getAuthenticatedAdminId()
    if (!adminId) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const rateLimitError = getRateLimitHttpError(
      await checkRateLimit(`resend-invite:${adminId}`, 10, 60 * 1000),
      "Demasiadas solicitudes. Esperá un momento."
    )
    if (rateLimitError) {
      return NextResponse.json(
        { error: rateLimitError.error },
        {
          status: rateLimitError.status,
          headers: { "Retry-After": rateLimitError.retryAfter },
        }
      )
    }

    const invitationId = getInvitationId(await context.params)
    if (!invitationId) {
      return NextResponse.json({ error: "Invitación inválida" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: invitation, error: lookupError } = await supabaseAdmin
      .from("invitations")
      .select("id, email, full_name, accepted_at")
      .eq("id", invitationId)
      .maybeSingle()

    if (lookupError) {
      console.error("Could not load invitation for resend", lookupError)
      return NextResponse.json({ error: "No pudimos cargar la invitación" }, { status: 500 })
    }
    if (!invitation) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
    }
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: "Esta invitación ya fue aceptada" },
        { status: 409 }
      )
    }

    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", invitation.email)
      .maybeSingle()

    if (profileLookupError) {
      console.error("Could not verify invitation account", profileLookupError)
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
    const expiresAt = nextInvitationExpiry()
    const { data: updatedInvitation, error: updateError } = await supabaseAdmin
      .from("invitations")
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt,
        invited_by: adminId,
      })
      .eq("id", invitation.id)
      .is("accepted_at", null)
      .select("id")
      .maybeSingle()

    if (updateError) {
      console.error("Could not renew invitation", updateError)
      return NextResponse.json({ error: "No pudimos renovar la invitación" }, { status: 500 })
    }
    if (!updatedInvitation) {
      return NextResponse.json(
        { error: "La invitación cambió mientras la renovábamos" },
        { status: 409 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const inviteUrl = `${appUrl}/invite/${token}`

    try {
      const { error: emailError } = await getResend().emails.send({
        from: "Pibo <no-reply@mipibo.com>",
        to: invitation.email,
        subject: "Tu nueva invitación a Pibo",
        html: invitationEmail(invitation.full_name || undefined, inviteUrl),
      })

      if (emailError) throw emailError
    } catch (error) {
      console.error("Invitation renewed but email delivery failed", error)
      return NextResponse.json({
        success: true,
        message: "La invitación se renovó, pero el email no salió",
        inviteUrl,
      })
    }

    return NextResponse.json({ success: true, message: "Invitación reenviada" })
  } catch (error) {
    console.error("Unexpected invitation resend error", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
