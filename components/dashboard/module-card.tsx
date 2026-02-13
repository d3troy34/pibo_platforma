import Link from "next/link"
import { PlayCircle, CheckCircle2, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      <Card className="relative overflow-hidden border-border/50 bg-card/50">
        {module.thumbnail_url && (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={module.thumbnail_url}
              alt={module.title}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-10">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Bloqueado</span>
          <a
            href="https://estudiaargentina.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="btn-gradient text-primary-foreground">
              Comprar acceso
            </Button>
          </a>
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

  const isFree = module.order_index === 0

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
            ) : isFree ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
                Gratis
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
