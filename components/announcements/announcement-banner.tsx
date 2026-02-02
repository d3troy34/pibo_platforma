"use client"

import { useState, useEffect } from "react"
import { X, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Announcement } from "@/types/database"

interface AnnouncementBannerProps {
  announcement: Announcement | null
}

export function AnnouncementBanner({ announcement }: AnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (announcement) {
      const dismissedId = localStorage.getItem("dismissed_announcement")
      setIsDismissed(dismissedId === announcement.id)
    }
  }, [announcement])

  if (!announcement || isDismissed) {
    return null
  }

  const handleDismiss = () => {
    localStorage.setItem("dismissed_announcement", announcement.id)
    setIsDismissed(true)
  }

  return (
    <div className="bg-gradient-to-r from-accent/10 to-accent-blue/10 border-b border-accent/20 animate-in slide-in-from-top duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <Megaphone className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{announcement.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {announcement.content}
            </p>
            <Link
              href="/anuncios"
              className="text-sm text-accent hover:underline inline-block mt-1"
            >
              Ver todos los anuncios →
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
