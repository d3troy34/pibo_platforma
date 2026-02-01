import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: Pick<Profile, "role"> | null }

    if (profile?.role === "admin") {
      redirect("/admin")
    }
    redirect("/curso")
  }

  redirect("/login")
}
