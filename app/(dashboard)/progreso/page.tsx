import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, Check, Clock3, Play } from "lucide-react"

import { PaidAccessRequired } from "@/components/paywall/paid-access-required"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getModuleProgressPercent } from "@/lib/progress"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Mi progreso",
  description: "Tu avance real dentro de Pibo",
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { data: enrollment }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .maybeSingle(),
  ])

  if (profile?.role !== "admin" && !enrollment) {
    return (
      <PaidAccessRequired
        title="Tu progreso se activa con el curso completo"
        description="Cuando tengas acceso, vas a ver cuánto avanzaste en cada clase y dónde conviene retomar."
      />
    )
  }

  const [{ data: modulesData }, { data: progressData }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, order_index, duration_seconds")
      .eq("is_published", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("module_progress")
      .select("module_id, progress_seconds, completed, last_watched_at")
      .eq("user_id", user.id),
  ])

  const modules = modulesData || []
  const progressMap = new Map((progressData || []).map((item) => [item.module_id, item]))
  const rows = modules.map((module) => {
    const progress = progressMap.get(module.id)
    return {
      ...module,
      completed: progress?.completed || false,
      progressSeconds: progress?.progress_seconds || 0,
      lastWatchedAt: progress?.last_watched_at || null,
      percent: getModuleProgressPercent(
        progress?.progress_seconds,
        module.duration_seconds,
        progress?.completed || false
      ),
    }
  })

  const completedModules = rows.filter((row) => row.completed).length
  const inProgressModules = rows.filter((row) => !row.completed && row.progressSeconds > 0).length
  const totalProgress = rows.length
    ? Math.round(rows.reduce((total, row) => total + row.percent, 0) / rows.length)
    : 0
  const totalAdvancedSeconds = rows.reduce((total, row) => total + row.progressSeconds, 0)
  const advancedHours = Math.floor(totalAdvancedSeconds / 3600)
  const advancedMinutes = Math.floor((totalAdvancedSeconds % 3600) / 60)
  const nextModule = rows.find((row) => !row.completed) || rows[0]

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="flex flex-col gap-6 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">Tu avance</p>
          <h1 className="display-title text-5xl sm:text-6xl">Cada clase te acerca.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Acá ves el progreso real del video, no una lista de casilleros para cumplir.
          </p>
        </div>
        {nextModule && (
          <Button asChild>
            <Link href={`/curso/${nextModule.id}`}>
              {nextModule.progressSeconds > 0 ? "Retomar clase" : "Empezar clase"}
              <Play className="fill-current" />
            </Link>
          </Button>
        )}
      </header>

      <section className="grid overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-[22rem] flex-col justify-between bg-indigo p-7 text-white sm:p-10">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white/60">Ruta recorrida</p>
            <p className="mt-4 font-display text-7xl sm:text-8xl">{totalProgress}%</p>
          </div>
          <div>
            <Progress
              value={totalProgress}
              aria-label={`${totalProgress}% de la ruta recorrida`}
              className="h-2 bg-white/20 [&>div]:bg-pink"
            />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              {completedModules === rows.length && rows.length > 0
                ? "Terminaste toda la ruta publicada. Eso merece celebrarse."
                : "Tu progreso se guarda mientras mirás cada video y también podés marcar una clase manualmente."}
            </p>
          </div>
        </div>

        <div className="grid divide-y divide-ink/10 p-7 sm:p-10">
          <div className="flex items-center justify-between gap-4 pb-7">
            <div>
              <p className="eyebrow">Clases completas</p>
              <p className="mt-2 font-display text-4xl">{completedModules} <span className="text-xl text-muted-foreground">/ {rows.length}</span></p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pink text-white"><Check /></span>
          </div>
          <div className="flex items-center justify-between gap-4 py-7">
            <div>
              <p className="eyebrow">En marcha</p>
              <p className="mt-2 font-display text-4xl">{inProgressModules}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper text-indigo"><Play /></span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-7">
            <div>
              <p className="eyebrow">Video recorrido</p>
              <p className="mt-2 font-display text-4xl">
                {advancedHours > 0 ? `${advancedHours}h ` : ""}{advancedMinutes}m
              </p>
            </div>
            <Clock3 className="h-8 w-8 text-indigo" />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Clase por clase</p>
            <h2 className="font-display text-3xl">Tu recorrido completo</h2>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="paper-panel p-10 text-center text-muted-foreground">
            Todavía no hay clases publicadas.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white/60">
            {rows.map((module, index) => (
              <Link
                key={module.id}
                href={`/curso/${module.id}`}
                className="group grid gap-4 border-b border-ink/10 p-5 transition-colors last:border-b-0 hover:bg-white sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:p-6"
              >
                <span className="font-display text-2xl text-muted-foreground/60">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate font-semibold text-ink">{module.title}</h3>
                    {module.completed && (
                      <span className="rounded-full bg-indigo px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white">Lista</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={module.percent} aria-label={`${module.percent}% de ${module.title}`} className="h-1.5 max-w-xl" />
                    <span className="w-10 text-right text-xs font-semibold text-muted-foreground">{module.percent}%</span>
                  </div>
                </div>
                <ArrowUpRight className="hidden text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo sm:block" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
