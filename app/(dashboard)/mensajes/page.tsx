import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaidAccessRequired } from "@/components/paywall/paid-access-required"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import type { DirectMessageWithSender } from "@/types/database"

export const dynamic = "force-dynamic"

async function getMessages(userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("direct_messages")
      .select(`
        *,
        sender:profiles!sender_id(
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

    return (data as DirectMessageWithSender[]) || []
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
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat con el Instructor</h1>
        <p className="text-sm text-muted-foreground">
          Haz preguntas sobre el curso o el contenido
        </p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-t-xl border border-b-0 bg-background">
        <MessageList messages={messages} currentUserId={user.id} studentId={user.id} />
      </div>

      <div className="border rounded-b-xl bg-background p-3">
        <MessageInput studentId={user.id} />
      </div>
    </div>
  )
}
