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

        const { error } = await supabase.from("module_progress").upsert(
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

        if (error) throw error

        if (completed && !isCompleted) {
          setIsCompleted(true)
          toast.success("¡Clase completada!")
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

      const { error } = await supabase.from("module_progress").upsert(
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

      if (error) throw error

      setIsCompleted(true)
      toast.success("Clase marcada como completa")
      router.refresh()
    } catch {
      toast.error("No pudimos marcar la clase")
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
    <div className="flex flex-col gap-3 rounded-[1.25rem] border border-ink/10 bg-white/75 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isCompleted ? (
          <span className="flex items-center gap-2 font-semibold text-indigo">
            <CheckCircle2 className="h-5 w-5" />
            Clase completada
          </span>
        ) : (
          <span>Guardamos tu avance automáticamente</span>
        )}
      </div>

      {!isCompleted && (
        <Button
          variant="ghost"
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
          Marcar como completa
        </Button>
      )}
    </div>
  )
}
