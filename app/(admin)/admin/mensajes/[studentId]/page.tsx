import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import type { DirectMessageWithSender } from "@/types/database"

export const dynamic = "force-dynamic"

async function getMessages(studentId: string) {
  try {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("direct_messages") as any)
      .select(`
        *,
        sender:profiles!sender_id(
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq("student_id", studentId)
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

async function getStudentProfile(studentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", studentId)
    .single()

  if (error) {
    console.error("Error fetching student profile:", error)
    return null
  }

  return data
}

export default async function AdminStudentChatPage({
  params,
}: {
  params: { studentId: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/curso")
  }

  const studentId = params.studentId
  const student = await getStudentProfile(studentId)
  const messages = await getMessages(studentId)

  if (!student) {
    redirect("/admin/mensajes")
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/mensajes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Chat con {student.full_name || "Estudiante"}
          </h1>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
      </div>

      <Card className="h-[calc(100vh-16rem)]">
        <CardHeader>
          <CardTitle>Conversación</CardTitle>
          <CardDescription>
            Mensajes con {student.full_name || "este estudiante"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100%-5rem)]">
          <div className="flex-1 overflow-y-auto mb-4 border rounded-lg bg-background">
            <MessageList messages={messages} currentUserId={user.id} />
          </div>
          <MessageInput studentId={studentId} />
        </CardContent>
      </Card>
    </div>
  )
}
