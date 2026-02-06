import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-bold">Pagina no encontrada</h2>
        <p className="text-muted-foreground">
          La pagina que buscas no existe o fue movida.
        </p>
        <Link href="/">
          <Button className="btn-gradient text-primary-foreground gap-2">
            <Home className="h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
