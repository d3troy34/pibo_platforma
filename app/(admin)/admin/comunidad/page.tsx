import { CommunityChat } from "@/components/chat/community-chat"
import { createClient } from "@/lib/supabase/server"
import type { CommunityMessageWithSender } from "@/types/database"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminComunidadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The admin layout already verifies the role. This fallback keeps the page
  // safe if it is ever moved to another layout.
  if (!user) redirect("/login")

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

  if (error) console.error("Error fetching community messages:", error)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 border-b border-ink/10 pb-6">
        <p className="eyebrow mb-3">Comunidad Pibo</p>
        <h1 className="display-title text-4xl sm:text-5xl">Sala general</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Acompañá la conversación y eliminá contenido que no corresponda.
        </p>
      </div>
      <CommunityChat
        initialMessages={[...(data || [])].reverse() as CommunityMessageWithSender[]}
        currentUserId={user.id}
        canModerate
      />
    </div>
  )
}
