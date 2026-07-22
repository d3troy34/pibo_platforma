"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  FileCheck2,
  GraduationCap,
  Plane,
  WalletCards,
} from "lucide-react"
import { toast } from "sonner"

import { BrandLogo } from "@/components/brand/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type Goal = "university" | "documents" | "arrival" | "budget"

interface OnboardingFlowProps {
  profile: {
    full_name: string | null
    country: string | null
    goal: string | null
    target_university: string | null
    target_arrival_date: string | null
  } | null
}

const goals: Array<{
  value: Goal
  label: string
  description: string
  icon: typeof GraduationCap
}> = [
  {
    value: "university",
    label: "Elegir universidad",
    description: "Comparar opciones y tomar una decisión.",
    icon: GraduationCap,
  },
  {
    value: "documents",
    label: "Preparar documentos",
    description: "Ordenar apostillas, traducciones y requisitos.",
    icon: FileCheck2,
  },
  {
    value: "arrival",
    label: "Llegar a Argentina",
    description: "Planificar viaje, residencia y primeros días.",
    icon: Plane,
  },
  {
    value: "budget",
    label: "Organizar presupuesto",
    description: "Entender costos, vivienda y gastos reales.",
    icon: WalletCards,
  },
]

export function OnboardingFlow({ profile }: OnboardingFlowProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState<Goal | null>((profile?.goal as Goal) || null)
  const [country, setCountry] = useState(profile?.country || "")
  const [university, setUniversity] = useState(profile?.target_university || "")
  const [arrivalDate, setArrivalDate] = useState(profile?.target_arrival_date || "")
  const [saving, setSaving] = useState(false)

  const selectedGoal = goals.find((item) => item.value === goal)
  const progress = `${(step / 3) * 100}%`

  const finish = async () => {
    if (!goal || !country || !arrivalDate) {
      toast.error("Completá los datos principales para continuar")
      return
    }

    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login?redirect=/onboarding")
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        goal,
        country: country.trim(),
        target_university: university.trim() || null,
        target_arrival_date: arrivalDate,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    setSaving(false)

    if (error) {
      toast.error("No pudimos guardar tu plan. Probá otra vez.")
      return
    }

    toast.success("Tu ruta inicial ya está lista")
    router.push("/curso")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-paper px-5 py-6 sm:px-8 lg:px-12">
      <header className="mx-auto flex max-w-[1500px] items-center gap-8">
        <BrandLogo href="/" className="text-[2.6rem]" />
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-indigo transition-[width] duration-500"
            style={{ width: progress }}
          />
        </div>
        <span className="text-sm font-semibold">{step} de 3</span>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-12 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        <section className="max-w-2xl">
          {step === 1 && (
            <>
              <p className="eyebrow mb-4">Empecemos por vos</p>
              <h1 className="display-title">
                Armemos tu <span className="text-pink">camino.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Contanos qué querés resolver primero y ordenamos el contenido para que no pierdas tiempo.
              </p>

              <fieldset className="mt-10 grid gap-3 sm:grid-cols-2">
                <legend className="mb-4 text-lg font-semibold">¿Cuál es tu objetivo principal?</legend>
                {goals.map((item) => {
                  const Icon = item.icon
                  const selected = goal === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setGoal(item.value)}
                      className={cn(
                        "group relative min-h-36 rounded-2xl border p-5 text-left transition-colors",
                        selected
                          ? "border-indigo bg-indigo/[0.06]"
                          : "border-border bg-card/60 hover:border-indigo/50"
                      )}
                    >
                      <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-paper text-indigo">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </span>
                      {selected && (
                        <span className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
              <p className="eyebrow mb-4">Un poco de contexto</p>
              <h1 className="display-title">Hagamos la ruta más precisa.</h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                No hace falta tener todo decidido. Estos datos se pueden cambiar después.
              </p>

              <div className="mt-10 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="country">País desde donde venís</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder="Ej. Colombia"
                    autoComplete="country-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrival-date">¿Cuándo te gustaría llegar?</Label>
                  <Input
                    id="arrival-date"
                    type="date"
                    value={arrivalDate}
                    onChange={(event) => setArrivalDate(event.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">Universidad que tenés en mente (opcional)</Label>
                  <Input
                    id="university"
                    value={university}
                    onChange={(event) => setUniversity(event.target.value)}
                    placeholder="Ej. UBA"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="eyebrow mb-4">Tu punto de partida</p>
              <h1 className="display-title">Listo. Ya sabemos por dónde empezar.</h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Priorizaremos {selectedGoal?.label.toLowerCase()} y te iremos mostrando el siguiente paso.
              </p>

              <dl className="mt-10 divide-y divide-border border-y border-border">
                <div className="flex items-center justify-between gap-5 py-5">
                  <dt className="text-sm text-muted-foreground">Objetivo</dt>
                  <dd className="font-semibold">{selectedGoal?.label}</dd>
                </div>
                <div className="flex items-center justify-between gap-5 py-5">
                  <dt className="text-sm text-muted-foreground">Origen</dt>
                  <dd className="font-semibold">{country}</dd>
                </div>
                <div className="flex items-center justify-between gap-5 py-5">
                  <dt className="text-sm text-muted-foreground">Fecha estimada</dt>
                  <dd className="font-semibold">{arrivalDate}</dd>
                </div>
              </dl>
            </>
          )}

          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1 || saving}
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                className="btn-gradient min-w-40 text-white"
                onClick={() => setStep((current) => Math.min(3, current + 1))}
                disabled={(step === 1 && !goal) || (step === 2 && (!country || !arrivalDate))}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="btn-gradient min-w-48 text-white"
                onClick={finish}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Ver mi ruta"}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </section>

        <aside className="relative min-h-[32rem] overflow-hidden rounded-[2rem] border border-border bg-card/70 p-8 lg:p-12">
          <div className="absolute right-10 top-8 rotate-6 rounded-lg border-2 border-indigo/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo">
            Buenos Aires
          </div>
          <p className="eyebrow">Tu ruta inicial</p>
          <div className="relative mt-20 space-y-14">
            <div className="absolute bottom-8 left-6 top-8 w-1 rounded-full bg-pink" />
            {[
              { icon: Building2, title: "Plan", copy: "Definimos prioridades y opciones." },
              { icon: FileCheck2, title: "Trámites", copy: "Ordenamos cada documento." },
              { icon: Plane, title: "Llegada", copy: "Te preparamos para aterrizar." },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="relative flex items-center gap-6">
                  <span className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-pink bg-card text-pink">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className={cn(index === step - 1 && "text-indigo")}>
                    <p className="font-display text-3xl">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="absolute bottom-8 right-8 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-indigo" />
            Podés cambiar tu plan cuando quieras.
          </div>
        </aside>
      </main>
    </div>
  )
}
