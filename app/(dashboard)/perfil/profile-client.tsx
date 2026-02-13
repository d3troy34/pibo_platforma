"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, User, Mail, Phone, Calendar } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Enrollment } from "@/types/database"

const profileSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  country: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const COUNTRIES = [
  { value: "AR", label: "Argentina" },
  { value: "BR", label: "Brasil" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "Mexico" },
  { value: "PE", label: "Peru" },
  { value: "EC", label: "Ecuador" },
  { value: "VE", label: "Venezuela" },
  { value: "UY", label: "Uruguay" },
  { value: "PY", label: "Paraguay" },
  { value: "BO", label: "Bolivia" },
  { value: "OTHER", label: "Otro" },
]

export default function ProfileClient() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single() as { data: Profile | null }

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("payment_status", "completed")
        .single() as { data: Enrollment | null }

      if (profileData) {
        setProfile(profileData)
        reset({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          country: profileData.country || "",
        })
      }

      if (enrollmentData) {
        setEnrollment(enrollmentData)
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [supabase, reset])

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("profiles") as any)
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          country: data.country || null,
        })
        .eq("id", user.id)

      if (error) {
        toast.error("Error al actualizar el perfil")
        return
      }

      toast.success("Perfil actualizado correctamente")
      router.refresh()
    } catch {
      toast.error("Ocurrio un error. Intenta de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Administra tu informacion personal
        </p>
      </div>

      {/* Profile Card */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile?.full_name || "Estudiante"}</CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Form */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Informacion Personal</CardTitle>
          <CardDescription>
            Actualiza tus datos personales
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder="Tu nombre completo"
                  className="pl-9"
                  {...register("full_name")}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="pl-9 bg-secondary/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El email no puede ser modificado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="+54 11 1234-5678"
                  className="pl-9"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pais</Label>
              <Select
                defaultValue={profile?.country || undefined}
                onValueChange={(value) => setValue("country", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu pais" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isSaving}
              className="btn-gradient text-primary-foreground"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Enrollment Info */}
      {enrollment && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Informacion de Inscripcion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de inscripcion</p>
                <p className="font-medium">
                  {enrollment.enrolled_at
                    ? format(new Date(enrollment.enrolled_at), "d 'de' MMMM, yyyy", { locale: es })
                    : "No disponible"
                  }
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Tipo de acceso</p>
              <p className="font-medium text-primary">Acceso de por vida</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

