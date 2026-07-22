import Image from "next/image"
import { ShieldCheck } from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-ink/10 lg:block">
        <Image
          src="/pibo-login-hero.png"
          alt="Estudiante frente al Congreso de la Nación Argentina"
          fill
          priority
          sizes="58vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/92 via-paper/25 to-ink/35" />
        <div className="absolute left-10 top-10 h-72 w-[78%] rounded-tl-[2rem] border-l-4 border-t-4 border-indigo" />
        <div className="absolute bottom-10 left-10 h-[42%] w-[72%] rounded-bl-[2rem] border-b-4 border-l-4 border-pink" />

        <div className="absolute left-16 top-20 max-w-[34rem]">
          <p className="eyebrow mb-5">Tu camino, más claro</p>
          <h1 className="font-display text-6xl leading-[0.94] tracking-[-0.045em] text-ink xl:text-7xl">
            Tu futuro en Argentina empieza <span className="text-pink">acá.</span>
          </h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-ink/75">
            Clases, guías y acompañamiento para avanzar paso a paso.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-14 xl:px-20">
        <header className="flex items-center justify-between">
          <BrandLogo href="/" className="text-[2.8rem]" />
          <span className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4 text-indigo" />
            Acceso protegido
          </span>
        </header>

        <main className="my-auto w-full max-w-[34rem] py-14">{children}</main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Pibo</span>
          <span>Tu progreso queda guardado.</span>
        </footer>
      </section>
    </div>
  )
}
