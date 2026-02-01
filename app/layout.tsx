import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Mipibo - Tu Camino a la Universidad",
    template: "%s | Mipibo",
  },
  description: "Plataforma educativa para estudiantes latinoamericanos que se preparan para universidades argentinas.",
  keywords: ["educacion", "universidad", "argentina", "latinoamerica", "cursos", "preparacion universitaria"],
  authors: [{ name: "Mipibo" }],
  openGraph: {
    title: "Mipibo - Tu Camino a la Universidad",
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
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
