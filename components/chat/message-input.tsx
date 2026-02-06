"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { toast } from "sonner"

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("direct_messages") as any)
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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        id="chat-message"
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe tu mensaje..."
        aria-label="Escribe tu mensaje"
        className="flex-1 min-h-[80px] resize-none"
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
        className="btn-gradient"
        size="icon"
        aria-label="Enviar mensaje"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
