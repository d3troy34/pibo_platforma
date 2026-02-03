import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface StudentConversation {
  student_id: string
  student_name: string
  student_avatar: string | null
  last_message: string
  last_message_time: string
  unread_count: number
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

async function getStudentConversations(): Promise<StudentConversation[]> {
  const supabase = await createClient()

  console.log("Admin: Fetching all conversations...")

  // Get all students who have sent or received messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: conversations, error } = await (supabase.from("direct_messages") as any)
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

  console.log("Admin conversations result:", { error, count: conversations?.length })

  if (error || !conversations) {
    console.error("Error fetching conversations:", error)
    return []
  }

  // Group by student and get latest message for each
  const studentMap = new Map<string, StudentConversation>()

  for (const msg of conversations) {
    const studentId = msg.student_id
    if (!studentMap.has(studentId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const student = msg.student as any

      // Count unread messages from this student
      const unreadCount = conversations.filter(
        (m) =>
          m.student_id === studentId &&
          m.sender_id === studentId &&
          !m.read_at
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

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay conversaciones aún</p>
            <p className="text-sm text-muted-foreground">
              Los mensajes de los estudiantes aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Conversaciones Activas</CardTitle>
            <CardDescription>
              {conversations.length} estudiante(s) con mensajes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-4">
                {conversations.map((conv, index) => (
                  <div key={conv.student_id}>
                    <Link
                      href={`/admin/mensajes/${conv.student_id}`}
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={conv.student_avatar || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(conv.student_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{conv.student_name}</p>
                          {conv.unread_count > 0 && (
                            <Badge variant="default" className="bg-accent">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conv.last_message_time).toLocaleString("es-AR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </Link>
                    {index < conversations.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
