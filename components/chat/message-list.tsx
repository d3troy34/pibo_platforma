"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { DirectMessageWithSender } from "@/types/database"

interface MessageListProps {
  messages: DirectMessageWithSender[]
  currentUserId: string
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

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-muted-foreground">
          No hay mensajes aún. ¡Envía el primero!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((msg) => {
        const isOwnMessage = msg.sender_id === currentUserId
        const isAdmin = msg.sender.role === "admin"

        return (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              isOwnMessage ? "flex-row-reverse" : "flex-row"
            )}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={msg.sender.avatar_url || undefined} />
              <AvatarFallback className={cn(
                isAdmin ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
              )}>
                {getInitials(msg.sender.full_name)}
              </AvatarFallback>
            </Avatar>

            <div
              className={cn(
                "flex flex-col gap-1 max-w-[70%]",
                isOwnMessage ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {msg.sender.full_name || "Usuario"}
                </span>
                {isAdmin && (
                  <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                    Admin
                  </span>
                )}
              </div>

              <div
                className={cn(
                  "rounded-lg px-4 py-2 text-sm",
                  isOwnMessage
                    ? "bg-primary text-white"
                    : isAdmin
                    ? "bg-accent/10 border border-accent/20"
                    : "bg-secondary"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
              </div>

              <span className="text-xs text-muted-foreground">
                {format(new Date(msg.created_at), "d MMM, HH:mm", { locale: es })}
              </span>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
