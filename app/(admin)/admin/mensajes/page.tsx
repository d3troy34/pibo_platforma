import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  AdminConversationList,
  type StudentConversation,
} from "@/components/chat/admin-conversation-list"

export const dynamic = "force-dynamic"

async function getStudentConversations(): Promise<StudentConversation[]> {
  const supabase = await createClient()

  // Get all students who have sent or received messages
  const { data: conversations, error } = await supabase.from("direct_messages")
    .select(`
      student_id,
      message,
      created_at,
      sender_id,
      read_at,
      student:profiles!student_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error || !conversations) {
    console.error("Error fetching conversations:", error)
    return []
  }

  // Group by student and get latest message for each
  const studentMap = new Map<string, StudentConversation>()

  for (const msg of conversations) {
    const studentId = msg.student_id
    if (!studentMap.has(studentId)) {
      const student = msg.student

      // Count unread messages from this student
      const unreadCount = conversations.filter(
        (message) =>
          message.student_id === studentId &&
          message.sender_id === studentId &&
          !message.read_at
      ).length

      studentMap.set(studentId, {
        student_id: studentId,
        student_name: student?.full_name || "Usuario",
        student_avatar: student?.avatar_url || null,
        last_message: msg.message,
        last_message_time: msg.created_at,
        unread_count: unreadCount,
      })
    }
  }

  return Array.from(studentMap.values())
}

export default async function AdminMensajesPage() {
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

  const conversations = await getStudentConversations()

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mensajes de Estudiantes</h1>
        <p className="text-muted-foreground">
          Administra las conversaciones con tus estudiantes
        </p>
      </div>

      <AdminConversationList conversations={conversations} />
    </div>
  )
}
