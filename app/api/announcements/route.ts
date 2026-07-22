import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getResend } from "@/lib/resend/client"
import { announcementEmail } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content } = body
    const resend = getResend()

    // Get all enrolled students
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select(`
        user_id,
        profiles!enrollments_user_id_fkey(
          email,
          full_name
        )
      `)
      .eq("payment_status", "completed")

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No enrolled students to notify"
      })
    }

    // Send emails to all students
    const emailPromises = enrollments.map(async (enrollment) => {
      const student = enrollment.profiles
      if (!student?.email) return null

      try {
        await resend.emails.send({
          from: "Mipibo <no-reply@mipibo.com>",
          to: student.email,
          subject: `📢 ${title}`,
          html: announcementEmail(title, content),
        })
        return { success: true }
      } catch (error) {
        console.error("Failed to send an announcement email", error)
        return { success: false }
      }
    })

    const results = await Promise.all(emailPromises)
    const successCount = results.filter((r) => r?.success).length

    return NextResponse.json({
      success: true,
      message: `Emails sent to ${successCount} students`,
      total_students: enrollments.length,
      successful_emails: successCount,
    })
  } catch (error) {
    console.error("Error sending announcement emails:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
