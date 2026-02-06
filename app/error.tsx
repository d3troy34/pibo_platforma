"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Algo salio mal</h1>
        <p className="text-muted-foreground">
          Ocurrio un error inesperado. Por favor, intenta de nuevo.
        </p>
        <Button onClick={reset} className="btn-gradient text-primary-foreground">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}
