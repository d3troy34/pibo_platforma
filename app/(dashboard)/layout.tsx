import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { AnnouncementBanner } from "@/components/announcements/announcement-banner"
import { getModuleProgressPercent } from "@/lib/progress"
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
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const isAdmin = profile?.role === "admin"
  const hasEnrollment = !!enrollment

  if (!isAdmin && !profile?.onboarding_completed_at) {
    redirect("/onboarding")
  }

  // Calculate total progress (only for enrolled users or admins)
  let totalProgress = 0
  if (hasEnrollment || isAdmin) {
    const [{ data: modules }, { data: progress }] = await Promise.all([
      supabase
        .from("modules")
        .select("id, duration_seconds")
        .eq("is_published", true),
      supabase
        .from("module_progress")
        .select("module_id, progress_seconds, completed")
        .eq("user_id", user.id)
    ])

    const progressMap = new Map(progress?.map((item) => [item.module_id, item]) || [])
    totalProgress = modules?.length
      ? Math.round(modules.reduce((total, module) => {
          const item = progressMap.get(module.id)
          return total + getModuleProgressPercent(
            item?.progress_seconds,
            module.duration_seconds,
            item?.completed || false
          )
        }, 0) / modules.length)
      : 0
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar user={profile} totalProgress={totalProgress} hasEnrollment={hasEnrollment || isAdmin} />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <AnnouncementBanner announcement={(latestAnnouncement as Announcement) || null} />
        <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
