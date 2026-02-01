import { InviteStudentForm } from "@/components/admin/invite-student-form"

export const metadata = {
  title: "Invitar Estudiante",
  description: "Enviar invitacion a nuevo estudiante",
}

export default function InviteStudentPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Invitar Estudiante</h1>
        <p className="text-muted-foreground mt-2">
          Envia una invitacion por email para que un estudiante se registre en la plataforma
        </p>
      </div>

      <InviteStudentForm />
    </div>
  )
}
