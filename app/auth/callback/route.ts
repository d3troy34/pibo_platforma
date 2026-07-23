import { type NextRequest, NextResponse } from "next/server"

import { getSafeInternalPath } from "@/lib/navigation"
import { createClient } from "@/lib/supabase/server"

function getLoginErrorUrl(request: NextRequest, redirectTo: string) {
  const errorUrl = new URL("/login", request.url)
  errorUrl.searchParams.set("error", "oauth")
  errorUrl.searchParams.set("redirect", redirectTo)
  return errorUrl
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const redirectTo = getSafeInternalPath(
    request.nextUrl.searchParams.get("next"),
    "/curso"
  )

  if (!code || request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(getLoginErrorUrl(request, redirectTo))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    console.error("Google OAuth callback failed", {
      message: error?.message || "Missing user after code exchange",
    })
    return NextResponse.redirect(getLoginErrorUrl(request, redirectTo))
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", data.user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Could not load profile after Google sign-in", {
      code: profileError.code,
      message: profileError.message,
    })
  }

  let destination = redirectTo
  if (profile?.role === "admin") {
    destination = "/admin"
  } else if (!profile?.onboarding_completed_at) {
    destination = "/onboarding"
  }

  return NextResponse.redirect(new URL(destination, request.url))
}
