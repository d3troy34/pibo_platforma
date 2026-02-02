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
    <div className="flex flex-col p-4">
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
                    <AvatarImage src={msg.sender.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials(msg.sender.full_name)}
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
                  {msg.sender.full_name || "Instructor"}
                </span>
              )}

              <div
                className={cn(
                  "px-3 py-2 text-sm",
                  isOwnMessage
                    ? "bg-primary text-white rounded-2xl rounded-br-sm"
                    : "bg-secondary rounded-2xl rounded-bl-sm"
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
