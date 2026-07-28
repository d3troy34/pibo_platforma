import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, BookOpen, MessagesSquare, RefreshCw, ShieldCheck } from "lucide-react"

import { BrandLogo } from "@/components/brand/brand-logo"
import { createClient } from "@/lib/supabase/server"
import { MARKETING_URL, SITE_URL, landingJsonLd } from "@/lib/site"

export const metadata: Metadata = {
  title: "Plataforma de estudiantes de Pibo",
  description:
    "Acá cursás la masterclass de Pibo para estudiar en Argentina: 9 módulos en video, guías en PDF, comunidad privada y soporte. Ingresá con tu cuenta de estudiante.",
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  // Opts back in over the app-wide noindex default set in app/layout.tsx.
  // This is the only crawlable page on the domain.
  robots: {
    index: true,
    follow: true,
  },
}

const features = [
  {
    icon: BookOpen,
    title: "9 módulos en video",
    body: "Desde los trámites migratorios en tu país hasta tu primer día de clases en Argentina, en orden y sin vueltas.",
  },
  {
    icon: RefreshCw,
    title: "Actualizaciones incluidas",
    body: "Cuando cambia la normativa migratoria argentina, el contenido se actualiza y ya lo tenés en tu cuenta.",
  },
  {
    icon: MessagesSquare,
    title: "Comunidad y soporte",
    body: "Un espacio privado con otros estudiantes que están haciendo el mismo trámite que vos, y soporte directo.",
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Students go straight to where they left off. Only anonymous visitors —
  // and crawlers — ever see the landing below.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed_at")
      .eq("id", user.id)
      .single()

    if (profile?.role === "admin") redirect("/admin")
    redirect(profile?.onboarding_completed_at ? "/curso" : "/onboarding")
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd) }}
      />

      <div className="min-h-screen">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <BrandLogo href="/" priority className="text-[2.4rem]" />
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold transition hover:border-indigo hover:text-indigo"
          >
            Entrar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <main className="mx-auto max-w-5xl px-6 pb-24">
          <section className="py-14">
            <p className="eyebrow mb-5">Plataforma de estudiantes</p>
            <h1 className="display-title max-w-3xl">
              Acá cursás tu mudanza a <span className="text-pink">Argentina.</span>
            </h1>

            {/* Definition block: answers "what is mipibo.com?" in one self-contained
                passage, which is the unit AI answer engines extract. */}
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Pibo es una plataforma educativa argentina donde los estudiantes
              latinoamericanos cursan la Master Class para estudiar en Argentina
              siendo extranjeros. Incluye nueve módulos en video, guías en PDF
              descargables, una comunidad privada y soporte personalizado sobre
              trámites migratorios, convalidación del título secundario,
              inscripción a universidades y vivienda en Buenos Aires.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-indigo px-7 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Entrar a mi curso
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`${MARKETING_URL}/`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
              >
                Todavía no soy estudiante
              </a>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-indigo" />
              El acceso al contenido requiere una cuenta de estudiante.
            </p>
          </section>

          <section className="editorial-rule grid gap-6 pt-14 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <article key={title} className="paper-panel p-6">
                <Icon className="h-5 w-5 text-indigo" />
                <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em]">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </section>

          <section className="editorial-rule mt-16 pt-14">
            <h2 className="font-display text-3xl tracking-[-0.03em]">
              Preguntas frecuentes
            </h2>
            <dl className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <dt className="font-semibold">¿Qué es mipibo.com?</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Es la plataforma privada donde los estudiantes que compraron la
                  Master Class de Pibo acceden al contenido. La información
                  comercial y las guías abiertas están en{" "}
                  <a
                    href={`${MARKETING_URL}/`}
                    className="text-indigo underline-offset-4 hover:underline"
                  >
                    estudiaargentina.com
                  </a>
                  .
                </dd>
              </div>
              <div>
                <dt className="font-semibold">¿Cómo obtengo una cuenta?</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  La cuenta se crea automáticamente al comprar la Master Class:
                  vas a recibir un email con la invitación de acceso. No hay
                  registro abierto sin compra previa.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">¿El acceso vence?</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  No. La compra es un pago único y el acceso es ilimitado,
                  incluidas todas las actualizaciones futuras del contenido.
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Olvidé mi contraseña</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Podés recuperarla desde{" "}
                  <Link
                    href="/reset-password"
                    className="text-indigo underline-offset-4 hover:underline"
                  >
                    recuperar contraseña
                  </Link>{" "}
                  con el mismo email con el que compraste.
                </dd>
              </div>
            </dl>
          </section>
        </main>

        <footer className="editorial-rule mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Pibo</span>
          <a href={`${MARKETING_URL}/`} className="hover:text-ink">
            estudiaargentina.com
          </a>
        </footer>
      </div>
    </>
  )
}
