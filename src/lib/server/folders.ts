// Filesystem checks for configured folders (PROJ-1).
import { constants, promises as fs } from "fs"
import { cleanPath } from "@/lib/paths"
import type { FolderCheck, FolderKind } from "@/lib/settings-types"

function errCode(err: unknown): string | undefined {
  return (err as NodeJS.ErrnoException)?.code
}

/** Checks existence, type and read/write access. Counts PDFs for the inbox. */
export async function checkFolder(input: string, kind: FolderKind): Promise<FolderCheck> {
  const p = cleanPath(input)

  try {
    const stat = await fs.stat(p)
    if (!stat.isDirectory()) return { status: "not_a_directory", path: p }
  } catch (err) {
    const code = errCode(err)
    if (code === "EACCES" || code === "EPERM") return { status: "no_access", path: p }
    // ENOENT, ENOTDIR, unreachable network share etc.
    return { status: "not_found", path: p }
  }

  try {
    await fs.access(p, constants.R_OK | constants.W_OK)
    const entries = await fs.readdir(p, { withFileTypes: true })
    if (kind === "inbox") {
      const pdfCount = entries.filter((e) => e.isFile() && /\.pdf$/i.test(e.name)).length
      return { status: "ok", path: p, pdfCount }
    }
    return { status: "ok", path: p }
  } catch {
    return { status: "no_access", path: p }
  }
}

/** Creates the folder (incl. missing parents) and returns a fresh check. */
export async function createFolder(input: string, kind: FolderKind): Promise<FolderCheck> {
  const p = cleanPath(input)
  try {
    await fs.mkdir(p, { recursive: true })
  } catch (err) {
    const code = errCode(err)
    if (code === "EACCES" || code === "EPERM") return { status: "no_access", path: p }
    if (code === "EEXIST" || code === "ENOTDIR") return { status: "not_a_directory", path: p }
    throw err
  }
  return checkFolder(p, kind)
}
