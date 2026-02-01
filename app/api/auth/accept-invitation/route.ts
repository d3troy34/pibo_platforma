import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Invitation } from "@/types/database"

export async function POST(request: NextRequest) {
  try {
    const { token, fullName, password } = await request.json()

    if (!token || !fullName || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contrasena debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Find the invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: "Invitacion invalida o expirada" },
        { status: 400 }
      )
    }

    const typedInvitation = invitation as Invitation

    // Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: typedInvitation.email,
      password,
      email_confirm: true, // Auto-confirm email since we invited them
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) {
      console.error("Error creating user:", authError)
      return NextResponse.json(
        { error: "Error al crear la cuenta" },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Update profile with full name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("profiles") as any)
      .update({
        full_name: fullName,
      })
      .eq("id", userId)

    // Create enrollment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: enrollmentError } = await (supabaseAdmin.from("enrollments") as any)
      .insert({
        user_id: userId,
        payment_provider: "manual",
        payment_status: "completed",
        payment_method: "invitation",
        amount_usd: 0,
        currency: "USD",
        enrolled_at: new Date().toISOString(),
      })

    if (enrollmentError) {
      console.error("Error creating enrollment:", enrollmentError)
      // Continue anyway since the user was created
    }

    // Mark invitation as accepted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from("invitations") as any)
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq("id", typedInvitation.id)

    return NextResponse.json({
      success: true,
      message: "Cuenta creada correctamente",
    })
  } catch (error) {
    console.error("Error in accept-invitation API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
