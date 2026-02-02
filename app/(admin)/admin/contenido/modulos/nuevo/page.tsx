"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"

const moduleSchema = z.object({
  title: z.string().min(1, "El titulo es requerido"),
  description: z.string().optional(),
  bunny_video_guid: z.string().optional(),
  duration_seconds: z.coerce.number().min(0).optional(),
  order_index: z.coerce.number().min(0, "El orden debe ser mayor o igual a 0"),
  is_published: z.boolean(),
})

type ModuleForm = z.infer<typeof moduleSchema>

export default function NuevoModuloPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ModuleForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(moduleSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      bunny_video_guid: "",
      duration_seconds: 0,
      order_index: 0,
      is_published: false,
    },
  })

  const isPublished = watch("is_published")

  const onSubmit = async (data: ModuleForm) => {
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("modules") as any).insert({
        title: data.title,
        description: data.description || null,
        bunny_video_guid: data.bunny_video_guid || null,
        duration_seconds: data.duration_seconds || 0,
        resources: [],
        order_index: data.order_index,
        is_published: data.is_published,
      })

      if (error) throw error

      toast.success("Modulo creado exitosamente")
      router.push("/admin/contenido")
      router.refresh()
    } catch {
      toast.error("Error al crear el modulo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/contenido">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Modulo</h1>
          <p className="text-muted-foreground mt-1">
            Crea un nuevo modulo para el curso
          </p>
        </div>
      </div>

      <Card className="max-w-2xl border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Informacion del Modulo</CardTitle>
          <CardDescription>
            Completa los datos del nuevo modulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                placeholder="Ej: Modulo 1 - Introduccion"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                placeholder="Describe el contenido del modulo..."
                rows={4}
                {...register("description")}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="bunny_video_guid">Bunny Video GUID</Label>
              <Input
                id="bunny_video_guid"
                placeholder="ej: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                {...register("bunny_video_guid")}
              />
              <p className="text-xs text-muted-foreground">
                El GUID del video en Bunny.net Stream
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_seconds">Duracion (segundos)</Label>
                <Input
                  id="duration_seconds"
                  type="number"
                  min={0}
                  {...register("duration_seconds")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_index">Orden</Label>
                <Input
                  id="order_index"
                  type="number"
                  min={0}
                  {...register("order_index")}
                />
                {errors.order_index && (
                  <p className="text-sm text-destructive">{errors.order_index.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_published">Publicar modulo</Label>
                <p className="text-sm text-muted-foreground">
                  Los modulos publicados son visibles para los estudiantes
                </p>
              </div>
              <Switch
                id="is_published"
                checked={isPublished}
                onCheckedChange={(checked) => setValue("is_published", checked)}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Modulo
              </Button>
              <Link href="/admin/contenido" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
