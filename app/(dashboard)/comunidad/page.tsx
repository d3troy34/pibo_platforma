import { redirect } from "next/navigation"

import { CommunityChat } from "@/components/chat/community-chat"
import { PaidAccessRequired } from "@/components/paywall/paid-access-required"
import { createClient } from "@/lib/supabase/server"
import type { CommunityMessageWithSender } from "@/types/database"

export const dynamic = "force-dynamic"

async function getCommunityMessages() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("community_messages")
    .select(`
      *,
      sender:profile_directory!sender_id(
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(300)

  if (error) {
    console.error("Error fetching community messages:", error)
    return []
  }

  return [...(data || [])].reverse() as CommunityMessageWithSender[]
}

export default async function ComunidadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { data: enrollment }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .maybeSingle(),
  ])

  const isAdmin = profile?.role === "admin"
  if (!isAdmin && !enrollment) {
    return (
      <PaidAccessRequired
        title="Comunidad bloqueada"
        description="La comunidad es parte del acceso completo al curso. Activá tu inscripción para participar."
      />
    )
  }

  const messages = await getCommunityMessages()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 border-b border-ink/10 pb-6">
        <p className="eyebrow mb-3">Comunidad Pibo</p>
        <h1 className="display-title text-4xl sm:text-5xl">No estás haciendo este camino sola.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Una sala para compartir dudas, avances y recursos con quienes también están preparando su llegada.
        </p>
      </div>
      <CommunityChat
        initialMessages={messages}
        currentUserId={user.id}
        canModerate={isAdmin}
      />
    </div>
  )
}
