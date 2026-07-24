"use client"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { appendCommunityMessageUnlessDeleted } from "@/lib/community-chat-state"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { CommunityMessage, CommunityMessageWithSender } from "@/types/database"

interface CommunityChatProps {
  initialMessages: CommunityMessageWithSender[]
  currentUserId: string
  canModerate: boolean
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

function fallbackSender(senderId: string): CommunityMessageWithSender["sender"] {
  return {
    id: senderId,
    full_name: null,
    avatar_url: null,
    role: "student",
  }
}

export function CommunityChat({ initialMessages, currentUserId, canModerate }: CommunityChatProps) {
  const [messages, setMessages] = useState<CommunityMessageWithSender[]>(initialMessages)
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deletedMessageIdsRef = useRef(new Set<string>())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(initialMessages.filter(
      (item) => !deletedMessageIdsRef.current.has(item.id)
    ))
  }, [initialMessages])

  useEffect(() => {
    const supabase = createClient()

    const loadSender = async (senderId: string) => {
      const { data } = await supabase
        .from("profile_directory")
        .select("id, full_name, avatar_url, role")
        .eq("id", senderId)
        .single()

      return data || fallbackSender(senderId)
    }

    const channel = supabase
      .channel("community-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        async (payload: { new: CommunityMessage }) => {
          const sender = await loadSender(payload.new.sender_id)
          const incoming = { ...payload.new, sender } as CommunityMessageWithSender

          setMessages((current) => appendCommunityMessageUnlessDeleted(
            current,
            incoming,
            deletedMessageIdsRef.current
          ))
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_messages" },
        (payload: { old: Partial<CommunityMessage> }) => {
          if (!payload.old.id) return
          deletedMessageIdsRef.current.add(payload.old.id)
          setMessages((current) => current.filter((item) => item.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setIsSending(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("community_messages")
        .insert({ sender_id: currentUserId, message: trimmedMessage })
        .select()
        .single()

      if (error || !data) throw error || new Error("Message was not saved")

      const { data: sender } = await supabase
        .from("profile_directory")
        .select("id, full_name, avatar_url, role")
        .eq("id", currentUserId)
        .single()

      const localMessage = {
        ...data,
        sender: sender || fallbackSender(currentUserId),
      } as CommunityMessageWithSender

      setMessages((current) => appendCommunityMessageUnlessDeleted(
        current,
        localMessage,
        deletedMessageIdsRef.current
      ))
      setMessage("")
    } catch (error) {
      console.error("Error sending community message:", error)
      toast.error("No pudimos enviar tu mensaje")
    } finally {
      setIsSending(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    setDeletingId(messageId)
    try {
      const { error } = await createClient()
        .from("community_messages")
        .delete()
        .eq("id", messageId)

      if (error) throw error
      deletedMessageIdsRef.current.add(messageId)
      setMessages((current) => current.filter((item) => item.id !== messageId))
    } catch (error) {
      console.error("Error deleting community message:", error)
      toast.error("No pudimos eliminar el mensaje")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-[34rem] flex-col overflow-hidden rounded-[2rem] border border-ink/10 bg-white/80">
      <div className="flex-1 overflow-y-auto p-5 sm:p-7">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-display text-2xl text-ink">Abrimos la conversación.</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Presentate, compartí una duda o ayudá a alguien que está recorriendo el mismo camino.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((item) => {
              const isOwnMessage = item.sender_id === currentUserId
              return (
                <div
                  key={item.id}
                  className={cn("group flex gap-3", isOwnMessage && "flex-row-reverse")}
                >
                  <Avatar className="h-9 w-9 shrink-0 border border-ink/10">
                    <AvatarImage src={item.sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-xs text-primary">
                      {getInitials(item.sender?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("min-w-0 max-w-[80%]", isOwnMessage && "items-end text-right")}>
                    <div className={cn("mb-1 flex items-center gap-2 text-xs text-muted-foreground", isOwnMessage && "justify-end")}>
                      <span className="font-semibold text-ink">{item.sender?.full_name || "Miembro Pibo"}</span>
                      <span>{format(new Date(item.created_at), "d MMM, HH:mm", { locale: es })}</span>
                    </div>
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-6",
                      isOwnMessage ? "rounded-tr-sm bg-indigo text-white" : "rounded-tl-sm bg-paper text-ink"
                    )}>
                      <p className="whitespace-pre-wrap break-words">{item.message}</p>
                    </div>
                    {canModerate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 px-2 text-xs text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={() => void deleteMessage(item.id)}
                        disabled={deletingId === item.id}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-3 border-t border-ink/10 bg-white/90 p-4">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Sumá algo a la conversación..."
          aria-label="Mensaje para la comunidad"
          maxLength={2000}
          className="min-h-[64px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          disabled={isSending}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void handleSubmit(event)
            }
          }}
        />
        <Button
          type="submit"
          disabled={isSending || !message.trim()}
          className="mb-1 shrink-0 rounded-full"
          size="icon"
          aria-label="Enviar mensaje a la comunidad"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
