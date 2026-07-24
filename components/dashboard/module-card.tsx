import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Clock3, Lock, Play } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Module } from "@/types/database"

interface ModuleCardProps {
  module: Pick<
    Module,
    "id" | "title" | "description" | "thumbnail_url" | "order_index" | "duration_seconds"
  > & { has_video?: boolean }
  isCompleted: boolean
  isLocked?: boolean
  imageLoading?: "eager" | "lazy"
  displayIndex: number
}

function durationLabel(seconds: number) {
  if (!seconds) return "A tu ritmo"
  const minutes = Math.max(1, Math.round(seconds / 60))
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${minutes % 60 || ""}`.trim()
    : `${minutes} min`
}

export function ModuleCard({
  module,
  isCompleted,
  isLocked = false,
  imageLoading = "lazy",
  displayIndex,
}: ModuleCardProps) {
  const content = (
    <div
      className={cn(
        "group relative grid gap-5 rounded-2xl border border-border bg-card/65 p-5 transition-[border-color,background-color,transform,box-shadow] sm:grid-cols-[1fr_11rem] sm:items-center",
        !isLocked && "hover:-translate-y-0.5 hover:border-indigo/45 hover:bg-card hover:shadow-glow",
        isLocked && "opacity-70"
      )}
    >
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-display text-2xl text-pink">
            {String(displayIndex + 1).padStart(2, "0")}
          </span>
          {isCompleted ? (
            <Badge className="border-0 bg-indigo/10 text-indigo hover:bg-indigo/10">
              <Check className="mr-1 h-3 w-3" /> Completado
            </Badge>
          ) : module.order_index === 0 ? (
            <Badge className="border-0 bg-pink/10 text-pink hover:bg-pink/10">Primera clase</Badge>
          ) : null}
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.02em] group-hover:text-indigo">
          {module.title}
        </h3>
        {module.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {module.description}
          </p>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {durationLabel(module.duration_seconds)}
          </span>
          <span className="flex items-center gap-1.5 text-indigo">
            {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isLocked ? "Acceso completo" : "Abrir etapa"}
          </span>
        </div>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-secondary">
        {module.thumbnail_url ? (
          <Image
            src={module.thumbnail_url}
            alt=""
            fill
            loading={imageLoading}
            sizes="176px"
            className={cn("object-cover transition-transform duration-500", !isLocked && "group-hover:scale-[1.03]")}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,hsl(var(--indigo)/0.12),hsl(var(--pink)/0.08))]">
            {isLocked ? <Lock className="h-6 w-6 text-muted-foreground" /> : <Play className="h-6 w-6 text-indigo" />}
          </div>
        )}
        {!isLocked && (
          <span className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card text-indigo shadow-lg">
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  )

  if (isLocked) {
    return (
      <div>
        {content}
        <a
          href="https://estudiaargentina.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block"
        >
          <Button variant="link" className="h-auto px-1 text-pink">
            Desbloquear esta etapa <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    )
  }

  return <Link href={`/curso/${module.id}`}>{content}</Link>
}
