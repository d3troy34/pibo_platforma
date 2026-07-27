"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface ResendInvitationButtonProps {
  invitationId: string
}

export function ResendInvitationButton({ invitationId }: ResendInvitationButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const resendInvitation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}/resend`, {
        method: "POST",
      })
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "No pudimos reenviar la invitación")
        return
      }

      if (result.inviteUrl) {
        await navigator.clipboard.writeText(result.inviteUrl)
        toast.success("Invitación renovada; el enlace quedó copiado")
      } else {
        toast.success(result.message || "Invitación reenviada")
      }
      router.refresh()
    } catch {
      toast.error("No pudimos reenviar la invitación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void resendInvitation()}
      disabled={isLoading}
      aria-label="Reenviar invitación"
    >
      <RefreshCw className={isLoading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
      Reenviar
    </Button>
  )
}
