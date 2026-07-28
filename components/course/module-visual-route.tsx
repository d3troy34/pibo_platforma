"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Heart,
  Home,
  Landmark,
  MapPin,
  Plane,
  Route,
  School,
  Search,
  ShieldAlert,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react"

import type { ModuleVisualRouteContent, VisualRouteIcon } from "@/components/course/module-visual-route-data"
import { cn } from "@/lib/utils"

const iconMap = {
  file: FileText,
  school: School,
  home: Home,
  briefcase: Briefcase,
  wallet: Wallet,
  phone: Smartphone,
  heart: Heart,
  users: Users,
  search: Search,
  plane: Plane,
  shield: ShieldAlert,
  map: MapPin,
  route: Route,
  calendar: Calendar,
  landmark: Landmark,
  clipboard: ClipboardCheck,
} as const

function RouteIcon({ icon, className }: { icon: VisualRouteIcon; className?: string }) {
  const Icon = iconMap[icon]
  return <Icon className={className} aria-hidden="true" />
}

function SlideNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display text-[5rem] leading-none tracking-[-0.08em] text-[#092033]/[0.07] sm:text-[7.5rem]",
        className
      )}
    >
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

export function ModuleVisualRoute({ route }: { route: ModuleVisualRouteContent }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const isFirstSlide = activeSlide === 0
  const isLastSlide = activeSlide === route.slideLabels.length - 1

  const goTo = useCallback(
    (nextSlide: number) => {
      setActiveSlide(Math.max(0, Math.min(nextSlide, route.slideLabels.length - 1)))
    },
    [route.slideLabels.length]
  )

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
          Ruta visual · Módulo {route.moduleNumber}
        </p>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-[#092033]/10 bg-[#fbf7f0] shadow-[0_28px_90px_rgba(9,32,51,0.14)]">
        <div className="flex items-center justify-between border-b border-[#092033]/10 bg-[#fbf7f0]/90 px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo text-xs font-bold text-white">
              {String(activeSlide + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{route.slideLabels[activeSlide]}</p>
              <p className="text-xs text-muted-foreground">Usá las flechas para avanzar</p>
            </div>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {String(activeSlide + 1).padStart(2, "0")} / {String(route.slideLabels.length).padStart(2, "0")}
          </span>
        </div>

        <div className="h-1 bg-[#092033]/5" aria-hidden="true">
          <div
            className="h-full bg-[#39bed2] transition-[width] duration-500 ease-out"
            style={{ width: `${((activeSlide + 1) / route.slideLabels.length) * 100}%` }}
          />
        </div>

        <div
          className="overflow-hidden"
          role="region"
          aria-roledescription="presentación"
          aria-label={`Ruta visual del módulo ${route.moduleNumber}: ${route.moduleTitle}`}
        >
          <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
            <SlideShell index={0} className="bg-[#092033] text-[#fbf7f0]" numberClassName="text-white/[0.07]">
              <div className="relative z-10 grid h-full gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)] lg:items-end">
                <div className="max-w-3xl self-center">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#75d7e4]">{route.hero.eyebrow}</p>
                  <h1 className="font-display text-5xl leading-[0.91] tracking-[-0.055em] sm:text-7xl lg:text-[5.35rem]">
                    {route.hero.title}
                    <span className="mt-3 block text-[#75d7e4]">{route.hero.accent}</span>
                  </h1>
                  <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-lg">{route.hero.body}</p>
                  <div className="mt-9 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.13em]">
                    {route.hero.badges.map((badge) => (
                      <span key={badge} className="rounded-full border border-white/20 bg-white/5 px-4 py-2">{badge}</span>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[1.7rem] border border-[#fbf7f0]/70 bg-[#fbf7f0] p-6 text-[#092033] shadow-[10px_11px_0_rgba(57,190,210,0.42)] sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#092033]/55">La pregunta que guía esta ruta</p>
                  <p className="mt-5 font-display text-3xl leading-tight sm:text-4xl">{route.hero.question}</p>
                  <div className="mt-9 space-y-3">
                    {route.hero.questionItems.map((item, index) => (
                      <div key={item} className="flex items-center gap-3 text-sm">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#39bed2]/20 font-mono text-[0.65rem] text-[#092033]">
                          {index + 1}
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                  <RouteIcon icon={route.hero.icon} className="absolute -bottom-10 -right-8 h-36 w-36 text-[#e9876b]/45" />
                </div>
              </div>

              <svg className="pointer-events-none absolute bottom-0 left-0 h-28 w-full text-[#e9876b]/80" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
                <path d="M-20,82 C190,17 315,125 515,70 S840,16 1220,92" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="7 9" />
              </svg>
            </SlideShell>

            <SlideShell index={1} className="bg-[#fbf7f0] text-[#092033]">
              <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div className="max-w-md">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">{route.focus.eyebrow}</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">{route.focus.title}</h2>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-base">{route.focus.body}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {route.focus.cards.map((card) => (
                    <div
                      key={card.title}
                      className="group rounded-[1.4rem] border border-[#092033]/10 bg-white/75 p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(9,32,51,0.1)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#39bed2]/20 text-[#092033]">
                        <RouteIcon icon={card.icon} className="h-5 w-5" />
                      </div>
                      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#e9876b]">{card.label}</p>
                      <h3 className="mt-1 font-display text-2xl">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SlideShell>

            <SlideShell index={2} className="bg-[#16364a] text-[#fbf7f0]" numberClassName="text-white/[0.07]">
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#75d7e4]">{route.process.eyebrow}</p>
                  <h2 className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl">{route.process.title}</h2>
                  <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">{route.process.body}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {route.process.steps.map((step, index) => (
                    <div key={step.title} className="relative rounded-[1.5rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
                      <span className="font-mono text-xs text-[#e9876b]">0{index + 1}</span>
                      <h3 className="mt-7 font-display text-3xl leading-none">{step.title}</h3>
                      <p className="mt-4 text-sm leading-6 text-white/65">{step.detail}</p>
                    </div>
                  ))}
                </div>

                <p className="border-l-2 border-[#39bed2] pl-4 text-sm leading-6 text-white/70">{route.process.footer}</p>
              </div>
              <Route className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 text-[#75d7e4]/[0.07]" strokeWidth={0.7} />
            </SlideShell>

            <SlideShell index={3} className="bg-[#fbf7f0] text-[#092033]">
              <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
                <div className="max-w-md">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">{route.planner.eyebrow}</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">{route.planner.title}</h2>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-base">{route.planner.body}</p>
                  <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-[#16364a]">
                    <ClipboardCheck className="h-5 w-5" /> Anotá lo que sabés hoy
                  </div>
                </div>

                <div className="rotate-[0.3deg] rounded-[1.7rem] border border-[#092033]/10 bg-[#fffdf8] p-4 shadow-[10px_11px_0_rgba(57,190,210,0.3)] sm:p-6">
                  <div className="flex items-center justify-between border-b border-[#092033]/10 pb-4">
                    <p className="font-display text-2xl">{route.planner.heading}</p>
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#e9876b]">{route.planner.tag}</span>
                  </div>
                  <div className="mt-2 divide-y divide-[#092033]/10">
                    {route.planner.rows.map((row) => (
                      <div key={row.label} className="grid gap-2 py-3 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
                        <p className="text-sm font-semibold">{row.label}</p>
                        <p className="text-sm leading-5 text-muted-foreground">{row.task}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-dashed border-[#092033]/15 pt-4 text-xs leading-5 text-muted-foreground">{route.planner.note}</p>
                </div>
              </div>
            </SlideShell>

            <SlideShell index={4} className="bg-[linear-gradient(140deg,#fbf7f0_0%,#fbf7f0_57%,#e4f6f8_100%)] text-[#092033]">
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div className="max-w-3xl">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">{route.verification.eyebrow}</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">{route.verification.title}</h2>
                  <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{route.verification.body}</p>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {route.verification.cards.map((card, index) => (
                    <div
                      key={card.title}
                      className={cn(
                        "rounded-[1.45rem] border p-6",
                        index === 0 ? "border-[#092033]/20 bg-[#092033] text-[#fbf7f0]" : "border-[#092033]/10 bg-white/75"
                      )}
                    >
                      <p className={cn("text-xs font-bold uppercase tracking-[0.16em]", index === 0 ? "text-[#75d7e4]" : "text-[#e9876b]")}>{card.label}</p>
                      <RouteIcon icon={card.icon} className={cn("mt-8 h-7 w-7", index === 0 ? "text-[#39bed2]" : "text-[#16364a]")} />
                      <h3 className="mt-5 font-display text-3xl">{card.title}</h3>
                      <p className={cn("mt-3 text-sm leading-6", index === 0 ? "text-white/70" : "text-muted-foreground")}>{card.detail}</p>
                    </div>
                  ))}
                </div>

                <p className="border-l-2 border-[#39bed2] pl-4 text-sm leading-6 text-muted-foreground">{route.verification.note}</p>
              </div>
            </SlideShell>

            <SlideShell index={5} className="bg-[#092033] text-[#fbf7f0]" numberClassName="text-white/[0.07]">
              <div className="relative z-10 grid h-full gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
                <div className="max-w-md">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">{route.caution.eyebrow}</p>
                  <h2 className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">{route.caution.title}</h2>
                  <p className="mt-6 text-sm leading-7 text-white/65 sm:text-base">{route.caution.body}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {route.caution.cards.map((card) => (
                    <div key={card.claim} className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5">
                      <span className="font-mono text-xs text-[#75d7e4]">NO ASUMAS</span>
                      <h3 className="mt-4 font-display text-2xl">{card.claim}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/60">{card.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-[#39bed2]" />
            </SlideShell>

            <SlideShell index={6} className="bg-[linear-gradient(135deg,#fbf7f0_0%,#e4f6f8_100%)] text-[#092033]">
              <div className="relative z-10 grid h-full gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="max-w-xl">
                  <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e9876b]">{route.closing.eyebrow}</p>
                  <h2 className="font-display text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl">{route.closing.title}</h2>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-base">{route.closing.body}</p>
                  <Link
                    href="/curso"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#092033] px-5 py-3 text-sm font-bold text-[#fbf7f0] shadow-[0_14px_35px_rgba(9,32,51,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-[#16364a]"
                  >
                    Volver a mi ruta <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-[1.7rem] border border-[#092033]/10 bg-white/80 p-5 shadow-[0_20px_50px_rgba(9,32,51,0.08)] sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9876b]">{route.closing.checklistTitle}</p>
                  <div className="mt-5 space-y-3">
                    {route.closing.checklist.map((item) => (
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
            {route.slideLabels.map((label, index) => (
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
