"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DirectMessage, DirectMessageWithSender } from "@/types/database"

interface MessageListProps {
  messages: DirectMessageWithSender[]
  currentUserId: string
  studentId: string
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

export function MessageList({ messages: initialMessages, currentUserId, studentId }: MessageListProps) {
  const [messages, setMessages] = useState<DirectMessageWithSender[]>(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Sync with server-provided messages when they change (e.g. navigation)
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Show a locally sent message immediately. Realtime may arrive later and is
  // deduplicated by id, so the UI never depends on network propagation speed.
  useEffect(() => {
    const handleLocalMessage = (event: Event) => {
      const newMessage = (event as CustomEvent<DirectMessageWithSender>).detail
      setMessages((current) => {
        if (current.some((message) => message.id === newMessage.id)) return current
        return [...current, newMessage]
      })
    }

    window.addEventListener(`message-created-${studentId}`, handleLocalMessage)
    return () => window.removeEventListener(`message-created-${studentId}`, handleLocalMessage)
  }, [studentId])

  // Subscribe to real-time INSERT events on direct_messages
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `student_id=eq.${studentId}`,
        },
        async (payload: { new: DirectMessage }) => {
          // Read only the chat-safe directory, never the private profile table.
          const { data: sender } = await supabase
            .from('profile_directory')
            .select('id, full_name, avatar_url, role')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage = {
            ...payload.new,
            sender: sender || {
              id: payload.new.sender_id,
              full_name: null,
              avatar_url: null,
              role: 'student' as const,
            },
          } as DirectMessageWithSender

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="font-display text-2xl text-ink">Abrí la conversación.</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          No hay mensajes todavía. Contanos dónde estás trabado y te ayudamos a avanzar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-5 sm:p-7">
      {messages.map((msg, index) => {
        const isOwnMessage = msg.sender_id === currentUserId
        const prevMsg = index > 0 ? messages[index - 1] : null
        const isSameSenderAsPrev = prevMsg?.sender_id === msg.sender_id
        const showAvatar = !isOwnMessage && !isSameSenderAsPrev

        return (
          <div
            key={msg.id}
            className={cn(
              "flex",
              isOwnMessage ? "justify-end" : "justify-start",
              isSameSenderAsPrev ? "mt-1" : "mt-3",
              index === 0 && "mt-0"
            )}
          >
            {/* Avatar spacer for other person's messages */}
            {!isOwnMessage && (
              <div className="w-8 mr-2 flex-shrink-0">
                {showAvatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials(msg.sender?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}

            <div
              className={cn(
                "flex flex-col max-w-[75%]",
                isOwnMessage ? "items-end" : "items-start"
              )}
            >
              {/* Sender name — only for other person, first in group */}
              {!isOwnMessage && !isSameSenderAsPrev && (
                <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">
                  {msg.sender?.full_name || "Instructor"}
                </span>
              )}

              <div
                className={cn(
                  "px-3 py-2 text-sm",
                  isOwnMessage
                    ? "rounded-2xl rounded-br-sm bg-indigo text-white"
                    : "rounded-2xl rounded-bl-sm bg-paper text-ink"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
              </div>

              {/* Timestamp — show on last message in group or if next is different sender */}
              {(() => {
                const nextMsg = index < messages.length - 1 ? messages[index + 1] : null
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id
                if (!isLastInGroup) return null
                return (
                  <span className="text-[10px] text-muted-foreground mt-0.5 mx-1">
                    {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                  </span>
                )
              })()}
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
