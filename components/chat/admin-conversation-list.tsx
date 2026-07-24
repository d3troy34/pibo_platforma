"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import type { AdminConversationSummary } from "@/types/database"

interface AdminConversationListProps {
  conversations: AdminConversationSummary[]
  page: number
  hasNextPage: boolean
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AdminConversationList({
  conversations,
  page,
  hasNextPage,
}: AdminConversationListProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined

    const refreshInbox = () => {
      // A short debounce collapses a message INSERT and its immediate read_at
      // UPDATE into one refresh while still keeping the inbox live.
      if (refreshTimeout) clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(() => {
        // Activity changes invalidate offset-based pages. Return to the newest
        // page so a conversation cannot be duplicated or skipped after moving.
        if (page > 1) {
          router.replace("/admin/mensajes", { scroll: false })
          return
        }

        router.refresh()
      }, 150)
    }

    const channel = supabase
      .channel("admin-direct-message-inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        refreshInbox
      )
      .subscribe()

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout)
      void supabase.removeChannel(channel)
    }
  }, [page, router])

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No hay conversaciones aún</p>
          <p className="text-sm text-muted-foreground">
            Los mensajes de los estudiantes aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversaciones recientes</CardTitle>
        <CardDescription>
          Página {page} · {conversations.length} estudiante(s) con mensajes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="space-y-4">
            {conversations.map((conversation, index) => (
              <div key={conversation.student_id}>
                <Link
                  href={`/admin/mensajes/${conversation.student_id}`}
                  className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-secondary/50"
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={conversation.student_avatar || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(conversation.student_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-semibold">{conversation.student_name}</p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="bg-accent">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {conversation.last_message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(conversation.last_message_time).toLocaleString("es-AR", {
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
      {(page > 1 || hasNextPage) && (
        <CardFooter
          className="justify-between border-t border-border/80 pt-6"
          role="navigation"
          aria-label="Paginación de conversaciones"
        >
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/mensajes?page=${page - 1}`}>
                <ChevronLeft />
                Anterior
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft />
              Anterior
            </Button>
          )}

          <span className="text-sm text-muted-foreground">Página {page}</span>

          {hasNextPage ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/mensajes?page=${page + 1}`}>
                Siguiente
                <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Siguiente
              <ChevronRight />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
