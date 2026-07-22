import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowUpRight, BookOpen, MessageSquare, UserPlus, Users } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Administración",
  description: "Estado general de Pibo",
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [
    { count: studentCount },
    { count: enrollmentCount },
    { count: moduleCount },
    { count: pendingInvitations },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("payment_status", "completed"),
    supabase.from("modules").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", now),
    supabase
      .from("enrollments")
      .select("id, amount_usd, currency, payment_method, enrolled_at, profiles!enrollments_user_id_fkey(full_name, email)")
      .eq("payment_status", "completed")
      .order("enrolled_at", { ascending: false })
      .limit(6),
  ])

  const stats = [
    { label: "Estudiantes", value: studentCount || 0, note: "cuentas creadas" },
    { label: "Con acceso", value: enrollmentCount || 0, note: "inscripciones activas" },
    { label: "Clases", value: moduleCount || 0, note: "publicadas" },
    { label: "Invitaciones", value: pendingInvitations || 0, note: "pendientes" },
  ]

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">Pibo en números</p>
          <h1 className="display-title text-5xl sm:text-6xl">Todo bajo control.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Una vista rápida del contenido, los accesos y las personas que llegaron últimamente.
          </p>
        </div>
        <Button asChild><Link href="/admin/estudiantes/invitar"><UserPlus /> Invitar estudiante</Link></Button>
      </header>

      <section className="grid overflow-hidden rounded-[2rem] border border-ink/10 bg-white/65 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className={`p-6 sm:p-7 ${index > 0 ? "border-t border-ink/10 sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 xl:border-l" : ""}`}>
            <p className="eyebrow">{stat.label}</p>
            <p className="mt-4 font-display text-5xl text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.note}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="paper-panel overflow-hidden">
          <div className="flex items-end justify-between gap-4 border-b border-ink/10 p-6 sm:p-7">
            <div><p className="eyebrow mb-2">Actividad</p><h2 className="font-display text-3xl">Últimos accesos</h2></div>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/estudiantes">Ver todos <ArrowUpRight /></Link></Button>
          </div>

          {recentEnrollments && recentEnrollments.length > 0 ? (
            <div>
              {recentEnrollments.map((enrollment) => {
                const profile = enrollment.profiles
                return (
                  <div key={enrollment.id} className="grid gap-3 border-b border-ink/10 px-6 py-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{profile?.full_name || "Sin nombre"}</p>
                      <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-indigo">
                        {enrollment.payment_method === "invitation" ? "Invitación" : `${enrollment.amount_usd} ${enrollment.currency}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {enrollment.enrolled_at ? format(new Date(enrollment.enrolled_at), "d MMM yyyy", { locale: es }) : "Sin fecha"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="p-10 text-center text-sm text-muted-foreground">Todavía no hay inscripciones.</p>
          )}
        </section>

        <aside className="space-y-3">
          <p className="eyebrow mb-4 px-1">Atajos</p>
          {[
            { href: "/admin/contenido", label: "Gestionar clases", icon: BookOpen, color: "bg-indigo" },
            { href: "/admin/mensajes", label: "Responder mensajes", icon: MessageSquare, color: "bg-pink" },
            { href: "/admin/estudiantes", label: "Ver estudiantes", icon: Users, color: "bg-ink" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/65 p-4 transition-transform hover:-translate-y-0.5">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${item.color}`}><item.icon className="h-5 w-5" /></span>
              <span className="flex-1 font-semibold text-ink">{item.label}</span>
              <ArrowUpRight className="text-muted-foreground group-hover:text-indigo" />
            </Link>
          ))}
        </aside>
      </div>
    </div>
  )
}
