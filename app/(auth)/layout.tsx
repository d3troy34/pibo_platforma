import Link from "next/link"
import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <Image src="/logo.png" alt="Pibo" width={120} height={48} priority />
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Pibo. Todos los derechos reservados.
      </p>
    </div>
  )
}
