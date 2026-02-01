import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Mail, Calendar } from "lucide-react"
import type { Profile, Enrollment, Invitation } from "@/types/database"

export const metadata = {
  title: "Estudiantes",
  description: "Gestion de estudiantes",
}

export default async function StudentsPage() {
  const supabase = await createClient()

  // Get all students with their enrollments
  const { data: studentsData } = await supabase
    .from("profiles")
    .select("*, enrollments(*)")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  type StudentWithEnrollment = Profile & { enrollments: Enrollment[] }
  const students = studentsData as StudentWithEnrollment[] | null

  // Get pending invitations
  const { data: invitationsData } = await supabase
    .from("invitations")
    .select("*")
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  const pendingInvitations = invitationsData as Invitation[] | null

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estudiantes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus estudiantes y envia invitaciones
          </p>
        </div>
        <Link href="/admin/estudiantes/invitar">
          <Button className="btn-gradient text-primary-foreground gap-2">
            <UserPlus className="h-4 w-4" />
            Invitar Estudiante
          </Button>
        </Link>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              Invitaciones Pendientes ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviada el{" "}
                      {new Date(invitation.created_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-accent border-accent">
                    Pendiente
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Estudiantes Registrados</span>
            <Badge variant="secondary">{students?.length || 0} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students && students.length > 0 ? (
            <div className="space-y-3">
              {students.map((student) => {
                const enrollment = student.enrollments?.[0]
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(student.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {student.full_name || "Sin nombre"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {student.email}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString("es-AR")
                            : "N/A"}
                        </span>
                      </div>
                      {enrollment && (
                        <Badge
                          variant="outline"
                          className={
                            enrollment.payment_status === "completed"
                              ? "text-success border-success"
                              : "text-warning border-warning"
                          }
                        >
                          {enrollment.payment_status === "completed" ? "Activo" : "Pendiente"}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hay estudiantes registrados todavia
              </p>
              <Link href="/admin/estudiantes/invitar">
                <Button variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invitar al primer estudiante
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
