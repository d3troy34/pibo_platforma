import { notFound } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ReplyForm } from "@/components/forum/reply-form"
import { MarkAsAnsweredButton } from "@/components/forum/mark-answered-button"
import type { Profile } from "@/types/database"

interface PageProps {
  params: Promise<{ postId: string }>
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch post with author
  const { data: post } = await supabase
    .from("forum_posts")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, role)
    `)
    .eq("id", postId)
    .single()

  if (!post) {
    notFound()
  }

  // Fetch replies with authors
  const { data: replies } = await supabase
    .from("forum_replies")
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, role)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  // Get current user's profile for checking admin status
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const isAdmin = currentProfile?.role === "admin"
  const isAuthor = user?.id === post.user_id

  const author = post.profiles as Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
            {post.title}
            {post.is_answered && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Respondida
              </Badge>
            )}
          </h1>
        </div>
        {(isAuthor || isAdmin) && !post.is_answered && (
          <MarkAsAnsweredButton postId={post.id} />
        )}
      </div>

      {/* Original Post */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={author?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {getInitials(author?.full_name || null)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{author?.full_name || "Usuario"}</span>
                {author?.role === "admin" && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground">{post.content}</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Replies Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {replies?.length || 0} {replies?.length === 1 ? "Respuesta" : "Respuestas"}
        </h2>

        {replies && replies.length > 0 ? (
          <div className="space-y-4">
            {replies.map((reply) => {
              const replyAuthor = reply.profiles as Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null
              const isAdminReply = replyAuthor?.role === "admin"

              return (
                <Card
                  key={reply.id}
                  className={`border-border/50 ${isAdminReply ? "bg-primary/5 border-primary/30" : "bg-card/50"}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={replyAuthor?.avatar_url || undefined} />
                        <AvatarFallback className={`${isAdminReply ? "bg-primary/30 text-primary" : "bg-primary/20 text-primary"}`}>
                          {getInitials(replyAuthor?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{replyAuthor?.full_name || "Usuario"}</span>
                          {isAdminReply && (
                            <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(reply.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-foreground">{reply.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No hay respuestas aun. Se el primero en responder.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reply Form */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Tu Respuesta</CardTitle>
        </CardHeader>
        <CardContent>
          <ReplyForm postId={post.id} isAdmin={isAdmin} />
        </CardContent>
      </Card>
    </div>
  )
}
