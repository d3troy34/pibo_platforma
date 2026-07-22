import { createHash } from "crypto"
import { notFound } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export const metadata = {
  title: "Aceptar Invitacion",
  description: "Completa tu registro para acceder al curso",
}

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const { data: invitation, error } = await getSupabaseAdmin()
    .from("invitations")
    .select("email")
    .eq("token_hash", tokenHash)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !invitation) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">
          Has sido invitado a unirte a Mipibo
        </p>
      </div>
      <RegisterForm
        invitationEmail={invitation.email}
        invitationToken={token}
      />
    </div>
  )
}
