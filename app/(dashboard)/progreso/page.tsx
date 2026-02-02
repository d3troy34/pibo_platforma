import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, BookOpen, Trophy } from "lucide-react"
import type { Module, ModuleProgress } from "@/types/database"

export const metadata = {
  title: "Mi Progreso",
  description: "Revisa tu progreso en el curso",
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all published modules
  const { data: modulesData } = await supabase
    .from("modules")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const modules = modulesData as Module[] | null

  // Get all module progress
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progressData } = await (supabase.from("module_progress") as any)
    .select("*")
    .eq("user_id", user!.id)

  const progress = progressData as ModuleProgress[] | null

  const progressMap = new Map(progress?.map((p) => [p.module_id, p]) || [])

  // Calculate stats
  const totalModules = modules?.length || 0
  const completedModules = progress?.filter((p) => p.completed).length || 0
  const inProgressModules = progress?.filter((p) => !p.completed && p.progress_seconds > 0).length || 0
  const totalProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  // Calculate total time watched
  const totalSecondsWatched = progress?.reduce((acc, p) => acc + (p.progress_seconds || 0), 0) || 0
  const hoursWatched = Math.floor(totalSecondsWatched / 3600)
  const minutesWatched = Math.floor((totalSecondsWatched % 3600) / 60)

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
              Modulos Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <div>
                <p className="text-3xl font-bold">{completedModules}</p>
                <p className="text-sm text-muted-foreground">de {totalModules}</p>
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
                <p className="text-3xl font-bold">{inProgressModules}</p>
                <p className="text-sm text-muted-foreground">modulos</p>
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
            <span>{completedModules} modulos completados</span>
            <span>{totalModules - completedModules} restantes</span>
          </div>
        </CardContent>
      </Card>

      {/* Module Progress */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Progreso por Modulo</h2>
        <div className="space-y-3">
          {modules?.map((module) => {
            const mp = progressMap.get(module.id)
            const isModuleCompleted = mp?.completed || false
            return (
              <Card key={module.id} className="border-border/50 bg-card/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{module.title}</h3>
                    <div className="flex items-center gap-2">
                      {isModuleCompleted ? (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completado
                        </Badge>
                      ) : mp?.progress_seconds ? (
                        <span className="text-sm text-muted-foreground">
                          En progreso
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sin comenzar
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress value={isModuleCompleted ? 100 : 0} className="h-2" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
