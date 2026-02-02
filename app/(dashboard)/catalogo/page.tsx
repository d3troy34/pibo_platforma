import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Sparkles } from "lucide-react"

export default async function CatalogoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Catálogo de Cursos</h1>
        <p className="text-muted-foreground">
          Descubre nuevos cursos y contenido exclusivo
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-24">
          <div className="relative mb-6">
            <ShoppingBag className="h-20 w-20 text-primary/40" />
            <Sparkles className="h-8 w-8 text-accent absolute -top-2 -right-2" />
          </div>

          <h2 className="text-2xl font-bold mb-3 text-gradient">
            Próximamente
          </h2>

          <p className="text-center text-muted-foreground max-w-md mb-6">
            Estamos preparando nuevos cursos y contenido exclusivo para ti.
            Mantente atento a los anuncios para ser el primero en enterarte.
          </p>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg text-center max-w-sm">
            <p className="text-sm font-medium">
              💡 <span className="font-bold">Consejo:</span> Revisa la sección de anuncios
              regularmente para conocer las novedades
            </p>
          </div>

          {/* Future product grid placeholder - commented out for future use
          <div className="mt-12 w-full">
            <h3 className="text-lg font-semibold mb-4">Vista previa del catálogo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              Placeholder for future product cards
            </div>
          </div>
          */}
        </CardContent>
      </Card>
    </div>
  )
}
