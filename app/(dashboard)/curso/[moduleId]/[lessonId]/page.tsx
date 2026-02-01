import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, FileText, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { VideoPlayer } from "@/components/video/video-player"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LessonActions } from "./lesson-actions"
import type { Lesson, LessonProgress } from "@/types/database"

export async function generateMetadata({
  params,
}: {
  params: { moduleId: string; lessonId: string }
}) {
  const supabase = await createClient()
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title")
    .eq("id", params.lessonId)
    .single() as { data: Pick<Lesson, "title"> | null }

  return {
    title: lesson?.title || "Leccion",
  }
}

interface LessonPageProps {
  params: { moduleId: string; lessonId: string }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get lesson with module
  const { data: lessonData, error } = await supabase
    .from("lessons")
    .select("*, modules(*)")
    .eq("id", params.lessonId)
    .eq("module_id", params.moduleId)
    .eq("is_published", true)
    .single()

  const lesson = lessonData as (Lesson & { modules: { title: string } }) | null

  if (error || !lesson) {
    notFound()
  }

  // Get all lessons in this module for navigation
  const { data: allLessonsData } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("module_id", params.moduleId)
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const allLessons = allLessonsData as Pick<Lesson, "id" | "title" | "order_index">[] | null

  // Get user progress for this lesson
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user!.id)
    .eq("lesson_id", params.lessonId)
    .single()

  const progress = progressData as LessonProgress | null

  // Find prev/next lessons
  const currentIndex = allLessons?.findIndex((l) => l.id === params.lessonId) ?? -1
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons?.length ?? 0) - 1 ? allLessons?.[currentIndex + 1] : null

  const resources = lesson.resources as Array<{ name: string; url: string; type: string }> | null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/curso" className="hover:text-foreground transition-colors">
          Mi Curso
        </Link>
        <span>/</span>
        <Link
          href={`/curso/${params.moduleId}`}
          className="hover:text-foreground transition-colors"
        >
          {lesson.modules?.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">{lesson.title}</span>
      </div>

      {/* Video Player */}
      <div className="space-y-4">
        <VideoPlayer
          videoGuid={lesson.bunny_video_guid || ""}
          lessonId={params.lessonId}
          initialProgress={progress?.progress_seconds || 0}
        />

        {/* Lesson Actions */}
        <LessonActions
          lessonId={params.lessonId}
          isCompleted={progress?.completed || false}
          initialProgress={progress?.progress_seconds || 0}
        />
      </div>

      {/* Lesson Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-muted-foreground mt-2">{lesson.description}</p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {prevLesson ? (
              <Link href={`/curso/${params.moduleId}/${prevLesson.id}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link href={`/curso/${params.moduleId}/${nextLesson.id}`}>
                <Button className="gap-2 btn-gradient text-primary-foreground">
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href={`/curso/${params.moduleId}`}>
                <Button className="gap-2 btn-gradient text-primary-foreground">
                  Volver al modulo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar - Resources */}
        <div className="space-y-6">
          {resources && resources.length > 0 && (
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

          {/* Other lessons */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Lecciones del modulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-80 overflow-y-auto">
              {allLessons?.map((l, index) => (
                <Link
                  key={l.id}
                  href={`/curso/${params.moduleId}/${l.id}`}
                  className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                    l.id === params.lessonId
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary text-xs shrink-0">
                    {index + 1}
                  </span>
                  <span className="truncate">{l.title}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
