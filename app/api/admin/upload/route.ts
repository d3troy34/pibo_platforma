import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUCKET = "lesson-resources"
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

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

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const lessonId = formData.get("lessonId") as string | null

    if (!file || !lessonId) {
      return NextResponse.json(
        { error: "File and lessonId are required" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo no puede superar 20MB" },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF, PowerPoint y Word" },
        { status: 400 }
      )
    }

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (!buckets?.find((b) => b.name === BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
      })
    }

    // Upload file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filePath = `${lessonId}/${Date.now()}_${safeName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Error al subir el archivo" },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath)

    // Determine type
    let type: "pdf" | "doc" | "other" = "other"
    if (file.type === "application/pdf") type = "pdf"
    else if (file.type.includes("word") || file.type.includes("document"))
      type = "doc"

    return NextResponse.json({
      success: true,
      resource: {
        name: file.name,
        url: publicUrl,
        type,
      },
    })
  } catch (error) {
    console.error("Error in upload:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Extract path from public URL
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split(`/${BUCKET}/`)
    if (pathParts.length < 2) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    const filePath = decodeURIComponent(pathParts[1])

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([filePath])

    if (error) {
      console.error("Delete error:", error)
      return NextResponse.json(
        { error: "Error al eliminar el archivo" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
