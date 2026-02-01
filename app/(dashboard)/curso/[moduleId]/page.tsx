import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { LessonCard } from "@/components/dashboard/lesson-card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { Module, Lesson, LessonProgress } from "@/types/database"

export async function generateMetadata({ params }: { params: { moduleId: string } }) {
  const supabase = await createClient()
  const { data: moduleData } = await supabase
    .from("modules")
    .select("title")
    .eq("id", params.moduleId)
    .single()

  const courseModule = moduleData as Pick<Module, "title"> | null

  return {
    title: courseModule?.title || "Modulo",
  }
}

interface ModulePageProps {
  params: { moduleId: string }
}

export default async function ModulePage({ params }: ModulePageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get module
  const { data: moduleData, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", params.moduleId)
    .eq("is_published", true)
    .single()

  const courseModule = moduleData as Module | null

  if (error || !courseModule) {
    notFound()
  }

  // Get lessons
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", params.moduleId)
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const lessons = lessonsData as Lesson[] | null

  // Get user progress for this module's lessons
  const lessonIds = lessons?.map((l) => l.id) || []
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user!.id)
    .in("lesson_id", lessonIds)

  const progress = progressData as LessonProgress[] | null

  const progressMap = new Map(progress?.map((p) => [p.lesson_id, p]) || [])
  const completedCount = progress?.filter((p) => p.completed).length || 0
  const totalLessons = lessons?.length || 0
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // Find first incomplete lesson
  const firstIncompleteLesson = lessons?.find(
    (l) => !progressMap.get(l.id)?.completed
  )

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/curso">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al curso
        </Button>
      </Link>

      {/* Module header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{courseModule.title}</h1>
          {courseModule.description && (
            <p className="text-muted-foreground mt-2">{courseModule.description}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-4">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-sm font-medium text-primary">
            {completedCount}/{totalLessons} completadas
          </span>
        </div>
      </div>

      {/* Lessons list */}
      {lessons && lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map((lesson, index) => {
            const lessonProgress = progressMap.get(lesson.id)
            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                moduleId={params.moduleId}
                index={index}
                isCompleted={lessonProgress?.completed || false}
                isCurrentLesson={firstIncompleteLesson?.id === lesson.id}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay lecciones disponibles en este modulo.
          </p>
        </div>
      )}
    </div>
  )
}
