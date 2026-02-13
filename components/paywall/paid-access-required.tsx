import Link from "next/link"
import { Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type PaidAccessRequiredProps = {
  title?: string
  description?: string
  storefrontUrl?: string
  storefrontLabel?: string
  backHref?: string
  backLabel?: string
}

const DEFAULT_STOREFRONT_URL = "https://estudiaargentina.com"

export function PaidAccessRequired({
  title = "Seccion bloqueada",
  description = "Esta seccion requiere acceso completo al curso. Compra tu acceso para desbloquear todo el contenido.",
  storefrontUrl = DEFAULT_STOREFRONT_URL,
  storefrontLabel = "Comprar acceso",
  backHref = "/curso",
  backLabel = "Volver al curso",
}: PaidAccessRequiredProps) {
  return (
    <div className="container max-w-3xl mx-auto p-6">
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-16 text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
              <Button className="btn-gradient text-primary-foreground">
                {storefrontLabel}
              </Button>
            </a>
            <Link href={backHref}>
              <Button variant="outline">{backLabel}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

