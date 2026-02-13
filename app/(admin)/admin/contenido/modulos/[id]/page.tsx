"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2, Trash2, FileText, Upload, X as XIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import type { Module, ModuleResource } from "@/types/database"

const moduleSchema = z.object({
  title: z.string().min(1, "El titulo es requerido"),
  description: z.string().optional(),
  bunny_video_guid: z.string().optional(),
  duration_seconds: z.number().min(0).optional(),
  order_index: z.number().min(0, "El orden debe ser mayor o igual a 0"),
  is_published: z.boolean(),
})

type ModuleForm = z.infer<typeof moduleSchema>

export default function EditModuloPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [module, setModule] = useState<Module | null>(null)
  const [resources, setResources] = useState<ModuleResource[]>([])
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ModuleForm>({
    resolver: zodResolver(moduleSchema),
  })

  const isPublished = watch("is_published")

  useEffect(() => {
    const fetchModule = async () => {
      const { data: moduleData } = await supabase
        .from("modules")
        .select("*")
        .eq("id", params.id)
        .single()

      if (moduleData) {
        setModule(moduleData)
        setResources((moduleData.resources as ModuleResource[] | null) || [])
        reset({
          title: moduleData.title,
          description: moduleData.description || "",
          bunny_video_guid: moduleData.bunny_video_guid || "",
          duration_seconds: moduleData.duration_seconds || 0,
          order_index: moduleData.order_index,
          is_published: moduleData.is_published,
        })
      }
    }

    fetchModule()
  }, [params.id, reset, supabase])

  const onSubmit = async (data: ModuleForm) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("modules")
        .update({
          title: data.title,
          description: data.description || null,
          bunny_video_guid: data.bunny_video_guid || null,
          duration_seconds: data.duration_seconds || 0,
          resources,
          order_index: data.order_index,
          is_published: data.is_published,
        })
        .eq("id", params.id)

      if (error) throw error

      toast.success("Modulo actualizado")
      router.refresh()
    } catch {
      toast.error("Error al actualizar el modulo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteModule = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("modules")
        .delete()
        .eq("id", params.id)

      if (error) throw error

      toast.success("Modulo eliminado")
      router.push("/admin/contenido")
      router.refresh()
    } catch {
      toast.error("Error al eliminar el modulo")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("moduleId", params.id as string)

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Error al subir archivo")
        return
      }

      const newResources = [...resources, result.resource]
      setResources(newResources)

      await supabase.from("modules")
        .update({ resources: newResources })
        .eq("id", params.id)

      toast.success("Archivo subido")
    } catch {
      toast.error("Error al subir archivo")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleDeleteResource = async (index: number) => {
    const resource = resources[index]

    try {
      await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: resource.path, url: resource.url }),
      })

      const newResources = resources.filter((_, i) => i !== index)
      setResources(newResources)

      await supabase.from("modules")
        .update({ resources: newResources })
        .eq("id", params.id)

      toast.success("Archivo eliminado")
    } catch {
      toast.error("Error al eliminar archivo")
    }
  }

  if (!module) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/contenido">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Modulo</h1>
            <p className="text-muted-foreground mt-1">{module.title}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar modulo</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteModule} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="max-w-2xl">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Informacion del Modulo</CardTitle>
            <CardDescription>Edita los datos del modulo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input id="title" {...register("title")} />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea id="description" rows={4} {...register("description")} />
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
                  <Input id="duration_seconds" type="number" min={0} {...register("duration_seconds", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order_index">Orden</Label>
                  <Input id="order_index" type="number" min={0} {...register("order_index", { valueAsNumber: true })} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_published">Publicado</Label>
                  <p className="text-sm text-muted-foreground">Visible para estudiantes</p>
                </div>
                <Switch
                  id="is_published"
                  checked={isPublished}
                  onCheckedChange={(checked) => setValue("is_published", checked)}
                />
              </div>

              <Separator />

              {/* Resources */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Recursos (PDF, PowerPoint, Word)
                </Label>

                {resources.length > 0 && (
                  <div className="space-y-2">
                    {resources.map((resource, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{resource.name}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {resource.type.toUpperCase()}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => handleDeleteResource(index)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Subir archivo (max 20MB)
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
