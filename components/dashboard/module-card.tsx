import Link from "next/link"
import { PlayCircle, CheckCircle2, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Module } from "@/types/database"

interface ModuleCardProps {
  module: Module
  isCompleted: boolean
  isLocked?: boolean
}

export function ModuleCard({
  module,
  isCompleted,
  isLocked = false,
}: ModuleCardProps) {
  if (isLocked) {
    return (
      <Card className="relative overflow-hidden border-border/50 bg-card/50 opacity-60">
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardHeader>
          <CardTitle className="text-lg">{module.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {module.description}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Link href={`/curso/${module.id}`}>
      <Card className="relative overflow-hidden border-border/50 bg-card/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300 cursor-pointer group">
        {/* Thumbnail */}
        {module.thumbnail_url && (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={module.thumbnail_url}
              alt={module.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {module.title}
            </CardTitle>
            {isCompleted ? (
              <Badge variant="default" className="bg-success text-success-foreground shrink-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            ) : module.bunny_video_guid ? (
              <Badge variant="secondary" className="shrink-0">
                <PlayCircle className="h-3 w-3 mr-1" />
                Video
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {module.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
