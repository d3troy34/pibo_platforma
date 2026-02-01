"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Mail, User, CheckCircle2, Copy } from "lucide-react"
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

const inviteSchema = z.object({
  email: z.string().email("Email invalido"),
  fullName: z.string().optional(),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export function InviteStudentForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<{
    message: string
    inviteUrl?: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  })

  const onSubmit = async (data: InviteFormValues) => {
    setIsLoading(true)
    setInviteSuccess(null)

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Error al enviar la invitacion")
        return
      }

      setInviteSuccess({
        message: result.message,
        inviteUrl: result.inviteUrl,
      })
      reset()
      router.refresh()
    } catch {
      toast.error("Ocurrio un error. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteUrl = () => {
    if (inviteSuccess?.inviteUrl) {
      navigator.clipboard.writeText(inviteSuccess.inviteUrl)
      toast.success("Link copiado al portapapeles")
    }
  }

  if (inviteSuccess) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <CardTitle>Invitacion Enviada</CardTitle>
          <CardDescription>{inviteSuccess.message}</CardDescription>
        </CardHeader>
        {inviteSuccess.inviteUrl && (
          <CardContent>
            <div className="space-y-2">
              <Label>Link de invitacion (backup)</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteSuccess.inviteUrl}
                  readOnly
                  className="text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyInviteUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes compartir este link manualmente si el email no llego
              </p>
            </div>
          </CardContent>
        )}
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setInviteSuccess(null)}
            className="flex-1"
          >
            Invitar otro
          </Button>
          <Button
            onClick={() => router.push("/admin/estudiantes")}
            className="flex-1 btn-gradient text-primary-foreground"
          >
            Ver estudiantes
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle>Nueva Invitacion</CardTitle>
        <CardDescription>
          El estudiante recibira un email con un link para completar su registro
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email del Estudiante *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="estudiante@email.com"
                className={`pl-9 ${errors.email ? "border-destructive" : ""}`}
                disabled={isLoading}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre (opcional)</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                placeholder="Juan Perez"
                className="pl-9"
                disabled={isLoading}
                {...register("fullName")}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Si conoces el nombre, aparecera en el email de invitacion
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gradient text-primary-foreground"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Invitacion
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
