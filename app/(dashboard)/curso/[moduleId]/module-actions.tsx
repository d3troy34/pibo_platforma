"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface ModuleActionsProps {
  moduleId: string
  isCompleted: boolean
  initialProgress: number
}

export function ModuleActions({
  moduleId,
  isCompleted: initialIsCompleted,
}: ModuleActionsProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Save progress to database
  const saveProgress = useCallback(
    async (seconds: number, duration: number) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const completed = duration > 0 && seconds / duration >= 0.9

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("module_progress") as any).upsert(
          {
            user_id: user.id,
            module_id: moduleId,
            progress_seconds: Math.floor(seconds),
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            last_watched_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,module_id",
          }
        )

        if (completed && !isCompleted) {
          setIsCompleted(true)
          toast.success("Modulo completado!")
          router.refresh()
        }
      } catch (error) {
        console.error("Error saving progress:", error)
      }
    },
    [moduleId, supabase, isCompleted, router]
  )

  // Handle manual mark as complete
  const handleMarkComplete = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("module_progress") as any).upsert(
        {
          user_id: user.id,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,module_id",
        }
      )

      setIsCompleted(true)
      toast.success("Modulo marcado como completado!")
      router.refresh()
    } catch {
      toast.error("Error al marcar el modulo como completado")
    } finally {
      setIsLoading(false)
    }
  }

  // Listen for video progress updates from VideoPlayer
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent<{ seconds: number; duration: number }>) => {
      saveProgress(event.detail.seconds, event.detail.duration)
    }

    window.addEventListener(
      `video-progress-${moduleId}`,
      handleProgressUpdate as EventListener
    )

    return () => {
      window.removeEventListener(
        `video-progress-${moduleId}`,
        handleProgressUpdate as EventListener
      )
    }
  }, [moduleId, saveProgress])

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isCompleted ? (
          <span className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            Modulo completado
          </span>
        ) : (
          <span>Progreso guardado automaticamente</span>
        )}
      </div>

      {!isCompleted && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkComplete}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Marcar como completado
        </Button>
      )}
    </div>
  )
}
