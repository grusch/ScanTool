import { isAbsoluteWindowsPath } from "@/lib/paths"
import { checkFolder } from "@/lib/server/folders"
import { invalidFolderRequest, parseFolderRequest } from "@/lib/server/folder-request"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** POST /api/settings/check-folder – check a single path while the user types */
export async function POST(req: Request) {
  if (!isLocalRequest(req)) return forbidden()
  const body = await parseFolderRequest(req)
  if (!body || !isAbsoluteWindowsPath(body.path)) return invalidFolderRequest()
  try {
    return Response.json(await checkFolder(body.path, body.kind))
  } catch (err) {
    console.error("[check-folder]", err)
    return Response.json({ code: "unknown", message: "Prüfung fehlgeschlagen" }, { status: 500 })
  }
}
