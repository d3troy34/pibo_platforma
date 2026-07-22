import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Download, FileText, Lock } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/video/video-player"
import { canAccessModule } from "@/lib/access"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Module, ModuleProgress, ModuleResource } from "@/types/database"
import { ModuleActions } from "./module-actions"

const RESOURCE_BUCKET = "lesson-resources"

type ModuleOutlineRow = Pick<Module, "id" | "title" | "order_index"> & {
  can_access: boolean
  is_locked: boolean
}

function resolveResourcePath(resource: ModuleResource): string | null {
  if (resource.path) return resource.path
  if (!resource.url) return null

  try {
    const url = new URL(resource.url)
    const marker = `/${RESOURCE_BUCKET}/`
    const index = url.pathname.indexOf(marker)
    if (index === -1) return null
    return decodeURIComponent(url.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`
}

export async function generateMetadata({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const { data } = await getSupabaseAdmin()
    .from("modules")
    .select("title")
    .eq("id", moduleId)
    .eq("is_published", true)
    .maybeSingle()

  return { title: data?.title || "Clase" }
}

interface ModulePageProps {
  params: Promise<{ moduleId: string }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { moduleId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  let allModules: ModuleOutlineRow[] = []
  const { data: outlineData, error: outlineError } = await supabase.rpc(
    "get_course_modules_outline"
  )

  if (!outlineError && outlineData) {
    allModules = outlineData.map((module) => ({
      id: module.id,
      title: module.title,
      order_index: module.order_index,
      can_access: module.can_access,
      is_locked: module.is_locked,
    }))
  } else {
    const supabaseAdmin = getSupabaseAdmin()
    const [{ data: enrollment }, { data: profile }, { data: rawModules }] = await Promise.all([
      supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("payment_status", "completed")
        .maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabaseAdmin
        .from("modules")
        .select("id, title, order_index")
        .eq("is_published", true)
        .order("order_index", { ascending: true }),
    ])

    allModules = (rawModules || []).map((module) => {
      const canAccess = canAccessModule(!!enrollment, profile?.role === "admin", module.order_index)
      return { ...module, can_access: canAccess, is_locked: !canAccess }
    })
  }

  if (allModules.length === 0) notFound()

  const currentIndex = allModules.findIndex((module) => module.id === moduleId)
  if (currentIndex === -1) notFound()

  const currentModule = allModules[currentIndex]
  const previousModule = currentIndex > 0 ? allModules[currentIndex - 1] : null
  const nextModule = currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null

  if (currentModule.is_locked) {
    return (
      <div className="mx-auto max-w-4xl space-y-7">
        <Button asChild variant="ghost" size="sm">
          <Link href="/curso"><ArrowLeft /> Volver a mi ruta</Link>
        </Button>
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70">
          <div className="bg-indigo p-8 text-white sm:p-12">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10"><Lock /></span>
            <p className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/60">
              Clase {String(currentIndex + 1).padStart(2, "0")}
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl">{currentModule.title}</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/75">
              Esta clase forma parte del acceso completo. El video y sus recursos se mantienen privados hasta activar tu inscripción.
            </p>
          </div>
          <div className="flex flex-col gap-3 p-6 sm:flex-row sm:justify-end">
            <Button asChild variant="outline"><Link href="/curso">Ver la ruta</Link></Button>
            <Button asChild>
              <a href="https://estudiaargentina.com" target="_blank" rel="noopener noreferrer">
                Activar acceso <ArrowRight />
              </a>
            </Button>
          </div>
        </section>
      </div>
    )
  }

  const [{ data: moduleData, error: moduleError }, { data: progressData }] = await Promise.all([
    supabase.from("modules").select("*").eq("id", moduleId).eq("is_published", true).single(),
    supabase
      .from("module_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle(),
  ])

  if (moduleError || !moduleData) notFound()

  const courseModule = moduleData as Module
  const progress = (progressData as ModuleProgress | null) || null
  const resources = ((courseModule.resources as ModuleResource[]) || []).filter(Boolean)

  const signedResources = await Promise.all(
    resources.map(async (resource) => {
      const path = resolveResourcePath(resource)
      if (!path) return resource

      const bucket = resource.bucket || RESOURCE_BUCKET
      const { data } = await getSupabaseAdmin().storage.from(bucket).createSignedUrl(path, 60 * 60)
      return data?.signedUrl ? { ...resource, bucket, path, url: data.signedUrl } : resource
    })
  )
  const resourcesWithUrls = signedResources.filter((resource) => !!resource.url)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/curso"><ArrowLeft /> Mi ruta</Link>
        </Button>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {currentIndex + 1} de {allModules.length}
        </p>
      </div>

      <header className="max-w-4xl">
        <p className="eyebrow mb-3">Clase {String(currentIndex + 1).padStart(2, "0")}</p>
        <h1 className="display-title text-4xl sm:text-6xl">{courseModule.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {courseModule.duration_seconds > 0 && (
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {formatDuration(courseModule.duration_seconds)}</span>
          )}
          {progress?.completed && (
            <span className="flex items-center gap-2 font-semibold text-indigo"><CheckCircle2 className="h-4 w-4" /> Completada</span>
          )}
        </div>
      </header>

      <section className="space-y-4">
        {courseModule.bunny_video_guid ? (
          <VideoPlayer
            videoGuid={courseModule.bunny_video_guid}
            moduleId={moduleId}
            initialProgress={progress?.progress_seconds || 0}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-[1.5rem] bg-ink p-8 text-center text-white">
            <div><FileText className="mx-auto h-9 w-9 text-pink" /><p className="mt-4">Esta clase todavía no tiene video publicado.</p></div>
          </div>
        )}
        <ModuleActions moduleId={moduleId} isCompleted={progress?.completed || false} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="space-y-8">
          <section className="paper-panel p-6 sm:p-8">
            <p className="eyebrow mb-3">Sobre esta clase</p>
            <h2 className="font-display text-3xl">Qué vas a trabajar</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {courseModule.description || "Mirá la clase a tu ritmo. Tu avance se guarda automáticamente para que puedas volver cuando quieras."}
            </p>
          </section>

          <nav className="grid gap-3 border-t border-ink/10 pt-7 sm:grid-cols-2" aria-label="Navegación entre clases">
            {previousModule?.can_access ? (
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/curso/${previousModule.id}`}><ArrowLeft /> Anterior</Link>
              </Button>
            ) : <span />}

            {nextModule?.can_access ? (
              <Button asChild className="sm:justify-self-end">
                <Link href={`/curso/${nextModule.id}`}>Siguiente <ArrowRight /></Link>
              </Button>
            ) : nextModule ? (
              <Button asChild className="sm:justify-self-end">
                <a href="https://estudiaargentina.com" target="_blank" rel="noopener noreferrer"><Lock /> Activar acceso</a>
              </Button>
            ) : (
              <Button asChild className="sm:justify-self-end">
                <Link href="/curso">Volver a la ruta <CheckCircle2 /></Link>
              </Button>
            )}
          </nav>
        </main>

        <aside className="space-y-6">
          {resourcesWithUrls.length > 0 && (
            <section className="paper-panel p-6">
              <p className="eyebrow mb-4">Para llevar</p>
              <h2 className="font-display text-2xl">Recursos</h2>
              <div className="mt-5 space-y-2">
                {resourcesWithUrls.map((resource) => (
                  <a
                    key={`${resource.name}-${resource.url}`}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white/70 p-3 text-sm font-medium transition-colors hover:border-indigo/30 hover:text-indigo"
                  >
                    <span className="flex min-w-0 items-center gap-3"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{resource.name}</span></span>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-indigo" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="paper-panel p-6">
            <p className="eyebrow mb-4">En esta ruta</p>
            <div className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
              {allModules.map((module, index) =>
                module.can_access ? (
                  <Link
                    key={module.id}
                    href={`/curso/${module.id}`}
                    aria-current={module.id === moduleId ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                      module.id === moduleId
                        ? "bg-indigo font-semibold text-white"
                        : "text-muted-foreground hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <span className="w-6 shrink-0 font-display text-lg">{String(index + 1).padStart(2, "0")}</span>
                    <span className="line-clamp-2">{module.title}</span>
                  </Link>
                ) : (
                  <div key={module.id} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground/50">
                    <Lock className="h-3.5 w-6 shrink-0" /><span className="line-clamp-2">{module.title}</span>
                  </div>
                )
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
