import { createClient } from "@/lib/supabase/server"
import { ModuleCard } from "@/components/dashboard/module-card"
import type { Module, Lesson, LessonProgress } from "@/types/database"

export const metadata = {
  title: "Mi Curso",
  description: "Accede a todos los modulos del curso",
}

export default async function CoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all published modules
  const { data: modulesData } = await supabase
    .from("modules")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const modules = modulesData as Module[] | null

  // Get lessons count per module
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("id, module_id")
    .eq("is_published", true)

  const lessons = lessonsData as Pick<Lesson, "id" | "module_id">[] | null

  // Get user progress
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("user_id", user!.id)
    .eq("completed", true)

  const progress = progressData as Pick<LessonProgress, "lesson_id" | "completed">[] | null

  const completedLessonIds = new Set(progress?.map((p) => p.lesson_id) || [])

  // Calculate progress per module
  const moduleStats = modules?.map((module) => {
    const moduleLessons = lessons?.filter((l) => l.module_id === module.id) || []
    const completedLessons = moduleLessons.filter((l) =>
      completedLessonIds.has(l.id)
    )
    return {
      module,
      lessonCount: moduleLessons.length,
      completedLessons: completedLessons.length,
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mi Curso</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido de vuelta! Continua donde lo dejaste.
        </p>
      </div>

      {/* Modules Grid */}
      {moduleStats && moduleStats.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {moduleStats.map(({ module, lessonCount, completedLessons }) => (
            <ModuleCard
              key={module.id}
              module={module}
              lessonCount={lessonCount}
              completedLessons={completedLessons}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay modulos disponibles en este momento.
          </p>
        </div>
      )}
    </div>
  )
}
