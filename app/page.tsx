import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "admin") {
      redirect("/admin")
    }
    redirect("/curso")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Mipibo</h1>
          <p className="text-muted-foreground text-lg">
            Tu plataforma de preparacion para universidades argentinas
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full h-12 text-base" size="lg">
              Iniciar sesion
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          No tenes cuenta?{" "}
          <a
            href="https://estudiaargentina.com"
            className="text-primary hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Visita estudiaargentina.com
          </a>
        </p>
      </div>
    </div>
  )
}
