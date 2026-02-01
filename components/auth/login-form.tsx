"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const redirectTo = searchParams.get("redirect") || "/curso"

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email o contrasena incorrectos")
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Por favor confirma tu email antes de iniciar sesion")
        } else {
          toast.error(error.message)
        }
        return
      }

      // Check if user is admin to redirect accordingly
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile?.role === "admin") {
          toast.success("Bienvenido de vuelta!")
          router.push("/admin")
          router.refresh()
          return
        }
      }

      toast.success("Bienvenido de vuelta!")
      router.push(redirectTo)
      router.refresh()
    } catch {
      toast.error("Ocurrio un error. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Iniciar Sesion</CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder al curso
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contrasena</Label>
              <Link
                href="/reset-password"
                className="text-sm text-primary hover:underline"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full btn-gradient text-primary-foreground font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesion
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            No tienes una cuenta?{" "}
            <Link href="https://estudiaargentina.com" className="text-primary hover:underline">
              Comprar acceso
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
