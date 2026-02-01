import Link from "next/link"
import { PlayCircle, CheckCircle2, Clock, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lesson } from "@/types/database"

interface LessonCardProps {
  lesson: Lesson
  moduleId: string
  index: number
  isCompleted: boolean
  isCurrentLesson?: boolean
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) return `${remainingSeconds}s`
  if (remainingSeconds === 0) return `${minutes}min`
  return `${minutes}min ${remainingSeconds}s`
}

export function LessonCard({
  lesson,
  moduleId,
  index,
  isCompleted,
  isCurrentLesson = false,
}: LessonCardProps) {
  const resources = lesson.resources as Array<{ name: string; url: string; type: string }> | null

  return (
    <Link href={`/curso/${moduleId}/${lesson.id}`}>
      <div
        className={cn(
          "group flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
          isCurrentLesson
            ? "border-primary bg-primary/5 shadow-glow"
            : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50"
        )}
      >
        {/* Index/Status */}
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-medium transition-colors",
            isCompleted
              ? "bg-success/20 text-success"
              : isCurrentLesson
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-medium group-hover:text-primary transition-colors",
              isCurrentLesson && "text-primary"
            )}
          >
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {lesson.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {lesson.duration_seconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(lesson.duration_seconds)}
              </span>
            )}
            {resources && resources.length > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {resources.length} {resources.length === 1 ? "recurso" : "recursos"}
              </span>
            )}
          </div>
        </div>

        {/* Play button */}
        <div className="shrink-0">
          <PlayCircle
            className={cn(
              "h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors",
              isCurrentLesson && "text-primary"
            )}
          />
        </div>
      </div>
    </Link>
  )
}
