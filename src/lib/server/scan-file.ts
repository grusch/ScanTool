// Delivers exactly one scan from the configured inbox folder (PROJ-3).
// Read-only; the folder always comes from the saved settings, the request only names a file.
import { promises as fs } from "fs"
import path from "path"
import { z } from "zod"
import { cleanPath } from "@/lib/paths"
import { FOLDER_CHECK_TIMEOUT_MS, networkGuard } from "./folders"
import { TimeoutError, withTimeout } from "./network"
import { readSettings } from "./settings-store"

/** Upper limit for reading a (large) scan from the NAS */
export const SCAN_READ_TIMEOUT_MS = 60_000

/**
 * A plain file name as listed by the inbox: no path parts, no Windows specials
 * (":" = alternate data stream / drive), no control characters, ends with .pdf,
 * not hidden or temporary (same rules as the inbox list).
 */
export const scanNameSchema = z
  .string()
  .min(5)
  .max(255)
  .refine((n) => !/[\\/:*?"<>|\u0000-\u001f]/.test(n), "invalid characters")
  .refine((n) => n !== "." && n !== ".." && !n.includes(".."), "path traversal")
  .refine((n) => !n.startsWith(".") && !n.startsWith("~$"), "hidden or temporary")
  .refine((n) => /\.pdf$/i.test(n) && n.trim() === n, "not a pdf name")

export type ScanFileResult =
  | { ok: true; data: Buffer; name: string }
  | { ok: false; code: "invalid_name" | "not_found" | "unreachable" | "no_access" | "unknown" }

export async function readScanFile(rawName: string | null): Promise<ScanFileResult> {
  const parsed = scanNameSchema.safeParse(rawName ?? "")
  if (!parsed.success) return { ok: false, code: "invalid_name" }
  const name = parsed.data

  const settings = await readSettings()
  if (!settings) return { ok: false, code: "not_found" }
  const folder = cleanPath(settings.inboxPath)

  if (await networkGuard(folder)) return { ok: false, code: "unreachable" }

  // Defence in depth: the resolved file must sit directly inside the inbox folder
  const filePath = path.resolve(folder, name)
  if (path.dirname(filePath).toLowerCase() !== path.resolve(folder).toLowerCase()) {
    return { ok: false, code: "invalid_name" }
  }

  try {
    const stat = await withTimeout(fs.stat(filePath), FOLDER_CHECK_TIMEOUT_MS)
    if (!stat.isFile()) return { ok: false, code: "not_found" }
    const data = await withTimeout(fs.readFile(filePath), SCAN_READ_TIMEOUT_MS)
    return { ok: true, data, name }
  } catch (err) {
    if (err instanceof TimeoutError) return { ok: false, code: "unreachable" }
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === "ENOENT" || code === "ENOTDIR") return { ok: false, code: "not_found" }
    if (code === "EACCES" || code === "EPERM") return { ok: false, code: "no_access" }
    if (code === "EHOSTUNREACH" || code === "ENETUNREACH" || code === "ETIMEDOUT" || code === "EIO") {
      return { ok: false, code: "unreachable" }
    }
    console.error("[readScanFile]", err)
    return { ok: false, code: "unknown" }
  }
}

/** Content-Disposition header value: inline, with a UTF-8 file name for "Open in new tab" / saving */
export function inlineDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_")
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}
