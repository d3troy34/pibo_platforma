import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin") redirect("/admin")
  redirect(profile?.onboarding_completed_at ? "/curso" : "/onboarding")
}
