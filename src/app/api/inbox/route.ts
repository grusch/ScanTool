import { listInbox } from "@/lib/server/inbox"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/inbox – finished PDFs in the configured inbox, oldest first.
 * Lists only the folder from the saved settings (no path parameter).
 * Folder problems are reported via `status` with HTTP 200.
 */
export async function GET(req: Request) {
  if (!isLocalRequest(req)) return forbidden()
  try {
    return Response.json(await listInbox())
  } catch (err) {
    console.error("[GET /api/inbox]", err)
    return Response.json({ code: "unknown", message: "Eingang konnte nicht gelesen werden" }, { status: 500 })
  }
}
