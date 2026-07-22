import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaidAccessRequired } from "@/components/paywall/paid-access-required"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"

export const dynamic = "force-dynamic"

async function getMessages(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("direct_messages")
      .select(`
        *,
        sender:profile_directory!sender_id(
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq("student_id", userId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

export default async function MensajesPage() {
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
          title="Mensajes bloqueados"
          description="El chat con el instructor es parte del acceso completo al curso. Compra tu acceso para desbloquear todos los modulos y soporte."
        />
      )
    }
  }

  const messages = await getMessages(user.id)

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
      <div className="mb-7 border-b border-ink/10 pb-6">
        <p className="eyebrow mb-3">Acompañamiento</p>
        <h1 className="display-title text-4xl sm:text-5xl">No tenés que resolver todo solo.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Escribinos tus dudas sobre las clases o tu proceso. Te respondemos por acá.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-t-[2rem] border border-b-0 border-ink/10 bg-white/70">
        <MessageList messages={messages} currentUserId={user.id} studentId={user.id} />
      </div>

      <div className="rounded-b-[2rem] border border-ink/10 bg-white/90 p-4">
        <MessageInput studentId={user.id} />
      </div>
    </div>
  )
}
