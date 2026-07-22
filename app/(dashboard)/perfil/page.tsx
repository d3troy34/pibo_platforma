import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { Enrollment, Profile } from "@/types/database"
import { ProfileClient } from "./profile-client"

export const metadata = {
  title: "Mi perfil",
  description: "Tus datos y tu objetivo en Pibo",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { data: enrollment }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .maybeSingle(),
  ])

  if (!profile) redirect("/onboarding")

  return (
    <ProfileClient
      initialProfile={profile as Profile}
      initialEnrollment={(enrollment as Enrollment | null) || null}
    />
  )
}
