import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Pibo - Tu Camino a la Universidad",
    template: "%s | Pibo",
  },
  description: "Plataforma educativa para estudiantes latinoamericanos que se preparan para universidades argentinas.",
  keywords: ["educacion", "universidad", "argentina", "latinoamerica", "cursos", "preparacion universitaria"],
  authors: [{ name: "Pibo" }],
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Pibo - Tu Camino a la Universidad",
    description: "Plataforma educativa para estudiantes latinoamericanos",
    type: "website",
    locale: "es_AR",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GTHVR4M7VW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GTHVR4M7VW');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
