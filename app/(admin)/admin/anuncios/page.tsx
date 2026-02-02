"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Megaphone, Send, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Announcement } from "@/types/database"

export default function AdminAnunciosPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function loadAnnouncements() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error("Error loading announcements:", error)
      toast.error("Error al cargar anuncios")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("El título y contenido son obligatorios")
      return
    }

    setIsCreating(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Debes iniciar sesión")
        return
      }

      // Create announcement
      const { data: announcement, error: createError } = await supabase
        .from("announcements")
        .insert({
          title: newTitle.trim(),
          content: newContent.trim(),
          created_by: user.id,
          published_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single()

      if (createError) throw createError

      // Send email notifications
      try {
        await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            announcement_id: announcement.id,
            title: newTitle.trim(),
            content: newContent.trim(),
          }),
        })
      } catch (emailError) {
        console.error("Error sending emails:", emailError)
        // Don't fail the whole operation if emails fail
      }

      toast.success("Anuncio publicado")
      setNewTitle("")
      setNewContent("")
      loadAnnouncements()
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast.error("Error al crear anuncio")
    } finally {
      setIsCreating(false)
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !currentState })
        .eq("id", id)

      if (error) throw error

      toast.success(currentState ? "Anuncio desactivado" : "Anuncio activado")
      loadAnnouncements()
    } catch (error) {
      console.error("Error toggling announcement:", error)
      toast.error("Error al actualizar anuncio")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que deseas eliminar este anuncio?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("announcements").delete().eq("id", id)

      if (error) throw error

      toast.success("Anuncio eliminado")
      loadAnnouncements()
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast.error("Error al eliminar anuncio")
    }
  }

  if (isLoading) {
    return <div className="container max-w-4xl mx-auto p-6">Cargando...</div>
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gestión de Anuncios</h1>
        <p className="text-muted-foreground">
          Crea y administra anuncios para tus estudiantes
        </p>
      </div>

      {/* Create New Announcement */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Crear Nuevo Anuncio</CardTitle>
          <CardDescription>
            El anuncio se publicará inmediatamente y se enviará por email a todos los estudiantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej: Nuevo módulo disponible"
              maxLength={200}
              disabled={isCreating}
            />
          </div>
          <div>
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Escribe el contenido del anuncio..."
              className="min-h-[120px]"
              disabled={isCreating}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !newTitle.trim() || !newContent.trim()}
            className="btn-gradient w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Publicar y Enviar Email
          </Button>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Anuncios Publicados</h2>

        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay anuncios aún</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      {announcement.is_active ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <CardDescription>
                      {announcement.published_at
                        ? format(
                            new Date(announcement.published_at),
                            "d 'de' MMMM, yyyy 'a las' HH:mm",
                            { locale: es }
                          )
                        : "Borrador"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleActive(announcement.id, announcement.is_active)}
                    >
                      {announcement.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
