import { isAbsoluteWindowsPath } from "@/lib/paths"
import { createFolder } from "@/lib/server/folders"
import { invalidFolderRequest, parseFolderRequest } from "@/lib/server/folder-request"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** POST /api/settings/create-folder – create a missing folder incl. parents */
export async function POST(req: Request) {
  if (!isLocalRequest(req)) return forbidden()
  const body = await parseFolderRequest(req)
  if (!body || !isAbsoluteWindowsPath(body.path)) return invalidFolderRequest()
  try {
    return Response.json(await createFolder(body.path, body.kind))
  } catch (err) {
    console.error("[create-folder]", err)
    return Response.json({ code: "unknown", message: "Ordner konnte nicht angelegt werden" }, { status: 500 })
  }
}
