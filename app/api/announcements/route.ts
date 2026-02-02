import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { resend } from "@/lib/resend/client"

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailPromises = enrollments.map(async (enrollment: any) => {
      const student = enrollment.profiles
      if (!student?.email) return null

      try {
        await resend.emails.send({
          from: "Mipibo <no-reply@mipibo.com>",
          to: student.email,
          subject: `📢 ${title}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(to right, #60A5FA, #22D3EE); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Mipibo</h1>
                </div>

                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                  <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">📢 ${title}</h2>

                    <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid #60A5FA; border-radius: 4px;">
                      <p style="margin: 0; white-space: pre-wrap;">${content}</p>
                    </div>

                    <div style="margin-top: 30px; text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mipibo.com'}/anuncios"
                         style="display: inline-block; background: linear-gradient(to right, #60A5FA, #22D3EE); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 500;">
                        Ver en la Plataforma
                      </a>
                    </div>
                  </div>

                  <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                    Este es un anuncio oficial de Mipibo<br>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mipibo.com'}" style="color: #60A5FA; text-decoration: none;">mipibo.com</a>
                  </p>
                </div>
              </body>
            </html>
          `,
        })
        return { success: true, email: student.email }
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error)
        return { success: false, email: student.email, error }
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
