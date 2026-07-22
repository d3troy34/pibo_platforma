import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase/admin"

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body?.token === "string" ? body.token.trim() : ""
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : ""
    const country = typeof body?.country === "string" ? body.country.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!token || fullName.length < 2 || !PASSWORD_PATTERN.test(password)) {
      return NextResponse.json(
        { error: "Revisá tus datos. La contraseña necesita 8 caracteres, una letra y un número." },
        { status: 400 }
      )
    }

    const tokenHash = createHash("sha256").update(token).digest("hex")
    const supabaseAdmin = getSupabaseAdmin()

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitations")
      .select("id, email")
      .eq("token_hash", tokenHash)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()

    if (invitationError) {
      console.error("Could not validate invitation", invitationError)
      return NextResponse.json({ error: "No pudimos validar la invitación" }, { status: 500 })
    }

    if (!invitation) {
      return NextResponse.json({ error: "La invitación es inválida o venció" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        country: country || null,
      },
    })

    if (authError || !authData.user) {
      console.error("Could not create invited user", authError)
      return NextResponse.json({ error: "No pudimos crear la cuenta" }, { status: 500 })
    }

    const userId = authData.user.id
    const removeCreatedUser = async () => {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) console.error("Could not roll back invited user", error)
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName, ...(country ? { country } : {}) })
      .eq("id", userId)

    if (profileError) {
      console.error("Could not complete invited profile", profileError)
      await removeCreatedUser()
      return NextResponse.json({ error: "No pudimos completar la cuenta" }, { status: 500 })
    }

    const { data: accepted, error: acceptanceError } = await supabaseAdmin.rpc(
      "accept_invitation",
      {
        invitation_token_hash: tokenHash,
        invited_user_id: userId,
      }
    )

    if (acceptanceError || !accepted) {
      console.error("Could not atomically accept invitation", acceptanceError)
      await removeCreatedUser()
      return NextResponse.json(
        { error: "La invitación ya fue usada o venció. Pedí una nueva." },
        { status: 409 }
      )
    }

    return NextResponse.json({ success: true, message: "Cuenta creada correctamente" })
  } catch (error) {
    console.error("Unexpected accept-invitation error", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
