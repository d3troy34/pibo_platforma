import { notFound } from "next/navigation"

import { ModuleVisualRoute } from "@/components/course/module-visual-route"
import { getModuleVisualRoute } from "@/components/course/module-visual-route-data"
import { VisualRoute } from "@/components/course/visual-route"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Ruta visual · Pibo",
}

interface VisualRoutePageProps {
  params: Promise<{ moduleId: string }>
}

export default async function VisualRoutePage({ params }: VisualRoutePageProps) {
  const { moduleId } = await params
  const supabase = await createClient()

  const { data: module } = await supabase
    .from("modules")
    .select("id, order_index, is_published")
    .eq("id", moduleId)
    .eq("is_published", true)
    .maybeSingle()

  if (!module) notFound()

  if (module.order_index === 0) return <VisualRoute />

  const visualRoute = getModuleVisualRoute(module.order_index)
  if (!visualRoute) notFound()

  return <ModuleVisualRoute route={visualRoute} />
}
