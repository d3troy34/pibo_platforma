import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import type { DirectMessageWithSender } from "@/types/database"

export const dynamic = "force-dynamic"

async function getMessages(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("direct_messages")
    .select(`
      *,
      sender:profiles(
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any as DirectMessageWithSender[]) || []
}

export default async function MensajesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const messages = await getMessages(user.id)

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mensajes</h1>
        <p className="text-muted-foreground">
          Conversa directamente con el instructor
        </p>
      </div>

      <Card className="h-[calc(100vh-16rem)]">
        <CardHeader>
          <CardTitle>Chat con el Instructor</CardTitle>
          <CardDescription>
            Haz preguntas sobre el curso o el contenido
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100%-5rem)]">
          <div className="flex-1 overflow-y-auto mb-4 border rounded-lg bg-background">
            <MessageList messages={messages} currentUserId={user.id} />
          </div>
          <MessageInput studentId={user.id} onMessageSent={() => {}} />
        </CardContent>
      </Card>
    </div>
  )
}
