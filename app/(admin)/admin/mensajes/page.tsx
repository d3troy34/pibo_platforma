import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminConversationList } from "@/components/chat/admin-conversation-list"

export const dynamic = "force-dynamic"

const CONVERSATIONS_PER_PAGE = 50
const MAX_INBOX_PAGE = 20_000

function parsePage(value: string | string[] | undefined): number {
  const candidate = Array.isArray(value) ? value[0] : value
  const page = Number.parseInt(candidate || "1", 10)

  if (!Number.isSafeInteger(page) || page < 1) return 1

  return Math.min(page, MAX_INBOX_PAGE)
}

export default async function AdminMensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
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

  const page = parsePage((await searchParams).page)
  const { data, error } = await supabase.rpc(
    "get_admin_conversation_summaries",
    {
      page_limit: CONVERSATIONS_PER_PAGE + 1,
      page_offset: (page - 1) * CONVERSATIONS_PER_PAGE,
    }
  )

  if (error) {
    console.error("Error fetching conversation summaries:", error)
    throw new Error("No se pudo cargar la bandeja de mensajes.")
  }

  const rows = data || []

  if (page > 1 && rows.length === 0) {
    redirect("/admin/mensajes")
  }

  const hasNextPage = rows.length > CONVERSATIONS_PER_PAGE
  const conversations = rows.slice(0, CONVERSATIONS_PER_PAGE)

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mensajes de Estudiantes</h1>
        <p className="text-muted-foreground">
          Administra las conversaciones con tus estudiantes
        </p>
      </div>

      <AdminConversationList
        conversations={conversations}
        page={page}
        hasNextPage={hasNextPage}
      />
    </div>
  )
}
