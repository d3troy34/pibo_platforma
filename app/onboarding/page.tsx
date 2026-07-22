import { redirect } from "next/navigation"

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Armemos tu camino",
  description: "Personaliza tu experiencia en Pibo",
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?redirect=/onboarding")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, country, goal, target_university, target_arrival_date, onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin") redirect("/admin")
  if (profile?.onboarding_completed_at) redirect("/curso")

  return <OnboardingFlow profile={profile} />
}
