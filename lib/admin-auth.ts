import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"

export async function getAuthenticatedAdminId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: Pick<Profile, "role"> | null }

  return profile?.role === "admin" ? user.id : null
}
