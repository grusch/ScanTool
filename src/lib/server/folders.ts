// Filesystem checks for configured folders (PROJ-1).
import { constants, promises as fs } from "fs"
import { cleanPath } from "@/lib/paths"
import type { FolderCheck, FolderKind } from "@/lib/settings-types"
import { isSmbHostReachable, TimeoutError, uncHost, withTimeout } from "./network"

/** Upper bound for any single folder check (slow network shares). */
export const FOLDER_CHECK_TIMEOUT_MS = 10_000

function errCode(err: unknown): string | undefined {
  return (err as NodeJS.ErrnoException)?.code
}

/** For network paths: null if reachable, otherwise an "unreachable" result. */
export async function networkGuard(p: string): Promise<FolderCheck | null> {
  const host = uncHost(p)
  if (host && !(await isSmbHostReachable(host))) return { status: "unreachable", path: p }
  return null
}

async function inspect(p: string, kind: FolderKind): Promise<FolderCheck> {
  try {
    const stat = await fs.stat(p)
    if (!stat.isDirectory()) return { status: "not_a_directory", path: p }
  } catch (err) {
    const code = errCode(err)
    if (code === "EACCES" || code === "EPERM") return { status: "no_access", path: p }
    // ENOENT, ENOTDIR, missing share etc.
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

/** Checks existence, type and read/write access. Counts PDFs for the inbox. */
export async function checkFolder(input: string, kind: FolderKind): Promise<FolderCheck> {
  const p = cleanPath(input)
  const unreachable = await networkGuard(p)
  if (unreachable) return unreachable
  try {
    return await withTimeout(inspect(p, kind), FOLDER_CHECK_TIMEOUT_MS)
  } catch (err) {
    if (err instanceof TimeoutError) return { status: "unreachable", path: p }
    throw err
  }
}

/** Creates the folder (incl. missing parents) and returns a fresh check. */
export async function createFolder(input: string, kind: FolderKind): Promise<FolderCheck> {
  const p = cleanPath(input)
  const unreachable = await networkGuard(p)
  if (unreachable) return unreachable
  try {
    await withTimeout(fs.mkdir(p, { recursive: true }), FOLDER_CHECK_TIMEOUT_MS)
  } catch (err) {
    if (err instanceof TimeoutError) return { status: "unreachable", path: p }
    const code = errCode(err)
    if (code === "EACCES" || code === "EPERM") return { status: "no_access", path: p }
    if (code === "EEXIST" || code === "ENOTDIR") return { status: "not_a_directory", path: p }
    throw err
  }
  return checkFolder(p, kind)
}
