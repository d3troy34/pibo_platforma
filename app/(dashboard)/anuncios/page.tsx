import { format } from "date-fns"
import { es } from "date-fns/locale"
import { BellRing, CalendarDays } from "lucide-react"
import { redirect } from "next/navigation"

import { PaidAccessRequired } from "@/components/paywall/paid-access-required"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Novedades",
  description: "Actualizaciones importantes de Pibo",
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const now = new Date().toISOString()
  const [{ data: profile }, { data: enrollment }, { data: announcements, error }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("id, title, content, published_at")
      .eq("is_active", true)
      .not("published_at", "is", null)
      .lte("published_at", now)
      .order("published_at", { ascending: false }),
  ])

  if (profile?.role !== "admin" && !enrollment) {
    return (
      <PaidAccessRequired
        title="Las novedades son parte del acompañamiento"
        description="Con el acceso completo recibís avisos, cambios importantes y material nuevo en un solo lugar."
      />
    )
  }

  if (error) console.error("Could not load announcements", error)
  const items = announcements || []

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="grid gap-6 border-b border-ink/10 pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow mb-3">Al día</p>
          <h1 className="display-title text-5xl sm:text-6xl">Novedades que importan.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Cambios, recordatorios y próximos pasos. Sin ruido y en orden cronológico.
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink text-white">
          <BellRing className="h-6 w-6" />
        </div>
      </header>

      {items.length === 0 ? (
        <section className="paper-panel flex min-h-72 flex-col items-center justify-center p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-paper text-indigo">
            <BellRing />
          </span>
          <h2 className="mt-5 font-display text-3xl">Todo tranquilo por ahora.</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Cuando publiquemos una novedad, va a aparecer acá y te avisaremos por email si corresponde.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white/60">
          {items.map((announcement, index) => (
            <article
              key={announcement.id}
              className={`grid gap-5 border-b border-ink/10 p-6 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:p-8 ${index === 0 ? "bg-indigo text-white" : ""}`}
            >
              <div>
                <p className={`text-[0.68rem] font-bold uppercase tracking-[0.18em] ${index === 0 ? "text-white/60" : "text-muted-foreground"}`}>
                  {index === 0 ? "Lo más reciente" : "Novedad"}
                </p>
                {announcement.published_at && (
                  <time
                    dateTime={announcement.published_at}
                    className={`mt-3 flex items-center gap-2 text-xs ${index === 0 ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(announcement.published_at), "d MMM yyyy", { locale: es })}
                  </time>
                )}
              </div>
              <div>
                <h2 className="font-display text-3xl leading-tight">{announcement.title}</h2>
                <p className={`mt-4 whitespace-pre-wrap text-sm leading-7 ${index === 0 ? "text-white/80" : "text-muted-foreground"}`}>
                  {announcement.content}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
