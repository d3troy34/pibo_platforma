import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, FileText, Download, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { VideoPlayer } from "@/components/video/video-player"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleActions } from "./module-actions"
import type { Module, ModuleProgress, LessonResource } from "@/types/database"

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

  let progress: ModuleProgress | null = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: progressData } = await (supabase.from("module_progress") as any)
      .select("*")
      .eq("user_id", user!.id)
      .eq("module_id", params.moduleId)
      .single()
    progress = progressData as ModuleProgress | null
  } catch {
    // table may not exist yet
  }

  const resources = (courseModule.resources as LessonResource[]) || []

  // Get all modules for navigation
  const { data: allModulesData } = await supabase
    .from("modules")
    .select("id, title, order_index")
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const allModules = allModulesData as Pick<Module, "id" | "title" | "order_index">[] | null

  const currentIndex = allModules?.findIndex((m) => m.id === params.moduleId) ?? -1
  const prevModule = currentIndex > 0 ? allModules?.[currentIndex - 1] : null
  const nextModule = currentIndex < (allModules?.length ?? 0) - 1 ? allModules?.[currentIndex + 1] : null

  return (
    <div className="space-y-6">
      <Link href="/curso">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al curso
        </Button>
      </Link>

      {/* Video Player */}
      {courseModule.bunny_video_guid ? (
        <div className="space-y-4">
          <VideoPlayer
            videoGuid={courseModule.bunny_video_guid}
            moduleId={params.moduleId}
            initialProgress={progress?.progress_seconds || 0}
          />
          <ModuleActions
            moduleId={params.moduleId}
            isCompleted={progress?.completed || false}
            initialProgress={progress?.progress_seconds || 0}
          />
        </div>
      ) : (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Este modulo aun no tiene video disponible
            </p>
          </CardContent>
        </Card>
      )}

      {/* Module Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{courseModule.title}</h1>
            {courseModule.description && (
              <p className="text-muted-foreground mt-2">{courseModule.description}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {prevModule ? (
              <Link href={`/curso/${prevModule.id}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextModule ? (
              <Link href={`/curso/${nextModule.id}`}>
                <Button className="gap-2 btn-gradient text-primary-foreground">
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/curso">
                <Button className="gap-2 btn-gradient text-primary-foreground">
                  Completar curso
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {resources.length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recursos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <span className="text-sm truncate">{resource.name}</span>
                    <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Other modules */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Otros modulos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-80 overflow-y-auto">
              {allModules?.map((m, index) => (
                <Link
                  key={m.id}
                  href={`/curso/${m.id}`}
                  className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                    m.id === params.moduleId
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary text-xs shrink-0">
                    {index + 1}
                  </span>
                  <span className="truncate">{m.title}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
