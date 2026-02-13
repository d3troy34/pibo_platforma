import { createClient } from "@/lib/supabase/server"
import { ModuleCard } from "@/components/dashboard/module-card"
import { canAccessModule } from "@/lib/access"
import type { Module, ModuleProgress } from "@/types/database"

export const metadata = {
  title: "Mi Curso",
  description: "Accede a todos los modulos del curso",
}

export default async function CoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check enrollment and role
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user!.id)
    .eq("payment_status", "completed")
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single()

  const hasEnrollment = !!enrollment
  const isAdmin = profile?.role === "admin"

  const { data: modulesData } = await supabase
    .from("modules")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true })

  const modules = modulesData as Module[] | null

  let completedModuleIds = new Set<string>()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: progressData } = await (supabase.from("module_progress") as any)
      .select("module_id, completed")
      .eq("user_id", user!.id)
      .eq("completed", true)
    const progress = progressData as Pick<ModuleProgress, "module_id" | "completed">[] | null
    completedModuleIds = new Set(progress?.map((p) => p.module_id) || [])
  } catch {
    // table may not exist yet
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mi Curso</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido de vuelta! Continua donde lo dejaste.
        </p>
      </div>

      {modules && modules.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isCompleted={completedModuleIds.has(module.id)}
              isLocked={!canAccessModule(hasEnrollment, isAdmin, module.order_index)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No hay modulos disponibles en este momento.
          </p>
        </div>
      )}
    </div>
  )
}
