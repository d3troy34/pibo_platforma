"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2, Plus, Video, Trash2, Pencil, Eye, EyeOff } from "lucide-react"
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
import type { Module, Lesson } from "@/types/database"

const moduleSchema = z.object({
  title: z.string().min(1, "El titulo es requerido"),
  description: z.string().optional(),
  order_index: z.coerce.number().min(0, "El orden debe ser mayor o igual a 0"),
  is_published: z.boolean(),
})

type ModuleForm = z.infer<typeof moduleSchema>

export default function EditModuloPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [module, setModule] = useState<Module | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ModuleForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(moduleSchema) as any,
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
        reset({
          title: moduleData.title,
          description: moduleData.description || "",
          order_index: moduleData.order_index,
          is_published: moduleData.is_published,
        })
      }

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", params.id)
        .order("order_index", { ascending: true })

      if (lessonsData) {
        setLessons(lessonsData)
      }
    }

    fetchModule()
  }, [params.id, reset, supabase])

  const onSubmit = async (data: ModuleForm) => {
    setIsLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("modules") as any)
        .update({
          title: data.title,
          description: data.description || null,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("modules") as any)
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

  const handleToggleLessonPublish = async (lesson: Lesson) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("lessons") as any)
        .update({ is_published: !lesson.is_published })
        .eq("id", lesson.id)

      if (error) throw error

      setLessons(lessons.map(l =>
        l.id === lesson.id ? { ...l, is_published: !l.is_published } : l
      ))
      toast.success(lesson.is_published ? "Leccion despublicada" : "Leccion publicada")
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("lessons") as any)
        .delete()
        .eq("id", lessonId)

      if (error) throw error

      setLessons(lessons.filter(l => l.id !== lessonId))
      toast.success("Leccion eliminada")
    } catch {
      toast.error("Error al eliminar la leccion")
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
      {/* Header */}
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
                Esta accion no se puede deshacer. Se eliminaran todas las lecciones asociadas.
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Module Form */}
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

              <div className="space-y-2">
                <Label htmlFor="order_index">Orden</Label>
                <Input id="order_index" type="number" min={0} {...register("order_index")} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_published">Publicado</Label>
                  <p className="text-sm text-muted-foreground">
                    Visible para estudiantes
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={isPublished}
                  onCheckedChange={(checked) => setValue("is_published", checked)}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lecciones</CardTitle>
                <CardDescription>{lessons.length} lecciones en este modulo</CardDescription>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setShowLessonForm(true)}>
                <Plus className="h-4 w-4" />
                Nueva
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length > 0 ? (
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/20 text-primary text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {lesson.bunny_video_guid ? (
                            <Badge variant="outline" className="text-xs">
                              <Video className="h-3 w-3 mr-1" />
                              Video
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Sin video</Badge>
                          )}
                          {lesson.is_published ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Borrador</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleLessonPublish(lesson)}
                      >
                        {lesson.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingLesson(lesson)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar leccion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta accion no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteLesson(lesson.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay lecciones en este modulo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lesson Form Modal */}
      {(showLessonForm || editingLesson) && (
        <LessonFormModal
          moduleId={params.id as string}
          lesson={editingLesson}
          onClose={() => {
            setShowLessonForm(false)
            setEditingLesson(null)
          }}
          onSave={(lesson) => {
            if (editingLesson) {
              setLessons(lessons.map(l => l.id === lesson.id ? lesson : l))
            } else {
              setLessons([...lessons, lesson])
            }
            setShowLessonForm(false)
            setEditingLesson(null)
          }}
        />
      )}
    </div>
  )
}

// Lesson Form Modal Component
function LessonFormModal({
  moduleId,
  lesson,
  onClose,
  onSave,
}: {
  moduleId: string
  lesson: Lesson | null
  onClose: () => void
  onSave: (lesson: Lesson) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const lessonSchema = z.object({
    title: z.string().min(1, "El titulo es requerido"),
    description: z.string().optional(),
    bunny_video_guid: z.string().optional(),
    duration_seconds: z.coerce.number().min(0).optional(),
    order_index: z.coerce.number().min(0),
    is_published: z.boolean(),
  })

  type LessonForm = z.infer<typeof lessonSchema>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LessonForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(lessonSchema) as any,
    defaultValues: lesson ? {
      title: lesson.title,
      description: lesson.description || "",
      bunny_video_guid: lesson.bunny_video_guid || "",
      duration_seconds: lesson.duration_seconds,
      order_index: lesson.order_index,
      is_published: lesson.is_published,
    } : {
      title: "",
      description: "",
      bunny_video_guid: "",
      duration_seconds: 0,
      order_index: 0,
      is_published: false,
    },
  })

  const isPublished = watch("is_published")

  const onSubmit = async (data: LessonForm) => {
    setIsLoading(true)
    try {
      if (lesson) {
        // Update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated, error } = await (supabase.from("lessons") as any)
          .update({
            title: data.title,
            description: data.description || null,
            bunny_video_guid: data.bunny_video_guid || null,
            duration_seconds: data.duration_seconds || 0,
            order_index: data.order_index,
            is_published: data.is_published,
          })
          .eq("id", lesson.id)
          .select()
          .single()

        if (error) throw error
        onSave(updated)
        toast.success("Leccion actualizada")
      } else {
        // Create
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created, error } = await (supabase.from("lessons") as any)
          .insert({
            module_id: moduleId,
            title: data.title,
            description: data.description || null,
            bunny_video_guid: data.bunny_video_guid || null,
            duration_seconds: data.duration_seconds || 0,
            order_index: data.order_index,
            is_published: data.is_published,
          })
          .select()
          .single()

        if (error) throw error
        onSave(created)
        toast.success("Leccion creada")
      }
    } catch {
      toast.error("Error al guardar la leccion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border/50 bg-card">
        <CardHeader>
          <CardTitle>{lesson ? "Editar Leccion" : "Nueva Leccion"}</CardTitle>
          <CardDescription>
            {lesson ? "Modifica los datos de la leccion" : "Agrega una nueva leccion al modulo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Titulo *</Label>
              <Input id="lesson-title" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-description">Descripcion</Label>
              <Textarea id="lesson-description" rows={3} {...register("description")} />
            </div>

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
                <Input id="duration_seconds" type="number" min={0} {...register("duration_seconds")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-order">Orden</Label>
                <Input id="lesson-order" type="number" min={0} {...register("order_index")} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="lesson-published">Publicar leccion</Label>
              <Switch
                id="lesson-published"
                checked={isPublished}
                onCheckedChange={(checked) => setValue("is_published", checked)}
              />
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lesson ? "Guardar" : "Crear"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
