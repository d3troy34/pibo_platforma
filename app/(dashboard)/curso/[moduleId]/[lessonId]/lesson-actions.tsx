"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface LessonActionsProps {
  lessonId: string
  isCompleted: boolean
  initialProgress: number
}

export function LessonActions({
  lessonId,
  isCompleted: initialIsCompleted,
}: LessonActionsProps) {
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
        await (supabase.from("lesson_progress") as any).upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            progress_seconds: Math.floor(seconds),
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            last_watched_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,lesson_id",
          }
        )

        if (completed && !isCompleted) {
          setIsCompleted(true)
          toast.success("Leccion completada!")
          router.refresh()
        }
      } catch (error) {
        console.error("Error saving progress:", error)
      }
    },
    [lessonId, supabase, isCompleted, router]
  )

  // Handle manual mark as complete
  const handleMarkComplete = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("lesson_progress") as any).upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          last_watched_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,lesson_id",
        }
      )

      setIsCompleted(true)
      toast.success("Leccion marcada como completada!")
      router.refresh()
    } catch {
      toast.error("Error al marcar la leccion como completada")
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
      `video-progress-${lessonId}`,
      handleProgressUpdate as EventListener
    )

    return () => {
      window.removeEventListener(
        `video-progress-${lessonId}`,
        handleProgressUpdate as EventListener
      )
    }
  }, [lessonId, saveProgress])

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isCompleted ? (
          <span className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            Leccion completada
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
          Marcar como completada
        </Button>
      )}
    </div>
  )
}
