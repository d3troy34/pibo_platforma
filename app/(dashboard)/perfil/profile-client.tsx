"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Loader2, Mail, MapPin, Phone, Target, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Enrollment, Profile } from "@/types/database"

const profileSchema = z.object({
  full_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  phone: z.string().max(40).optional(),
  country: z.string().max(40).optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const COUNTRIES = [
  { value: "AR", label: "Argentina" },
  { value: "BR", label: "Brasil" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "México" },
  { value: "PE", label: "Perú" },
  { value: "EC", label: "Ecuador" },
  { value: "VE", label: "Venezuela" },
  { value: "UY", label: "Uruguay" },
  { value: "PY", label: "Paraguay" },
  { value: "BO", label: "Bolivia" },
  { value: "OTHER", label: "Otro" },
] as const

const GOAL_LABELS: Record<string, string> = {
  estudiar: "Estudiar en Argentina",
  trabajar: "Trabajar en Argentina",
  mudarme: "Organizar mi mudanza",
  explorar: "Explorar mis opciones",
}

interface ProfileClientProps {
  initialProfile: Profile
  initialEnrollment: Enrollment | null
}

function getInitials(name: string | null): string {
  if (!name) return "PI"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileClient({ initialProfile, initialEnrollment }: ProfileClientProps) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialProfile.full_name || "",
      phone: initialProfile.phone || "",
      country: initialProfile.country || "",
    },
  })

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true)

    try {
      const updates = {
        full_name: values.full_name.trim(),
        phone: values.phone?.trim() || null,
        country: values.country || null,
      }
      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id)

      if (error) throw error

      setProfile((current) => ({ ...current, ...updates }))
      toast.success("Perfil actualizado")
      router.refresh()
    } catch (error) {
      console.error("Could not update profile", error)
      toast.error("No pudimos guardar los cambios")
    } finally {
      setIsSaving(false)
    }
  }

  const goalLabel = profile.goal ? GOAL_LABELS[profile.goal] || profile.goal : "Definir mi próximo paso"

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header className="border-b border-ink/10 pb-8">
        <p className="eyebrow mb-3">Tu espacio</p>
        <h1 className="display-title text-5xl sm:text-6xl">Perfil y objetivo.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Mantené tus datos al día para que la ruta y el acompañamiento tengan contexto.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-5">
          <section className="rounded-[2rem] bg-indigo p-7 text-white shadow-pibo">
            <Avatar className="h-20 w-20 border border-white/20">
              <AvatarImage src={profile.avatar_url || undefined} alt="" />
              <AvatarFallback className="bg-white/15 font-display text-2xl text-white">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-6 font-display text-3xl">{profile.full_name || "Estudiante Pibo"}</h2>
            <p className="mt-1 text-sm text-white/70">{profile.email}</p>

            <div className="mt-8 border-t border-white/20 pt-6">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/60">Tu norte</p>
              <div className="mt-3 flex items-start gap-3">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-pink" />
                <p className="font-medium leading-6">{goalLabel}</p>
              </div>
              {profile.target_university && (
                <p className="mt-3 text-sm leading-6 text-white/70">{profile.target_university}</p>
              )}
            </div>
          </section>

          <section className="paper-panel p-6">
            <p className="eyebrow mb-4">Acceso</p>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-indigo" />
              <div>
                <p className="font-semibold text-ink">
                  {initialEnrollment ? "Acceso completo" : "Cuenta activa"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {initialEnrollment?.enrolled_at
                    ? `Desde el ${format(new Date(initialEnrollment.enrolled_at), "d 'de' MMMM 'de' yyyy", { locale: es })}`
                    : "Podés completar tu perfil y recorrer la clase abierta."}
                </p>
              </div>
            </div>
          </section>
        </aside>

        <section className="paper-panel p-6 sm:p-8">
          <div className="mb-8">
            <p className="eyebrow mb-2">Datos personales</p>
            <h2 className="font-display text-3xl">Lo esencial, sin vueltas.</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="full_name" className="pl-11" autoComplete="name" {...register("full_name")} />
              </div>
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" value={profile.email} disabled className="bg-paper pl-11" />
              </div>
              <p className="text-xs text-muted-foreground">Para cambiarlo, escribinos desde Soporte.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="phone" className="pl-11" placeholder="+54 11 1234 5678" autoComplete="tel" {...register("phone")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select defaultValue={profile.country || undefined} onValueChange={(value) => setValue("country", value, { shouldDirty: true })}>
                    <SelectTrigger id="country" className="pl-11">
                      <SelectValue placeholder="Seleccioná tu país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-ink/10 pt-6">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
