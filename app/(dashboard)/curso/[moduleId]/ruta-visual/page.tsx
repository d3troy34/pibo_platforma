import { notFound } from "next/navigation"

import { VisualRoute } from "@/components/course/visual-route"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Ruta visual · Módulo 1",
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

  // This is the first visual-route prototype. Other modules keep their existing class page
  // until they receive their own visual narrative rather than a generic copy of this one.
  if (!module || module.order_index !== 0) notFound()

  return <VisualRoute />
}
