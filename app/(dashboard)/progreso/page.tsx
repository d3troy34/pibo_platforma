import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, BookOpen, Trophy } from "lucide-react"
import type { Module, Lesson, LessonProgress } from "@/types/database"

export const metadata = {
  title: "Mi Progreso",
  description: "Revisa tu progreso en el curso",
}

type ModuleWithLessons = Module & { lessons: Lesson[] }

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all modules with lessons
  const { data: modulesData } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const modules = modulesData as ModuleWithLessons[] | null

  // Get all progress
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user!.id)

  const progress = progressData as LessonProgress[] | null

  const progressMap = new Map(progress?.map((p) => [p.lesson_id, p]) || [])

  // Calculate stats
  const allLessons = modules?.flatMap((m) => m.lessons) || []
  const publishedLessons = allLessons.filter((l) => l.is_published)
  const totalLessons = publishedLessons.length
  const completedLessons = progress?.filter((p) => p.completed).length || 0
  const inProgressLessons = progress?.filter((p) => !p.completed && p.progress_seconds > 0).length || 0
  const totalProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Calculate total time watched
  const totalSecondsWatched = progress?.reduce((acc, p) => acc + (p.progress_seconds || 0), 0) || 0
  const hoursWatched = Math.floor(totalSecondsWatched / 3600)
  const minutesWatched = Math.floor((totalSecondsWatched % 3600) / 60)

  // Module progress
  const moduleProgress = modules?.map((module) => {
    const moduleLessons = module.lessons?.filter((l) => l.is_published) || []
    const moduleCompleted = moduleLessons.filter((l) => progressMap.get(l.id)?.completed).length
    const percent = moduleLessons.length > 0 ? Math.round((moduleCompleted / moduleLessons.length) * 100) : 0
    return {
      id: module.id,
      title: module.title,
      totalLessons: moduleLessons.length,
      completedLessons: moduleCompleted,
      percent,
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mi Progreso</h1>
        <p className="text-muted-foreground mt-2">
          Revisa tu avance en el curso
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progreso Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalProgress}%</p>
                <p className="text-sm text-muted-foreground">completado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lecciones Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <div>
                <p className="text-3xl font-bold">{completedLessons}</p>
                <p className="text-sm text-muted-foreground">de {totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <BookOpen className="h-10 w-10 text-accent" />
              <div>
                <p className="text-3xl font-bold">{inProgressLessons}</p>
                <p className="text-sm text-muted-foreground">lecciones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo de Estudio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Clock className="h-10 w-10 text-primary" />
              <div>
                <p className="text-3xl font-bold">
                  {hoursWatched > 0 ? `${hoursWatched}h ` : ""}
                  {minutesWatched}m
                </p>
                <p className="text-sm text-muted-foreground">total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Progreso General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={totalProgress} className="h-4" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{completedLessons} lecciones completadas</span>
            <span>{totalLessons - completedLessons} restantes</span>
          </div>
        </CardContent>
      </Card>

      {/* Module Progress */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Progreso por Modulo</h2>
        <div className="space-y-3">
          {moduleProgress?.map((module) => (
            <Card key={module.id} className="border-border/50 bg-card/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{module.title}</h3>
                  <div className="flex items-center gap-2">
                    {module.percent === 100 ? (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {module.completedLessons}/{module.totalLessons}
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={module.percent} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
