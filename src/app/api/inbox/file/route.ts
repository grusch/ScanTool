import { forbidden, isLocalRequest } from "@/lib/server/local-guard"
import { inlineDisposition, readScanFile } from "@/lib/server/scan-file"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ERRORS = {
  invalid_name: { status: 400, message: "Ungültiger Dateiname" },
  not_found: { status: 404, message: "Der Scan ist nicht mehr im Eingang" },
  unreachable: { status: 503, message: "Eingangsordner nicht erreichbar" },
  no_access: { status: 403, message: "Kein Zugriff auf den Scan" },
  unknown: { status: 500, message: "Scan konnte nicht gelesen werden" },
} as const

/**
 * GET /api/inbox/file?name=<Dateiname> – one PDF from the configured inbox, for the
 * preview and "Open in new tab". Only a file name is accepted, never a path.
 */
export async function GET(req: Request) {
  if (!isLocalRequest(req)) return forbidden()

  const name = new URL(req.url).searchParams.get("name")
  const result = await readScanFile(name)
  if (!result.ok) {
    const e = ERRORS[result.code]
    return Response.json({ code: result.code, message: e.message }, { status: e.status, headers: { "Cache-Control": "no-store" } })
  }

  return new Response(new Uint8Array(result.data), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(result.data.length),
      "Content-Disposition": inlineDisposition(result.name),
      // A replaced file with the same name must show its new content
      "Cache-Control": "no-store",
    },
  })
}
