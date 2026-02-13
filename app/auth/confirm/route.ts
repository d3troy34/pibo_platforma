import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/curso"

  // Prevent open redirects. Only allow relative paths within this app.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/curso"

  const redirectTo = new URL(safeNext, request.url)

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // Return the user to an error page with some instructions
  redirectTo.pathname = "/login"
  redirectTo.searchParams.set("error", "auth")
  return NextResponse.redirect(redirectTo)
}
