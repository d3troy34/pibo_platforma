import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaidAccessRequired } from "@/components/paywall/paid-access-required"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Megaphone } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Announcement } from "@/types/database"

export const dynamic = "force-dynamic"

async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })

    if (error) {
      console.error("Error fetching announcements:", error)
      return []
    }

    return (data as Announcement[]) || []
  } catch (error) {
    console.error("Error fetching announcements:", error)
    return []
  }
}

export default async function AnunciosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Paid-only section (admins bypass).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  if (!isAdmin) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .single()

    if (!enrollment) {
      return (
        <PaidAccessRequired
          title="Anuncios bloqueados"
          description="Los anuncios del curso se habilitan con el acceso completo. Compra tu acceso para desbloquear todos los modulos y novedades."
        />
      )
    }
  }

  const announcements = await getAnnouncements()

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Anuncios</h1>
        <p className="text-muted-foreground">
          Mantente al día con las últimas novedades
        </p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay anuncios aún</p>
            <p className="text-sm text-muted-foreground">
              Los anuncios del instructor aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Megaphone className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">
                      {announcement.title}
                    </CardTitle>
                    <CardDescription>
                      {announcement.published_at &&
                        format(
                          new Date(announcement.published_at),
                          "d 'de' MMMM, yyyy 'a las' HH:mm",
                          { locale: es }
                        )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
