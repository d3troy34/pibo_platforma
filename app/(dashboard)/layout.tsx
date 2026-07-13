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

  const [
    { data: profile },
    { data: enrollment },
    { data: latestAnnouncement },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .single(),
    supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(1)
      .single(),
  ])

  const isAdmin = profile?.role === "admin"
  const hasEnrollment = !!enrollment

  // Calculate total progress (only for enrolled users or admins)
  let totalProgress = 0
  if (hasEnrollment || isAdmin) {
    const [{ data: modules }, { data: progress }] = await Promise.all([
      supabase
        .from("modules")
        .select("id")
        .eq("is_published", true),
      supabase
        .from("module_progress")
        .select("module_id")
        .eq("user_id", user.id)
        .eq("completed", true),
    ])

    const publishedModuleIds = new Set(modules?.map((module) => module.id) || [])
    const totalModules = publishedModuleIds.size
    const completedModules = progress?.filter((item) =>
      publishedModuleIds.has(item.module_id)
    ).length || 0
    totalProgress = totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0
  }

  return (
    <div className="flex min-h-screen gradient-bg">
      <Sidebar user={profile} totalProgress={totalProgress} hasEnrollment={hasEnrollment || isAdmin} />
      <main className="flex-1 overflow-y-auto">
        <AnnouncementBanner announcement={(latestAnnouncement as Announcement) || null} />
        <div className="container py-8 px-4 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
