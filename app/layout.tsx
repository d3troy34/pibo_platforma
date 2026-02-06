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
