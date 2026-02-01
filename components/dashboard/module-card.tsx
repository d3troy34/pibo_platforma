import Link from "next/link"
import { PlayCircle, CheckCircle2, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { Module } from "@/types/database"

interface ModuleCardProps {
  module: Module
  lessonCount: number
  completedLessons: number
  isLocked?: boolean
}

export function ModuleCard({
  module,
  lessonCount,
  completedLessons,
  isLocked = false,
}: ModuleCardProps) {
  const progress = lessonCount > 0
    ? Math.round((completedLessons / lessonCount) * 100)
    : 0
  const isCompleted = progress === 100

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
            ) : progress > 0 ? (
              <Badge variant="secondary" className="shrink-0">
                {progress}%
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {module.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <PlayCircle className="h-4 w-4" />
                {lessonCount} {lessonCount === 1 ? "leccion" : "lecciones"}
              </span>
              <span className="text-muted-foreground">
                {completedLessons}/{lessonCount}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
