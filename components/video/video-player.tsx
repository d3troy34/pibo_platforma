"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2 } from "lucide-react"

interface VideoPlayerProps {
  videoGuid: string
  moduleId: string
  initialProgress?: number
  onProgressUpdate?: (seconds: number, duration: number) => void
  onComplete?: () => void
}

interface PlayerJsCallback {
  seconds?: number
  duration?: number
}

declare global {
  interface Window {
    playerjs?: {
      Player: new (iframe: HTMLIFrameElement) => {
        on: (event: string, callback: (data?: PlayerJsCallback) => void) => void
        getCurrentTime: (callback: (seconds: number) => void) => void
        getDuration: (callback: (duration: number) => void) => void
        setCurrentTime: (seconds: number) => void
      }
    }
  }
}

export function VideoPlayer({
  videoGuid,
  moduleId,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastSavedRef = useRef(initialProgress)
  const completedRef = useRef(false)

  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID

  // Build embed URL
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}?autoplay=false&preload=true&responsive=true`

  // Save progress handler
  const saveProgress = useCallback(
    (seconds: number, duration: number) => {
      // Only save if we've moved at least 5 seconds
      if (Math.abs(seconds - lastSavedRef.current) >= 5) {
        lastSavedRef.current = seconds
        onProgressUpdate?.(seconds, duration)

        // Dispatch event for ModuleActions to pick up
        window.dispatchEvent(
          new CustomEvent(`video-progress-${moduleId}`, {
            detail: { seconds, duration },
          })
        )
      }

      // Check for completion (90% watched)
      if (!completedRef.current && duration > 0 && seconds / duration >= 0.9) {
        completedRef.current = true
        onComplete?.()

        // Dispatch completion event
        window.dispatchEvent(
          new CustomEvent(`video-progress-${moduleId}`, {
            detail: { seconds, duration },
          })
        )
      }
    },
    [moduleId, onProgressUpdate, onComplete]
  )

  useEffect(() => {
    const initializePlayer = () => {
      if (iframeRef.current && window.playerjs) {
        const player = new window.playerjs.Player(iframeRef.current)

        player.on("ready", () => {
          setIsLoading(false)

          // Seek to initial position
          if (initialProgress > 0) {
            player.setCurrentTime(initialProgress)
          }
        })

        // Track progress periodically during playback
        let lastTime = initialProgress
        player.on("timeupdate", (data) => {
          if (data?.seconds !== undefined && data?.duration !== undefined) {
            if (data.seconds - lastTime >= 10) {
              saveProgress(data.seconds, data.duration)
              lastTime = data.seconds
            }
          }
        })

        // Save on pause
        player.on("pause", () => {
          player.getCurrentTime((seconds) => {
            player.getDuration((duration) => {
              saveProgress(seconds, duration)
            })
          })
        })

        // Save on ended
        player.on("ended", () => {
          player.getDuration((duration) => {
            saveProgress(duration, duration)
          })
        })
      }
    }

    // Check if player.js is already loaded
    if (window.playerjs) {
      // Script already loaded, initialize player directly
      initializePlayer()
      return
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="player.js"]')
    if (existingScript) {
      existingScript.addEventListener("load", initializePlayer)
      return
    }

    // Load player.js library
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/player.js@0.1.0/dist/player.min.js"
    script.async = true
    document.body.appendChild(script)

    script.onload = initializePlayer

    script.onerror = () => {
      setIsLoading(false)
    }

    return () => {
      // Don't remove the script - it persists for reuse across navigations
    }
  }, [videoGuid, initialProgress, saveProgress])

  // Handle iframe load
  const handleIframeLoad = () => {
    if (!window.playerjs) {
      setIsLoading(false)
    }
  }

  if (!videoGuid) {
    return (
      <div className="aspect-video bg-secondary/50 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Video no disponible</p>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-background rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
      />
    </div>
  )
}
