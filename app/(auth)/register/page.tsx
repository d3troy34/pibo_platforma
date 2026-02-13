import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Crear Cuenta",
  description: "Crea tu cuenta en Mipibo",
}

function RegisterFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}
