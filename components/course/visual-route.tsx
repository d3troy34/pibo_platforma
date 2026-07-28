"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Compass,
  FileText,
  Landmark,
  MapPin,
  Route,
  School,
  Search,
  ShieldAlert,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"

const slideLabels = [
  "Empezar con un plan",
  "Las cinco decisiones",
  "Elegir combinaciones",
  "Tu ficha de proyecto",
  "Cómo verificar",
  "Costos y promesas",
  "El recorrido Pibo",
  "Tu próximo paso",
]

const decisions = [
  { label: "Carrera", note: "Qué querés estudiar", icon: School },
  { label: "Ciudad", note: "Dónde lo podés sostener", icon: MapPin },
  { label: "Institución", note: "Dónde se dicta de verdad", icon: Landmark },
  { label: "Documentos", note: "Qué te va a pedir tu caso", icon: FileText },
  { label: "Presupuesto", note: "Con qué margen contás", icon: Wallet },
]

const projectFields = [
  ["Carrera o área", "Consultar el plan de estudios oficial"],
  ["Ciudad posible", "Comparar transporte, vivienda y sedes"],
  ["Instituciones", "Confirmar admisión y costos"],
  ["Fecha de inicio", "Revisar el calendario vigente"],
  ["Nacionalidad y estudios", "Continuar con el módulo 2"],
  ["Presupuesto mensual", "No asumir ingresos laborales"],
]

const courseStages = [
  { range: "01–03", title: "Punto de partida", detail: "Plan, papeles y carrera" },
  { range: "04–05", title: "Sostener el proyecto", detail: "Vivienda y trabajo" },
  { range: "06–08", title: "Vivir allá", detail: "Rutinas, salud y red" },
  { range: "09–10", title: "Decidir y llegar", detail: "Datos vigentes y plan final" },
]

function SlideNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("font-display text-[5rem] leading-none tracking-[-0.08em] text-[#092033]/[0.07] sm:text-[7.5rem]", className)}>
      {String(value + 1).padStart(2, "0")}
    </span>
  )
}

function SlideShell({
  children,
  index,
  className,
  numberClassName,
}: {
  children: React.ReactNode
  index: number
  className?: string
  numberClassName?: string
}) {
  return (
    <article
      className={cn(
        "relative min-h-[35rem] w-full shrink-0 overflow-hidden px-6 py-7 sm:min-h-[39rem] sm:px-10 sm:py-9 lg:min-h-[42rem] lg:px-14 lg:py-12",
        className
      )}
      >
      <div className="pointer-events-none absolute right-7 top-3 sm:right-11 sm:top-5">
        <SlideNumber value={index} className={numberClassName} />
      </div>
      {children}
    </article>
  )
}

