"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface MarkAsAnsweredButtonProps {
  postId: string
}

export function MarkAsAnsweredButton({ postId }: MarkAsAnsweredButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleMarkAsAnswered = async () => {
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("forum_posts") as any)
        .update({ is_answered: true })
        .eq("id", postId)

      if (error) throw error

      toast.success("Pregunta marcada como respondida")
      router.refresh()
    } catch {
      toast.error("Error al marcar como respondida")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkAsAnswered}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Marcar como Respondida
    </Button>
  )
}
