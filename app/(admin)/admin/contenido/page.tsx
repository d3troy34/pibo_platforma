import Link from "next/link"
import { Plus, BookOpen, Video, Eye, EyeOff, Pencil, GripVertical, FileText } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ModuleResource } from "@/types/database"

export default async function ContenidoPage() {
  const supabase = await createClient()

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .order("order_index", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Contenido</h1>
          <p className="text-muted-foreground mt-1">
            Administra los modulos del curso
          </p>
        </div>
        <Link href="/admin/contenido/modulos/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Modulo
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {modules && modules.length > 0 ? (
          modules.map((module, index) => {
            const resources = (module.resources as ModuleResource[] | null) || []
            return (
              <Card key={module.id} className="border-border/50 bg-card/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {module.title}
                          {module.is_published ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                              <Eye className="h-3 w-3 mr-1" />
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Borrador
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {module.description || "Sin descripcion"}
                        </CardDescription>
                      </div>
                    </div>
                    <Link href={`/admin/contenido/modulos/${module.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      <span>{module.bunny_video_guid ? "Video configurado" : "Sin video"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{resources.length} {resources.length === 1 ? "recurso" : "recursos"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4" />
                      <span>Orden: {module.order_index}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay modulos</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer modulo para comenzar a agregar contenido
              </p>
              <Link href="/admin/contenido/modulos/nuevo">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Modulo
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
