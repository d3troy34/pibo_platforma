import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import type { Profile } from "@/types/database"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, avatar_url")
    .eq("id", user.id)
    .single() as { data: Pick<Profile, "role" | "full_name" | "email" | "avatar_url"> | null }

  if (profile?.role !== "admin") {
    redirect("/curso")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar user={profile} />
      <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64">
        {children}
      </main>
    </div>
  )
}
