"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSafeInternalPath } from "@/lib/navigation"
import { createClient } from "@/lib/supabase/client"

const loginSchema = z.object({
  email: z.string().email("Ingresá un email válido"),
  // Existing customers may still have passwords created under the old 6-char rule.
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()
  const redirectTo = getSafeInternalPath(searchParams.get("redirect"), "/curso")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email o contraseña incorrectos")
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Confirmá tu email antes de entrar")
        } else {
          toast.error("No pudimos iniciar sesión")
        }
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed_at")
        .eq("id", authData.user.id)
        .single()

      toast.success("Qué bueno verte de nuevo")

      if (profile?.role === "admin") {
        router.push("/admin")
      } else {
        router.push(profile?.onboarding_completed_at ? redirectTo : "/onboarding")
      }
      router.refresh()
    } catch (error) {
      console.error("Unexpected login error", error)
      toast.error("Ocurrió un error. Intentá de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-10 space-y-3">
        <p className="eyebrow">Tu espacio Pibo</p>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
          Qué bueno verte de nuevo.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Entrá para seguir exactamente por donde dejaste.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={isLoading}
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/reset-password" className="text-sm font-medium text-indigo hover:underline">
                ¿La olvidaste?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                {...register("password")}
                className={errors.password ? "border-destructive pr-12" : "pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:bg-paper hover:text-ink"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </div>

        <div className="space-y-5 border-t border-ink/10 pt-6">
          <Button type="submit" className="h-12 w-full justify-between px-6" disabled={isLoading}>
            <span className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar a mi curso
            </span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Primera vez?{" "}
            <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="font-medium text-indigo hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