export function VisualRoute() {
  const [activeSlide, setActiveSlide] = useState(0)
  const isFirstSlide = activeSlide === 0
  const isLastSlide = activeSlide === slideLabels.length - 1

  const goTo = useCallback((nextSlide: number) => {
    setActiveSlide(Math.max(0, Math.min(nextSlide, slideLabels.length - 1)))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches("input, textarea, select, button, a")) return

      if (event.key === "ArrowRight") goTo(activeSlide + 1)
      if (event.key === "ArrowLeft") goTo(activeSlide - 1)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeSlide, goTo])

  return (
    <div className="mx-auto max-w-[76rem]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/curso"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-[#16364a]"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a mi ruta
        </Link>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Ruta visual · Módulo 01
        </p>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-[#092033]/10 bg-[#fbf7f0] shadow-[0_28px_90px_rgba(9,32,51,0.14)]">
        <div className="flex items-center justify-between border-b border-[#092033]/10 bg-[#fbf7f0]/90 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo text-xs font-bold text-white">
              {String(activeSlide + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{slideLabels[activeSlide]}</p>
              <p className="text-xs text-muted-foreground">Usá las flechas para avanzar</p>
            </div>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {String(activeSlide + 1).padStart(2, "0")} / {String(slideLabels.length).padStart(2, "0")}
          </span>
        </div>

        <div className="h-1 bg-[#092033]/5" aria-hidden="true">
          <div
            className="h-full bg-[#39bed2] transition-[width] duration-500 ease-out"
            style={{ width: `${((activeSlide + 1) / slideLabels.length) * 100}%` }}
          />
        </div>

        <div className="overflow-hidden" role="region" aria-roledescription="presentación" aria-label="Ruta visual del módulo 1">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            <SlideShell index={0} className="bg-[#092033] text-[#fbf7f0]" numberClassName="text-white/[0.07]">
              <div className="relative z-10 grid h-full gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)] lg:items-end">
                <div className="max-w-3xl self-center">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#75d7e4]">Módulo 01 · empezar sin decidir a ciegas</p>
                  <h1 className="font-display text-5xl leading-[0.91] tracking-[-0.055em] sm:text-7xl lg:text-[5.35rem]">
                    No empieces por el pasaje.
                    <span className="mt-3 block text-[#75d7e4]">Empezá por un plan.</span>
                  </h1>
                  <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
                    Estudiar en Argentina se vuelve posible cuando tu idea responde preguntas concretas y cada respuesta tiene una fuente para comprobarla.
                  </p>
                  <div className="mt-9 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.13em]">
                    <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2">5 decisiones</span>
                    <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2">1 ficha</span>
                    <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2">0 atajos</span>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[1.7rem] border border-[#fbf7f0]/70 bg-[#fbf7f0] p-6 text-[#092033] shadow-[10px_11px_0_rgba(57,190,210,0.42)] sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#092033]/55">La pregunta que guía todo</p>
                  <p className="mt-5 font-display text-3xl leading-tight sm:text-4xl">
                    “¿Qué proyecto puedo cursar, financiar y sostener?”
                  </p>
                  <div className="mt-9 space-y-3">
                    {["Carrera", "Ciudad", "Institución", "Documentos", "Presupuesto"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#39bed2]/20 font-mono text-[0.65rem] text-[#092033]">{index + 1}</span>
                        {item}
                      </div>
                    ))}
                  </div>
                  <Route className="absolute -bottom-10 -right-8 h-36 w-36 text-[#e9876b]/45" strokeWidth={1} />
                </div>
              </div>

              <svg className="pointer-events-none absolute bottom-0 left-0 h-28 w-full text-[#e9876b]/80" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
                <path d="M-20,82 C190,17 315,125 515,70 S840,16 1220,92" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="7 9" />
              </svg>
            </SlideShell>

            <SlideShell index={1} className="bg-[#fbf7f0] text-[#092033]">
              <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div className="max-w-md">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">El punto de partida</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
                    Tu proyecto se aclara cuando puede responder esto.
                  </h2>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-base">
                    No hace falta tener todas las respuestas hoy. Hace falta saber cuáles ya tenés y cuáles todavía necesitás verificar.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {decisions.map(({ label, note, icon: Icon }, index) => (
                    <div
                      key={label}
                      className={cn(
                        "group rounded-[1.4rem] border border-[#092033]/10 bg-white/75 p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(9,32,51,0.1)]",
                        index === 4 && "sm:col-span-2 sm:grid sm:grid-cols-[auto_1fr] sm:items-center sm:gap-4"
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#39bed2]/20 text-[#092033]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className={cn(index === 4 && "sm:col-start-2 sm:row-start-1")}>
                        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#e9876b] sm:mt-0">Decisión {index + 1}</p>
                        <h3 className="mt-1 font-display text-2xl">{label}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SlideShell>

            <SlideShell index={2} className="bg-[#16364a] text-[#fbf7f0]" numberClassName="text-white/[0.07]">
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#75d7e4]">Una decisión más realista</p>
                  <h2 className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                    No elijas “la mejor universidad”. Elegí una combinación que te funcione.
                  </h2>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
                  {[
                    ["Carrera", "Qué querés aprender"],
                    ["Ciudad", "Dónde podés vivir"],
                    ["Institución", "Dónde se dicta"],
                  ].map(([title, text], index) => (
                    <div key={title} className="contents">
                      <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
                        <span className="font-mono text-xs text-[#e9876b]">0{index + 1}</span>
                        <h3 className="mt-7 font-display text-3xl">{title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/65">{text}</p>
                      </div>
                      {index < 2 && <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-[#75d7e4] lg:rotate-0" aria-hidden="true" />}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-2xl text-sm leading-6 text-white/70">
                    Armá hasta tres combinaciones posibles. Eso te permite comparar con datos en vez de enamorarte de una sola respuesta demasiado pronto.
                  </p>
                  <span className="w-fit rounded-full bg-[#39bed2] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#092033]">Hasta 3 opciones</span>
                </div>
              </div>
              <Compass className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 text-[#75d7e4]/[0.07]" strokeWidth={0.7} />
            </SlideShell>

            <SlideShell index={3} className="bg-[#fbf7f0] text-[#092033]">
              <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
                <div className="max-w-md">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">Tu herramienta de decisión</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
                    Construí una ficha, no una intuición.
                  </h2>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-base">
                    Cada casillero vacío no es un problema: es una tarea concreta que evita avanzar con información incompleta.
                  </p>
                  <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-[#16364a]">
                    <ClipboardCheck className="h-5 w-5" /> Anotá lo que sabés hoy
                  </div>
                </div>

                <div className="rotate-[0.3deg] rounded-[1.7rem] border border-[#092033]/10 bg-[#fffdf8] p-4 shadow-[10px_11px_0_rgba(57,190,210,0.3)] sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#092033]/10 pb-4">
                    <p className="font-display text-2xl">Mi ficha de proyecto</p>
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#e9876b]">M1</span>
                  </div>
                  <div className="mt-2 divide-y divide-[#092033]/10">
                    {projectFields.map(([label, task]) => (
                      <div key={label} className="grid gap-2 py-3 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-sm leading-5 text-muted-foreground">{task}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-dashed border-[#092033]/15 pt-4 text-xs leading-5 text-muted-foreground">
                    La ficha cambia a medida que verificás. Lo importante es que nunca te oculte lo que todavía falta confirmar.
                  </p>
                </div>
              </div>
            </SlideShell>

            <SlideShell index={4} className="bg-[linear-gradient(140deg,#fbf7f0_0%,#fbf7f0_57%,#e4f6f8_100%)] text-[#092033]">
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div className="max-w-3xl">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">Antes de decidir</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
                    La prueba está en la fuente, no en una publicación.
                  </h2>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-[1.45rem] border border-[#092033]/20 bg-[#092033] p-6 text-[#fbf7f0]">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#75d7e4]">1 · Confirmar</p>
                    <Search className="mt-8 h-7 w-7 text-[#39bed2]" />
                    <h3 className="mt-5 font-display text-3xl">Fuente oficial</h3>
                    <p className="mt-3 text-sm leading-6 text-white/70">Universidad, facultad, Migraciones o sitio estatal.</p>
                  </div>
                  <div className="rounded-[1.45rem] border border-[#092033]/10 bg-white/75 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9876b]">2 · Contrastar</p>
                    <FileText className="mt-8 h-7 w-7 text-[#16364a]" />
                    <h3 className="mt-5 font-display text-3xl">Dato específico</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">Plan, sede, admisión, arancel y fecha: cada cosa con su enlace vigente.</p>
                  </div>
                  <div className="rounded-[1.45rem] border border-[#092033]/10 bg-white/45 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">3 · Contextualizar</p>
                    <ShieldAlert className="mt-8 h-7 w-7 text-[#e9876b]" />
                    <h3 className="mt-5 font-display text-3xl">Opiniones</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">Sirven para formular preguntas, no para cerrar un requisito o un costo.</p>
                  </div>
                </div>

                <p className="border-l-2 border-[#39bed2] pl-4 text-sm leading-6 text-muted-foreground">
                  Si un dato cambia tu presupuesto, tu residencia o tu fecha de ingreso, anotá también cuándo lo consultaste.
                </p>
              </div>
            </SlideShell>

            <SlideShell index={5} className="bg-[#092033] text-[#fbf7f0]" numberClassName="text-white/[0.07]">
              <div className="relative z-10 grid h-full gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
                <div className="max-w-md">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">Poné pausa a las certezas fáciles</p>
                  <h2 className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
                    No compres una promesa.
                  </h2>
                  <p className="mt-6 text-sm leading-7 text-white/65 sm:text-base">
                    Una respuesta útil admite lo que depende de tu nacionalidad, institución, fecha y presupuesto.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["“Todo es gratis”", "Consultá la política actual de la institución para tu situación migratoria."],
                    ["“Vas a trabajar seguro”", "Primero verificá tu habilitación y calculá tus gastos sin contar ese ingreso."],
                    ["“No necesitás papeles”", "Cada universidad y trámite puede pedir documentación distinta."],
                    ["“Te garantiza empleo”", "Revisá la carrera, la profesión y las reglas del país donde querés ejercer."],
                  ].map(([claim, answer]) => (
                    <div key={claim} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5">
                      <span className="font-mono text-xs text-[#75d7e4]">NO ASUMAS</span>
                      <h3 className="mt-4 font-display text-2xl">{claim}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/60">{answer}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-[#39bed2]" />
            </SlideShell>

            <SlideShell index={6} className="bg-[#fbf7f0] text-[#092033]">
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="max-w-3xl">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">No resuelvas todo hoy</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
                    Pibo ordena el proyecto por momentos, no por ansiedad.
                  </h2>
                </div>

                <div className="grid gap-3 lg:grid-cols-4">
                  {courseStages.map(({ range, title, detail }, index) => (
                    <div key={range} className="relative rounded-[1.4rem] border border-[#092033]/10 bg-white/70 p-5">
                      <span className="font-mono text-xs font-bold text-[#e9876b]">{range}</span>
                      <h3 className="mt-8 font-display text-3xl leading-none">{title}</h3>
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">{detail}</p>
                      {index < courseStages.length - 1 && (
                        <ArrowRight className="absolute -bottom-8 left-1/2 z-10 h-5 w-5 -translate-x-1/2 rotate-90 text-[#39bed2] lg:-right-7 lg:bottom-auto lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:rotate-0" aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>

                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Volvé al módulo 9 cada vez que una decisión dependa de aranceles, fechas, residencia o datos que pueden cambiar.
                </p>
              </div>
            </SlideShell>

            <SlideShell index={7} className="bg-[linear-gradient(135deg,#fbf7f0_0%,#e4f6f8_100%)] text-[#092033]">
              <div className="relative z-10 grid h-full gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="max-w-xl">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">Cuando cierres esta presentación</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl">
                    Tu próximo paso es pequeño y concreto.
                  </h2>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-base">
                    No necesitás decidir tu vida hoy. Necesitás salir de esta clase con una primera versión verificable de tu proyecto.
                  </p>
                  <Link
                    href="/curso"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#092033] px-5 py-3 text-sm font-bold text-[#fbf7f0] shadow-[0_14px_35px_rgba(9,32,51,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-[#16364a]"
                  >
                    Volver a mi ruta <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-[1.7rem] border border-[#092033]/10 bg-white/80 p-5 shadow-[0_20px_50px_rgba(9,32,51,0.08)] sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9876b]">Checklist M1</p>
                  <div className="mt-5 space-y-3">
                    {[
                      "Definí una, dos o tres opciones académicas posibles.",
                      "Guardé los enlaces oficiales de admisión.",
                      "Registré mi fecha estimada de inicio.",
                      "Armé un presupuesto sin asumir ingresos laborales.",
                      "Sé qué datos todavía necesito verificar.",
                      "Estoy listo o lista para continuar con M2 y M3.",
                    ].map((item) => (
                      <div key={item} className="flex gap-3 border-b border-[#092033]/10 pb-3 last:border-0 last:pb-0">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#39bed2] text-[#092033]">
                          <Check className="h-3 w-3" />
                        </span>
                        <p className="text-sm leading-6">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SlideShell>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#092033]/10 bg-[#fbf7f0]/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-1" aria-label="Elegir pantalla">
            {slideLabels.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "h-2.5 rounded-full transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2",
                  activeSlide === index ? "w-8 bg-[#39bed2]" : "w-2.5 bg-[#092033]/15 hover:bg-[#092033]/35"
                )}
                aria-label={`Ir a: ${label}`}
                aria-current={activeSlide === index ? "step" : undefined}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goTo(activeSlide - 1)}
              disabled={isFirstSlide}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#092033]/10 bg-white px-4 text-sm font-semibold transition-colors hover:border-[#39bed2] hover:text-[#16364a] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button
              type="button"
              onClick={() => goTo(activeSlide + 1)}
              disabled={isLastSlide}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#092033] px-4 text-sm font-semibold text-[#fbf7f0] transition-transform hover:-translate-y-0.5 hover:bg-[#16364a] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
