import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
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

  type ModuleOutlineRow = Pick<
    Module,
    "id" | "title" | "description" | "thumbnail_url" | "order_index" | "is_published"
  > & {
    can_access: boolean
    is_locked: boolean
    has_video: boolean
  }

  const completedModuleIdsPromise = (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: progressData } = await (supabase.from("module_progress") as any)
        .select("module_id, completed")
        .eq("user_id", user!.id)
        .eq("completed", true)
      const progress = progressData as Pick<ModuleProgress, "module_id" | "completed">[] | null
      return new Set(progress?.map((item) => item.module_id) || [])
    } catch {
      // table may not exist yet
      return new Set<string>()
    }
  })()

  const [
    { data: enrollment },
    { data: profile },
    { data: outlineData, error: outlineError },
    completedModuleIds,
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user!.id)
      .eq("payment_status", "completed")
      .single(),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single(),
    supabase.rpc("get_course_modules_outline"),
    completedModuleIdsPromise,
  ])

  const hasEnrollment = !!enrollment
  const isAdmin = profile?.role === "admin"
  let modules: ModuleOutlineRow[] | null = null

  if (!outlineError && outlineData) {
    modules = outlineData as ModuleOutlineRow[]
  } else {
    // Fallback for environments where the RPC wasn't applied yet.
    // This uses the service role on the server and returns only safe fields.
    const { data: rawModules } = await supabaseAdmin
      .from("modules")
      .select("id, title, description, thumbnail_url, order_index, is_published, bunny_video_guid")
      .eq("is_published", true)
      .order("order_index", { ascending: true })

    modules = (rawModules || []).map((m) => {
      const canAccess = canAccessModule(hasEnrollment, isAdmin, m.order_index)
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        thumbnail_url: m.thumbnail_url,
        order_index: m.order_index,
        is_published: m.is_published,
        can_access: canAccess,
        is_locked: !canAccess,
        has_video: !!m.bunny_video_guid,
      }
    })
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
          {modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              isCompleted={completedModuleIds.has(module.id)}
              isLocked={module.is_locked}
              imageLoading={index === 0 ? "eager" : "lazy"}
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
