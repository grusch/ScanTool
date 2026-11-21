import { z } from "zod"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"
import { getSettingsStatus, saveSettings } from "@/lib/server/settings-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const saveSchema = z.object({
  inboxPath: z.string().trim().min(1).max(1024),
  archivePath: z.string().trim().min(1).max(1024),
})

/** GET /api/settings – saved paths, their current check status, API key presence */
export async function GET(req: Request) {
  if (!isLocalRequest(req)) return forbidden()
  try {
    return Response.json(await getSettingsStatus())
  } catch (err) {
    console.error("[GET /api/settings]", err)
    return Response.json({ code: "unknown", message: "Einstellungen konnten nicht gelesen werden" }, { status: 500 })
  }
}

/** PUT /api/settings – validate and persist both folder paths */
export async function PUT(req: Request) {
  if (!isLocalRequest(req)) return forbidden()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ code: "validation", message: "Ungültige Anfrage" }, { status: 400 })
  }
  const parsed = saveSchema.safeParse(body)
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]
    return Response.json(
      {
        code: "validation",
        message: "Pflichtfeld",
        field: field === "inboxPath" || field === "archivePath" ? field : undefined,
      },
      { status: 400 }
    )
  }

  try {
    const result = await saveSettings(parsed.data)
    if (!result.ok) return Response.json(result.error, { status: 400 })
    return Response.json(result.settings)
  } catch (err) {
    console.error("[PUT /api/settings]", err)
    return Response.json({ code: "unknown", message: "Speichern fehlgeschlagen" }, { status: 500 })
  }
}
