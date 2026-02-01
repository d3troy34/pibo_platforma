import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <h1 className="text-3xl font-bold text-gradient">Mipibo</h1>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Mipibo. Todos los derechos reservados.
      </p>
    </div>
  )
}
