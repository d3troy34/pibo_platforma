import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, PlayCircle, TrendingUp } from "lucide-react"
import type { Profile, Enrollment } from "@/types/database"

export const metadata = {
  title: "Admin Dashboard",
  description: "Panel de administración de Mipibo",
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get total students
  const { count: studentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student")

  // Get total enrollments
  const { count: enrollmentCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("payment_status", "completed")

  // Get total modules
  const { count: moduleCount } = await supabase
    .from("modules")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)

  // Get recent enrollments
  const { data: recentEnrollmentsData } = await supabase
    .from("enrollments")
    .select("*, profiles(full_name, email)")
    .eq("payment_status", "completed")
    .order("enrolled_at", { ascending: false })
    .limit(5)

  type EnrollmentWithProfile = Enrollment & { profiles: Pick<Profile, "full_name" | "email"> | null }
  const recentEnrollments = recentEnrollmentsData as EnrollmentWithProfile[] | null

  // Get pending invitations count
  const { count: pendingInvitations } = await supabase
    .from("invitations")
    .select("*", { count: "exact", head: true })
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())

  const stats = [
    {
      title: "Estudiantes Activos",
      value: studentCount || 0,
      icon: Users,
      description: "Total registrados",
    },
    {
      title: "Inscripciones",
      value: enrollmentCount || 0,
      icon: TrendingUp,
      description: "Pagos completados",
    },
    {
      title: "Módulos",
      value: moduleCount || 0,
      icon: BookOpen,
      description: "Publicados",
    },
    {
      title: "Invitaciones",
      value: pendingInvitations || 0,
      icon: PlayCircle,
      description: "Pendientes",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido al panel de administración
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Invitations Alert */}
      {(pendingInvitations ?? 0) > 0 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-accent" />
              <span>
                Tienes <strong>{pendingInvitations}</strong> invitaciones pendientes
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Enrollments */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Inscripciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEnrollments && recentEnrollments.length > 0 ? (
            <div className="space-y-3">
              {recentEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div>
                    <p className="font-medium">
                      {enrollment.profiles?.full_name || "Sin nombre"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.profiles?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">
                      {enrollment.payment_method === "invitation"
                        ? "Invitación"
                        : `$${enrollment.amount_usd} ${enrollment.currency}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {enrollment.enrolled_at
                        ? new Date(enrollment.enrolled_at).toLocaleDateString("es-AR")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay inscripciones recientes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
