import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "next-themes"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Pibo - Plataforma Educativa | Estudia en Argentina",
    template: "%s | Pibo",
  },
  description: "Accede a tu masterclass de Pibo. Clases en video paso a paso, guías PDF, comunidad de estudiantes y soporte personalizado para estudiar en universidades argentinas.",
  keywords: ["pibo", "plataforma educativa", "estudiar en argentina", "masterclass", "universidad argentina", "visa estudiante", "trámites migratorios", "cursos online", "UBA extranjeros"],
  authors: [{ name: "Pibo" }],
  icons: {
    icon: "/favicon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pibo - Plataforma Educativa | Estudia en Argentina",
    description: "Accede a tu masterclass de Pibo. Clases en video, guías PDF, comunidad y soporte personalizado.",
    type: "website",
    locale: "es_AR",
    siteName: "Pibo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pibo - Plataforma Educativa | Estudia en Argentina",
    description: "Masterclass paso a paso para estudiar en universidades argentinas.",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
