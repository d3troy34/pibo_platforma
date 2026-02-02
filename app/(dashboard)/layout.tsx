import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AnnouncementBanner } from "@/components/announcements/announcement-banner"
import type { Announcement } from "@/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (profile as any)?.role === "admin"

  // Check enrollment (admins bypass this check)
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("payment_status", "completed")
    .single()

  // If not enrolled and not admin, show a message
  if (!enrollment && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Acceso no disponible</h1>
          <p className="text-muted-foreground">
            Tu cuenta aun no tiene acceso al curso. Si ya realizaste tu compra,
            por favor contacta a soporte.
          </p>
          <p className="text-sm text-muted-foreground">
            Email: {user.email}
          </p>
        </div>
      </div>
    )
  }

  // Calculate total progress
  let totalProgress = 0
  try {
    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("is_published", true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: progress } = await (supabase.from("module_progress") as any)
      .select("module_id")
      .eq("user_id", user.id)
      .eq("completed", true)

    const totalModules = modules?.length || 0
    const completedModules = progress?.length || 0
    totalProgress = totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0
  } catch {
    // table may not exist yet
  }

  // Get latest announcement
  const { data: latestAnnouncement } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={profile} totalProgress={totalProgress} />
      <main className="flex-1 overflow-y-auto gradient-bg">
        <AnnouncementBanner announcement={(latestAnnouncement as Announcement) || null} />
        <div className="container py-8 px-4 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
