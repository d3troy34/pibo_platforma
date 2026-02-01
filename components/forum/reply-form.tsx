"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface ReplyFormProps {
  postId: string
  isAdmin: boolean
}

export function ReplyForm({ postId, isAdmin }: ReplyFormProps) {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (content.trim().length < 5) {
      toast.error("La respuesta debe tener al menos 5 caracteres")
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("forum_replies") as any).insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        is_admin_reply: isAdmin,
      })

      if (error) throw error

      toast.success("Respuesta publicada")
      setContent("")
      router.refresh()
    } catch {
      toast.error("Error al publicar la respuesta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Escribe tu respuesta aqui..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || content.trim().length < 5}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publicar Respuesta
        </Button>
      </div>
    </form>
  )
}
