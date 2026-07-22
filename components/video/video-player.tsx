"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, PlayCircle } from "lucide-react"

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

interface PlayerJsPlayer {
  on: (event: string, callback: (data?: PlayerJsCallback) => void) => void
  getCurrentTime: (callback: (seconds: number) => void) => void
  getDuration: (callback: (duration: number) => void) => void
  setCurrentTime: (seconds: number) => void
}

declare global {
  interface Window {
    playerjs?: {
      Player: new (iframe: HTMLIFrameElement) => PlayerJsPlayer
    }
  }
}

const PLAYER_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/player.js@0.1.0/dist/player.min.js"
let playerScriptPromise: Promise<void> | null = null

function loadPlayerScript(): Promise<void> {
  if (window.playerjs) return Promise.resolve()
  if (playerScriptPromise) return playerScriptPromise

  playerScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PLAYER_SCRIPT_SRC}"]`)
    const script = existing || document.createElement("script")

    const handleLoad = () => (window.playerjs ? resolve() : reject(new Error("Player.js did not initialize")))
    const handleError = () => reject(new Error("Player.js could not be loaded"))

    script.addEventListener("load", handleLoad, { once: true })
    script.addEventListener("error", handleError, { once: true })

    if (!existing) {
      script.src = PLAYER_SCRIPT_SRC
      script.async = true
      document.body.appendChild(script)
    }
  }).catch((error) => {
    playerScriptPromise = null
    throw error
  })

  return playerScriptPromise!
}

export function VideoPlayer({
  videoGuid,
  moduleId,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lastSavedRef = useRef(initialProgress)
  const completedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [playerError, setPlayerError] = useState(false)
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID

  const saveProgress = useCallback(
    (seconds: number, duration: number) => {
      if (!Number.isFinite(seconds) || !Number.isFinite(duration)) return

      if (Math.abs(seconds - lastSavedRef.current) >= 5) {
        lastSavedRef.current = seconds
        onProgressUpdate?.(seconds, duration)
        window.dispatchEvent(
          new CustomEvent(`video-progress-${moduleId}`, {
            detail: { seconds, duration },
          })
        )
      }

      if (!completedRef.current && duration > 0 && seconds / duration >= 0.9) {
        completedRef.current = true
        onComplete?.()
        window.dispatchEvent(
          new CustomEvent(`video-progress-${moduleId}`, {
            detail: { seconds, duration },
          })
        )
      }
    },
    [moduleId, onComplete, onProgressUpdate]
  )

  useEffect(() => {
    let active = true

    loadPlayerScript()
      .then(() => {
        if (!active || !iframeRef.current || !window.playerjs) return

        const player = new window.playerjs.Player(iframeRef.current)
        let lastTime = initialProgress

        player.on("ready", () => {
          if (!active) return
          setIsLoading(false)
          if (initialProgress > 0) player.setCurrentTime(initialProgress)
        })

        player.on("timeupdate", (data) => {
          if (!active || data?.seconds === undefined || data.duration === undefined) return
          if (data.seconds - lastTime >= 10) {
            saveProgress(data.seconds, data.duration)
            lastTime = data.seconds
          }
        })

        player.on("pause", () => {
          if (!active) return
          player.getCurrentTime((seconds) => {
            player.getDuration((duration) => saveProgress(seconds, duration))
          })
        })

        player.on("ended", () => {
          if (!active) return
          player.getDuration((duration) => saveProgress(duration, duration))
        })
      })
      .catch((error) => {
        console.error("Could not initialize Bunny progress tracking", error)
        if (active) {
          setPlayerError(true)
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [initialProgress, saveProgress, videoGuid])

  if (!videoGuid || !libraryId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[1.5rem] bg-ink px-6 text-center text-white">
        <div>
          <PlayCircle className="mx-auto h-10 w-10 text-pink" />
          <p className="mt-4 font-medium">El video todavía no está configurado.</p>
        </div>
      </div>
    )
  }

  const embedUrl = `https://iframe.mediadelivery.net/embed/${encodeURIComponent(libraryId)}/${encodeURIComponent(videoGuid)}?autoplay=false&preload=true&responsive=true`

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[1.5rem] bg-black shadow-[0_24px_70px_rgba(18,18,18,0.22)]">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink">
          <div className="text-center text-white">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-pink" />
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/60">Preparando clase</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title="Video de la clase"
        className="absolute inset-0 h-full w-full border-0"
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />
      {playerError && (
        <p className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] text-white/80">
          El video funciona; el guardado automático puede tardar.
        </p>
      )}
    </div>
  )
}
