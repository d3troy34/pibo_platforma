/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")

function readEnvLocal() {
  const p = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(p)) return ""
  return fs.readFileSync(p, "utf8")
}

function getEnv(name) {
  if (process.env[name]) return process.env[name]
  const env = readEnvLocal()
  const m = env.match(new RegExp(`^${name}=(.*)$`, "m"))
  return m ? m[1].trim() : ""
}

async function main() {
  const projectUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const anon = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!projectUrl || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  const url =
    `${projectUrl}/rest/v1/modules` +
    `?select=id,title,order_index,bunny_video_guid,resources` +
    `&is_published=eq.true` +
    `&order=order_index.asc`

  const resp = await fetch(url, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  })

  if (!resp.ok) {
    console.log("Anon SELECT blocked (good):", { status: resp.status })
    process.exitCode = 0
    return
  }

  const data = await resp.json()
  const rows = Array.isArray(data) ? data : []

  console.log("Anon SELECT modules rows:", rows.length)
  const sample = rows.slice(0, 3).map((m) => ({
    id: m.id,
    order_index: m.order_index,
    title: m.title,
    has_video_guid: !!m.bunny_video_guid,
    resources_type: typeof m.resources,
    resources_len: Array.isArray(m.resources) ? m.resources.length : null,
  }))
  console.log(JSON.stringify(sample, null, 2))

  // If anon can read ANY published modules, that's a leak for this product spec.
  process.exitCode = rows.length > 0 ? 1 : 0
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
