import { z } from "zod"
import type { FolderRequest } from "@/lib/settings-types"

const folderRequestSchema = z.object({
  path: z.string().trim().min(1).max(1024),
  kind: z.enum(["inbox", "archive"]),
})

/** Parses and validates a folder request body; returns null if invalid. */
export async function parseFolderRequest(req: Request): Promise<FolderRequest | null> {
  try {
    const parsed = folderRequestSchema.safeParse(await req.json())
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function invalidFolderRequest(): Response {
  return Response.json(
    { code: "validation", message: "Erwartet: path (Text) und kind (inbox | archive)" },
    { status: 400 }
  )
}
