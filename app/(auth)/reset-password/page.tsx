"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react"
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

const resetSchema = z.object({
  email: z.string().email("Email invalido"),
})

type ResetFormValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(result.error || "Error al enviar el email")
        return
      }

      setIsSubmitted(true)
    } catch {
      toast.error("Ocurrio un error. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <CardTitle className="text-2xl">Revisa tu email</CardTitle>
          <CardDescription>
            Te enviamos un enlace para restablecer tu contrasena
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a iniciar sesion
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Restablecer Contrasena</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full btn-gradient text-primary-foreground font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar enlace
          </Button>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a iniciar sesion
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
