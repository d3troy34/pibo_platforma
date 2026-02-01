import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, MessageCircle, CheckCircle2, User } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function ForoPage() {
  const supabase = await createClient()

  // Fetch posts with author info and reply count
  const { data: posts } = await supabase
    .from("forum_posts")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, role),
      forum_replies (id)
    `)
    .order("created_at", { ascending: false })

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Foro de Preguntas</h1>
          <p className="text-muted-foreground mt-1">
            Haz preguntas y ayuda a otros estudiantes
          </p>
        </div>
        <Link href="/foro/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Pregunta
          </Button>
        </Link>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post) => {
            const author = post.profiles as { id: string; full_name: string | null; avatar_url: string | null; role: string } | null
            const repliesCount = Array.isArray(post.forum_replies) ? post.forum_replies.length : 0

            return (
              <Link key={post.id} href={`/foro/${post.id}`}>
                <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={author?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(author?.full_name || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                            <span className="truncate">{post.title}</span>
                            {post.is_answered && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Respondida
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {post.content}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{author?.full_name || "Usuario"}</span>
                        {author?.role === "admin" && (
                          <Badge variant="secondary" className="text-xs ml-1">Admin</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{repliesCount} {repliesCount === 1 ? "respuesta" : "respuestas"}</span>
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay preguntas aun</h3>
              <p className="text-muted-foreground mb-4">
                Se el primero en hacer una pregunta
              </p>
              <Link href="/foro/nuevo">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Hacer Pregunta
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
