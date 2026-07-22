import Link from "next/link"
import { ArrowRight, BookOpen, Check, Clock3, MapPinned, Sparkles } from "lucide-react"

import { ModuleCard } from "@/components/dashboard/module-card"
import { Button } from "@/components/ui/button"
import { canAccessModule } from "@/lib/access"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import type { Module, ModuleProgress } from "@/types/database"

export const metadata = {
  title: "Mi ruta",
  description: "Tu camino de aprendizaje en Pibo",
}

export default async function CoursePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  type ModuleOutlineRow = Pick<
    Module,
    "id" | "title" | "description" | "thumbnail_url" | "order_index" | "is_published" | "duration_seconds"
  > & {
    can_access: boolean
    is_locked: boolean
    has_video: boolean
  }

  const completedModuleIdsPromise = (async () => {
    const { data } = await supabase
      .from("module_progress")
      .select("module_id, completed")
      .eq("user_id", user!.id)
      .eq("completed", true)
    return new Set((data as Pick<ModuleProgress, "module_id">[] | null)?.map((item) => item.module_id) || [])
  })()

  const [
    { data: enrollment },
    { data: profile },
    { data: outlineData, error: outlineError },
    completedModuleIds,
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user!.id)
      .eq("payment_status", "completed")
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("role, full_name, goal")
      .eq("id", user!.id)
      .single(),
    supabase.rpc("get_course_modules_outline"),
    completedModuleIdsPromise,
  ])

  const hasEnrollment = !!enrollment
  const isAdmin = profile?.role === "admin"
  let modules: ModuleOutlineRow[] = []

  if (!outlineError && outlineData) {
    modules = outlineData as ModuleOutlineRow[]
  } else {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: rawModules } = await supabaseAdmin
      .from("modules")
      .select("id, title, description, thumbnail_url, order_index, is_published, bunny_video_guid, duration_seconds")
      .eq("is_published", true)
      .order("order_index", { ascending: true })

    modules = (rawModules || []).map((module) => {
      const canAccess = canAccessModule(hasEnrollment, isAdmin, module.order_index)
      return {
        id: module.id,
        title: module.title,
        description: module.description,
        thumbnail_url: module.thumbnail_url,
        order_index: module.order_index,
        is_published: module.is_published,
        duration_seconds: module.duration_seconds,
        can_access: canAccess,
        is_locked: !canAccess,
        has_video: !!module.bunny_video_guid,
      }
    })
  }

  const firstName = profile?.full_name?.split(" ")[0] || ""
  const nextModule = modules.find(
    (module) => module.can_access && !completedModuleIds.has(module.id)
  )
  const completedCount = modules.filter((module) => completedModuleIds.has(module.id)).length
  const totalDuration = modules.reduce((total, module) => total + (module.duration_seconds || 0), 0)
  const totalHours = Math.max(1, Math.round(totalDuration / 3600))

  return (
    <div className="space-y-10">
      <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow mb-4">Tu ruta a Argentina</p>
          <h1 className="display-title max-w-4xl">
            {firstName ? `Hola, ${firstName}. ` : ""}Un camino claro, paso a paso<span className="text-pink">.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Empezá por lo que hoy te destraba. Tus clases y recursos siguen disponibles cuando los necesites.
          </p>
        </div>
        <div className="flex gap-8 text-sm">
          <div>
            <p className="font-display text-4xl text-indigo">{completedCount}/{modules.length}</p>
            <p className="mt-1 text-muted-foreground">etapas completas</p>
          </div>
          <div>
            <p className="font-display text-4xl text-pink">{totalHours} h</p>
            <p className="mt-1 text-muted-foreground">de contenido</p>
          </div>
        </div>
      </header>

      {nextModule && (
        <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-7 shadow-[0_24px_80px_rgba(31,28,25,0.07)] lg:p-10">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,hsl(var(--indigo)/0.12),transparent_65%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo">
                <Sparkles className="h-4 w-4" /> Tu próximo paso
              </p>
              <p className="font-display text-2xl text-pink">
                Etapa {String(nextModule.order_index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-2 max-w-3xl font-display text-4xl leading-tight tracking-[-0.035em] lg:text-5xl">
                {nextModule.title}
              </h2>
              {nextModule.description && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {nextModule.description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-indigo" />{Math.max(1, Math.round(nextModule.duration_seconds / 60))} min</span>
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-pink" />Video + recursos</span>
              </div>
            </div>
            <Button asChild size="lg" className="btn-gradient min-w-52 justify-between text-white">
              <Link href={`/curso/${nextModule.id}`}>
                Seguir aprendiendo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">El recorrido completo</p>
              <h2 className="font-display text-3xl tracking-[-0.025em]">Tu plan de aprendizaje</h2>
            </div>
            <MapPinned className="hidden h-8 w-8 text-pink sm:block" />
          </div>

          {modules.length > 0 ? (
            <div className="relative space-y-4 before:absolute before:bottom-8 before:left-[-1.35rem] before:top-8 before:w-1 before:rounded-full before:bg-pink/40 sm:pl-5">
              {modules.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  isCompleted={completedModuleIds.has(module.id)}
                  isLocked={module.is_locked}
                  imageLoading={index === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
          ) : (
            <div className="paper-panel p-10 text-center">
              <p className="text-muted-foreground">Todavía no hay etapas publicadas.</p>
            </div>
          )}
        </section>

        <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
          <div className="paper-panel p-6">
            <p className="eyebrow mb-3">Tu foco actual</p>
            <p className="font-display text-2xl">{profile?.goal ? "Tu objetivo está definido" : "Definí tu objetivo"}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Pibo ordena las clases para que cada decisión tenga contexto y un siguiente paso claro.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo/20 bg-indigo/[0.055] p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo text-white">
              <Check className="h-5 w-5" />
            </span>
            <p className="mt-5 font-display text-2xl">No necesitás hacerlo todo hoy.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Avanzá una etapa, guardá tus dudas y retomá cuando puedas.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
