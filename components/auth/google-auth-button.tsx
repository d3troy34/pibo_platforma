"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getSafeInternalPath } from "@/lib/navigation"
import { createClient } from "@/lib/supabase/client"

interface GoogleAuthButtonProps {
  redirectTo?: string
  disabled?: boolean
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.86A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.28.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  )
}

export function GoogleAuthButton({
  redirectTo = "/curso",
  disabled = false,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const continueWithGoogle = async () => {
    setIsLoading(true)

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin)
      callbackUrl.searchParams.set(
        "next",
        getSafeInternalPath(redirectTo, "/curso")
      )

      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) {
        toast.error("No pudimos conectarte con Google. Intentá de nuevo.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Unexpected Google sign-in error", error)
      toast.error("No pudimos conectarte con Google. Intentá de nuevo.")
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full border-ink/15 bg-white text-ink shadow-sm hover:border-indigo/35 hover:bg-paper"
      disabled={disabled || isLoading}
      onClick={continueWithGoogle}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : <GoogleMark />}
      Continuar con Google
    </Button>
  )
}
