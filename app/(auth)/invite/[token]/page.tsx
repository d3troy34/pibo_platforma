import { notFound } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Invitation } from "@/types/database"

export const metadata = {
  title: "Aceptar Invitacion",
  description: "Completa tu registro para acceder al curso",
}

interface InvitePageProps {
  params: { token: string }
}

export default async function InvitePage({ params }: InvitePageProps) {
  // Use admin client to bypass RLS for invitation verification
  const { data: invitation, error } = await supabaseAdmin
    .from("invitations")
    .select("*")
    .eq("token", params.token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !invitation) {
    notFound()
  }

  const typedInvitation = invitation as Invitation

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">
          Has sido invitado a unirte a Mipibo
        </p>
      </div>
      <RegisterForm
        invitationEmail={typedInvitation.email}
        invitationToken={params.token}
      />
    </div>
  )
}
