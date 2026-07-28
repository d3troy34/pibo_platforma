import type { Metadata } from "next"
import localFont from "next/font/local"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"
import { SITE_URL } from "@/lib/site"

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pibo — Plataforma de estudiantes",
    template: "%s | Pibo",
  },
  description:
    "Plataforma donde los estudiantes de Pibo cursan la masterclass para estudiar en Argentina: clases en video, guías en PDF, comunidad y soporte personalizado.",
  authors: [{ name: "Pibo" }],
  icons: {
    icon: "/brand/pibo-mark.png",
    apple: "/brand/pibo-mark.png",
  },
  /**
   * Noindex is the default for the entire app because every route below this
   * layout sits behind authentication (see middleware.ts). Indexing a login wall
   * produces thin pages that compete with estudiaargentina.com for the same
   * brand queries while offering a crawler nothing to read.
   *
   * The public landing in app/page.tsx opts back in explicitly, so any new
   * private route inherits noindex without anyone having to remember.
   */
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Pibo — Plataforma de estudiantes",
    description:
      "Acceso de estudiantes a la masterclass de Pibo: clases en video, guías en PDF, comunidad y soporte.",
    type: "website",
    locale: "es_AR",
    siteName: "Pibo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pibo — Plataforma de estudiantes",
    description: "Acceso de estudiantes a la masterclass de Pibo.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-JJGJ74RJZX" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JJGJ74RJZX');
          `}
        </Script>
      </head>
      <body className={`${geist.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
