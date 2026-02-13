import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, FileText, Download, CheckCircle2, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { canAccessModule } from "@/lib/access"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { VideoPlayer } from "@/components/video/video-player"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModuleActions } from "./module-actions"
import type { Module, ModuleProgress, ModuleResource } from "@/types/database"

export async function generateMetadata({ params }: { params: { moduleId: string } }) {
  const { data: moduleData } = await supabaseAdmin
    .from("modules")
    .select("title")
    .eq("id", params.moduleId)
    .eq("is_published", true)
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

  type ModuleOutlineRow = Pick<
    Module,
    "id" | "title" | "order_index"
  > & { can_access: boolean; is_locked: boolean }

  // Best-effort fetch of outline: use RPC if present, fallback to server-side admin query.
  let allModules: ModuleOutlineRow[] | null = null

  const { data: outlineData, error: outlineError } = await supabase.rpc(
    "get_course_modules_outline"
  )

  if (!outlineError && outlineData) {
    allModules = (outlineData as Array<
      Pick<Module, "id" | "title" | "order_index"> & {
        can_access: boolean
        is_locked: boolean
      }
    >)
  } else {
    // Fallback: compute lock state from enrollment + admin role.
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user!.id)
      .eq("payment_status", "completed")
      .single()

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single()

    const hasEnrollment = !!enrollment
    const isAdmin = profile?.role === "admin"

    const { data: rawModules } = await supabaseAdmin
      .from("modules")
      .select("id, title, order_index")
      .eq("is_published", true)
      .order("order_index", { ascending: true })

    allModules = (rawModules || []).map((m) => {
      const canAccess = canAccessModule(hasEnrollment, isAdmin, m.order_index)
      return {
        id: m.id,
        title: m.title,
        order_index: m.order_index,
        can_access: canAccess,
        is_locked: !canAccess,
      }
    })
  }

  if (!allModules || allModules.length === 0) {
    notFound()
  }

  const currentIndex = allModules.findIndex((m) => m.id === params.moduleId)
  if (currentIndex === -1) {
    notFound()
  }

  const currentModule = allModules[currentIndex]
  const prevModule = currentIndex > 0 ? allModules[currentIndex - 1] : null
  const nextModule = currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null

  // If user can't access this module, show paywall (no video/resources leaked).
  if (currentModule.is_locked) {
    return (
      <div className="space-y-6">
        <Link href="/curso">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al curso
          </Button>
        </Link>

          <Card className="border-border/50 bg-card/50">
          <CardContent className="py-16 text-center space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">Contenido bloqueado</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Este modulo requiere acceso completo al curso. Compra tu acceso para desbloquear todos los modulos.
            </p>
            <a
              href="https://estudiaargentina.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="btn-gradient text-primary-foreground mt-4">
                Comprar acceso completo
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access allowed: fetch full module data (video/resources).
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

  const { data: progressData } = await supabase.from("module_progress")
    .select("*")
    .eq("user_id", user!.id)
    .eq("module_id", params.moduleId)
    .single()
  const progress = progressData as ModuleProgress | null

  const BUCKET = "lesson-resources"

  const resources = ((courseModule.resources as ModuleResource[]) || []).filter(Boolean)

  const resolveResourcePath = (resource: ModuleResource): string | null => {
    if (resource.path) return resource.path
    if (!resource.url) return null

    try {
      const url = new URL(resource.url)
      const marker = `/${BUCKET}/`
      const idx = url.pathname.indexOf(marker)
      if (idx === -1) return null
      return decodeURIComponent(url.pathname.slice(idx + marker.length))
    } catch {
      return null
    }
  }

  const signedResources = await Promise.all(
    resources.map(async (resource) => {
      const path = resolveResourcePath(resource)
      if (!path) return resource

      const bucket = resource.bucket || BUCKET
      const { data } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60) // 1 hour

      if (!data?.signedUrl) return resource

      return {
        ...resource,
        bucket,
        path,
        url: data.signedUrl,
      }
    })
  )

  const resourcesWithUrls = signedResources.filter((r) => !!r.url)

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
            {prevModule && prevModule.can_access ? (
              <Link href={`/curso/${prevModule.id}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextModule && nextModule.can_access ? (
              <Link href={`/curso/${nextModule.id}`}>
                <Button className="gap-2 btn-gradient text-primary-foreground">
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : nextModule ? (
              <a href="https://estudiaargentina.com" target="_blank" rel="noopener noreferrer">
                <Button className="gap-2 btn-gradient text-primary-foreground">
                  <Lock className="h-4 w-4" />
                  Comprar acceso
                </Button>
              </a>
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
          {resourcesWithUrls.length > 0 && (
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Recursos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {resourcesWithUrls.map((resource, index) => (
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
              {allModules?.map((m, index) => {
                return m.can_access ? (
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
                ) : (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-2 rounded-lg text-sm text-muted-foreground/50"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary text-xs shrink-0">
                      <Lock className="h-3 w-3" />
                    </span>
                    <span className="truncate">{m.title}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
