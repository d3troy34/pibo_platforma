import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaidAccessRequired } from "@/components/paywall/paid-access-required"
import ProfileClient from "./profile-client"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Paid-only section (admins bypass).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  if (!isAdmin) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .single()

    if (!enrollment) {
      return (
        <PaidAccessRequired
          title="Perfil bloqueado"
          description="Tu perfil y configuraciones se habilitan con el acceso completo. Compra tu acceso para desbloquear todas las secciones."
        />
      )
    }
  }

  return <ProfileClient />
}
