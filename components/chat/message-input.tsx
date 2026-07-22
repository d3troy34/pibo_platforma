"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { toast } from "sonner"
import type { DirectMessageWithSender } from "@/types/database"

interface MessageInputProps {
  studentId: string
  onMessageSent?: () => void
}

export function MessageInput({ studentId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setIsSending(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Debes iniciar sesión")
        return
      }

      const { data, error } = await supabase.from("direct_messages")
        .insert({
          student_id: studentId,
          sender_id: user.id,
          message: trimmedMessage,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }

      if (!data) {
        console.error("No data returned from insert - RLS may be blocking")
        throw new Error("Message was not saved")
      }

      const { data: sender } = await supabase
        .from("profile_directory")
        .select("id, full_name, avatar_url, role")
        .eq("id", user.id)
        .single()

      const localMessage: DirectMessageWithSender = {
        ...data,
        sender: sender || {
          id: user.id,
          full_name: "Vos",
          avatar_url: null,
          role: "student",
        },
      }

      window.dispatchEvent(
        new CustomEvent(`message-created-${studentId}`, { detail: localMessage })
      )
      setMessage("")
      onMessageSent?.()
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Error al enviar el mensaje")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <Textarea
        id="chat-message"
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribí tu mensaje..."
        aria-label="Escribí tu mensaje"
        className="min-h-[64px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        disabled={isSending}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
        }}
      />
      <Button
        type="submit"
        disabled={isSending || !message.trim()}
        className="mb-1 shrink-0 rounded-full"
        size="icon"
        aria-label="Enviar mensaje"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
