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
import { createClient } from "@/lib/supabase/client"

const postSchema = z.object({
  title: z.string().min(5, "El titulo debe tener al menos 5 caracteres").max(200, "El titulo es muy largo"),
  content: z.string().min(20, "La pregunta debe tener al menos 20 caracteres"),
})

type PostForm = z.infer<typeof postSchema>

export default function NuevaPreguntaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  })

  const onSubmit = async (data: PostForm) => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("forum_posts") as any).insert({
        user_id: user.id,
        title: data.title,
        content: data.content,
      })

      if (error) throw error

      toast.success("Pregunta publicada")
      router.push("/foro")
      router.refresh()
    } catch {
      toast.error("Error al publicar la pregunta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/foro">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Pregunta</h1>
          <p className="text-muted-foreground mt-1">
            Haz una pregunta a la comunidad
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Tu Pregunta</CardTitle>
          <CardDescription>
            Se claro y especifico para obtener mejores respuestas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo de la pregunta *</Label>
              <Input
                id="title"
                placeholder="Ej: Como resuelvo ecuaciones cuadraticas?"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Descripcion *</Label>
              <Textarea
                id="content"
                placeholder="Explica tu pregunta con detalle. Incluye contexto, lo que ya intentaste, y que es lo que no entiendes..."
                rows={8}
                {...register("content")}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Minimo 20 caracteres. Cuanto mas detallada sea tu pregunta, mejores respuestas recibiras.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar Pregunta
              </Button>
              <Link href="/foro" className="flex-1">
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
