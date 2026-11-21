// Files a scan from the inbox (PROJ-5): "rechnung" → <Ablage>\Rechnungen\<Jahr>\,
// "scan" → <Eingang>\Abgelegt\, "papierkorb" (button „Löschen“) → <Eingang>\Papierkorb\ under
// the original name – ScanTool never deletes a scan for good. Never overwrites, never loses a file: across drives the
// scan is copied under a temporary name, verified (size + SHA-256), renamed and only then
// deleted from the inbox. Folders always come from the saved settings, never from the request.
import { createHash, randomBytes, randomUUID } from "crypto"
import { constants, createReadStream, promises as fs } from "fs"
import path from "path"
import { z } from "zod"
import type { AnalysisResult } from "@/lib/analysis-types"
import { validateFileName } from "@/lib/file-name-rules"
import type { FilingErrorCode, FilingResponse, UndoResponse } from "@/lib/filing-types"
import { cleanPath } from "@/lib/paths"
import { fingerprint, getAnalysis, saveAnalysis } from "./analysis-store"
import { networkGuard } from "./folders"
import { TimeoutError, withTimeout } from "./network"
import { scanNameSchema } from "./scan-file"
import { readSettings } from "./settings-store"

export const INVOICE_FOLDER = "Rechnungen"
export const SCAN_FOLDER = "Abgelegt"
export const TRASH_FOLDER = "Papierkorb"
/** How long "Rückgängig" stays possible on the server (the message shows ~8 s) */
export const UNDO_TTL_MS = 10 * 60_000
/** Upper limit for copying / hashing a scan across the network */
const IO_TIMEOUT_MS = 120_000
const MAX_VARIANTS = 999

export const filingRequestSchema = z.object({
  scan: z.string().max(300),
  target: z.enum(["rechnung", "scan", "papierkorb"]),
  fileName: z.string().max(300).nullable(),
  year: z.number().int().min(1990).max(2100).optional(),
})
export type FilingInput = z.infer<typeof filingRequestSchema>

class FilingError extends Error {
  constructor(public code: FilingErrorCode) {
    super(code)
  }
}

// ---------------------------------------------------------------------------
// Helpers

export async function sha256(file: string): Promise<string> {
  return withTimeout(
    new Promise<string>((resolve, reject) => {
      const hash = createHash("sha256")
      createReadStream(file)
        .on("error", reject)
        .on("data", (chunk) => hash.update(chunk))
        .on("end", () => resolve(hash.digest("hex")))
    }),
    IO_TIMEOUT_MS
  )
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p)
    return true
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false
    throw err
  }
}

/** "X.pdf" → "X_2.pdf"; "X_Garantie.pdf" → "X_2_Garantie.pdf" */
export function variantName(name: string, n: number): string {
  if (n <= 1) return name
  const ext = path.extname(name)
  const stem = name.slice(0, name.length - ext.length)
  const m = /^(.*)(_Garantie)$/i.exec(stem)
  return m ? `${m[1]}_${n}${m[2]}${ext}` : `${stem}_${n}${ext}`
}

/**
 * Looks at the name and its numbered variants in the target folder:
 * identical content already there → that name; otherwise the first free name.
 */
async function chooseName(dir: string, name: string, size: number, hash: () => Promise<string>) {
  for (let n = 1; n <= MAX_VARIANTS; n++) {
    const candidate = variantName(name, n)
    const full = path.join(dir, candidate)
    let stat
    try {
      stat = await fs.stat(full)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return { name: candidate, identical: false, renamed: n > 1 }
      throw err
    }
    if (stat.isFile() && stat.size === size && (await sha256(full)) === (await hash())) {
      return { name: candidate, identical: true, renamed: n > 1 }
    }
  }
  throw new FilingError("no_permission")
}

function errorCode(err: unknown, fallback: FilingErrorCode = "unknown"): FilingErrorCode {
  if (err instanceof FilingError) return err.code
  if (err instanceof TimeoutError) return "archive_unreachable"
  const code = (err as NodeJS.ErrnoException)?.code
  if (code === "EACCES" || code === "EPERM" || code === "ENOSPC" || code === "EROFS" || code === "EBUSY") return "no_permission"
  if (code === "ENOENT" || code === "ENOTDIR") return "archive_unreachable"
  if (code === "EHOSTUNREACH" || code === "ENETUNREACH" || code === "ETIMEDOUT" || code === "EIO") return "archive_unreachable"
  return fallback
}

/** Copy → verify → rename into place. Removes the temporary copy on any failure. */
async function copyVerified(source: string, dir: string, finalName: string, sourceHash: string, sourceSize: number) {
  const tmp = path.join(dir, `~$scantool-${randomBytes(6).toString("hex")}.tmp`)
  try {
    await withTimeout(fs.copyFile(source, tmp, constants.COPYFILE_EXCL), IO_TIMEOUT_MS)
    const copied = await fs.stat(tmp)
    if (copied.size !== sourceSize || (await sha256(tmp)) !== sourceHash) throw new FilingError("unknown")
    // fs.rename would replace an existing file on Windows – check right before
    if (await exists(path.join(dir, finalName))) throw new FilingError("unknown")
    await fs.rename(tmp, path.join(dir, finalName))
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => undefined)
    throw err
  }
}

// ---------------------------------------------------------------------------
// Undo tokens (server memory only)

interface UndoEntry {
  /** Where the file is now */
  filedPath: string
  /** Inbox folder and original name */
  inbox: string
  originalName: string
  atime: Date
  mtime: Date
  /** Moved within the same folder tree (scan → Abgelegt, papierkorb → Papierkorb) – a rename is enough */
  sameTree: boolean
  analysis: AnalysisResult | null
  expires: number
}
const undoEntries = new Map<string, UndoEntry>()

function rememberUndo(entry: Omit<UndoEntry, "expires">): string {
  const now = Date.now()
  for (const [k, e] of undoEntries) if (e.expires < now) undoEntries.delete(k)
  const token = randomUUID()
  undoEntries.set(token, { ...entry, expires: now + UNDO_TTL_MS })
  return token
}

/** Test helper */
export function resetUndo(): void {
  undoEntries.clear()
}

// One filing per scan at a time (a second request waits, then finds the scan gone)
const locks = new Map<string, Promise<unknown>>()
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve()
  const run = previous.catch(() => undefined).then(fn)
  locks.set(key, run)
  run.finally(() => {
    if (locks.get(key) === run) locks.delete(key)
  }).catch(() => undefined)
  return run
}

// ---------------------------------------------------------------------------

export async function fileScan(input: FilingInput): Promise<FilingResponse> {
  const scan = scanNameSchema.safeParse(input.scan)
  if (!scan.success) return { ok: false, code: "invalid_request" }
  let newName: string | null = null
  // „Löschen“ always keeps the original name – a sent file name is ignored
  if (input.fileName !== null && input.target !== "papierkorb") {
    const check = validateFileName(input.fileName)
    if (!check.ok) return { ok: false, code: "invalid_request" }
    newName = check.name
  }
  if (input.target === "rechnung" && (!newName || !input.year)) return { ok: false, code: "invalid_request" }

  return withLock(scan.data.toLowerCase(), () => doFile(scan.data, input.target, newName, input.year))
}

async function doFile(scan: string, target: FilingInput["target"], newName: string | null, year?: number): Promise<FilingResponse> {
  const settings = await readSettings()
  if (!settings) return { ok: false, code: "archive_unreachable" }
  const inbox = cleanPath(settings.inboxPath)
  const archive = cleanPath(settings.archivePath)

  if (await networkGuard(inbox)) return { ok: false, code: "inbox_unreachable" }
  const source = path.resolve(inbox, scan)
  if (path.dirname(source).toLowerCase() !== path.resolve(inbox).toLowerCase()) return { ok: false, code: "invalid_request" }

  let sourceStat
  try {
    sourceStat = await withTimeout(fs.stat(source), 10_000)
  } catch (err) {
    if (err instanceof TimeoutError) return { ok: false, code: "inbox_unreachable" }
    const code = (err as NodeJS.ErrnoException)?.code
    return { ok: false, code: code === "ENOENT" ? "not_found" : "unknown" }
  }
  if (!sourceStat.isFile()) return { ok: false, code: "not_found" }

  // Target folder – only built here, from the settings
  let dir: string
  let display: string
  if (target === "rechnung") {
    if (await networkGuard(archive)) return { ok: false, code: "archive_unreachable" }
    try {
      if (!(await fs.stat(archive)).isDirectory()) return { ok: false, code: "archive_unreachable" }
    } catch {
      return { ok: false, code: "archive_unreachable" }
    }
    dir = path.join(archive, INVOICE_FOLDER, String(year))
    display = `${INVOICE_FOLDER}\\${year}\\`
  } else {
    const folder = target === "papierkorb" ? TRASH_FOLDER : SCAN_FOLDER
    dir = path.join(inbox, folder)
    display = `${path.basename(inbox)}\\${folder}\\`
  }

  const finalWanted = newName ?? scan
  // Remember the AI result for undo (it is removed when the inbox is listed next)
  const analysis = await getAnalysis(fingerprint(scan, sourceStat.size, sourceStat.mtimeMs)).catch(() => null)

  try {
    await fs.mkdir(dir, { recursive: true })
    let hashCache: string | null = null
    const sourceHash = async () => (hashCache ??= await sha256(source))
    const chosen = await chooseName(dir, finalWanted, sourceStat.size, sourceHash)
    const location = display + chosen.name

    if (chosen.identical) {
      try {
        await fs.unlink(source)
      } catch {
        return { ok: true, status: "copied_not_deleted", location, renamed: chosen.renamed }
      }
      return { ok: true, status: "already_filed", location, renamed: chosen.renamed }
    }

    const filedPath = path.join(dir, chosen.name)
    // "scan" and "papierkorb" stay inside the inbox folder
    const sameTree = target !== "rechnung"
    if (sameTree) {
      // Same folder tree on the same drive: a single rename, nothing to copy
      if (await exists(filedPath)) throw new FilingError("unknown")
      await fs.rename(source, filedPath)
    } else {
      await copyVerified(source, dir, chosen.name, await sourceHash(), sourceStat.size)
      // Keep the scan date on the filed copy
      await fs.utimes(filedPath, sourceStat.atime, sourceStat.mtime).catch(() => undefined)
      try {
        await fs.unlink(source)
      } catch {
        return { ok: true, status: "copied_not_deleted", location, renamed: chosen.renamed }
      }
    }

    const undoToken = rememberUndo({
      filedPath,
      inbox,
      originalName: scan,
      atime: sourceStat.atime,
      mtime: sourceStat.mtime,
      sameTree,
      analysis,
    })
    return { ok: true, status: "filed", location, renamed: chosen.renamed, undoToken }
  } catch (err) {
    const code = errorCode(err)
    if (code === "unknown") console.error("[filing] failed", (err as Error)?.name, (err as NodeJS.ErrnoException)?.code)
    return { ok: false, code }
  }
}

export async function undoFiling(token: unknown): Promise<UndoResponse> {
  if (typeof token !== "string") return { ok: false, code: "expired" }
  const entry = undoEntries.get(token)
  if (!entry || entry.expires < Date.now()) {
    undoEntries.delete(token as string)
    return { ok: false, code: "expired" }
  }
  return withLock(entry.originalName.toLowerCase(), async () => {
    if (await networkGuard(entry.inbox)) return { ok: false, code: "inbox_unreachable" } as const
    let filed
    try {
      filed = await fs.stat(entry.filedPath)
    } catch {
      undoEntries.delete(token)
      return { ok: false, code: "gone" } as const
    }
    try {
      // Original name – or a numbered variant if a new scan took it meanwhile
      let n = 1
      while (await exists(path.join(entry.inbox, variantName(entry.originalName, n)))) n++
      const name = variantName(entry.originalName, n)
      const back = path.join(entry.inbox, name)

      if (entry.sameTree) {
        await fs.rename(entry.filedPath, back)
      } else {
        await copyVerified(entry.filedPath, entry.inbox, name, await sha256(entry.filedPath), filed.size)
        await fs.unlink(entry.filedPath).catch(() => undefined)
      }
      // Same name + size + date as before → the browser finds its input again
      await fs.utimes(back, entry.atime, entry.mtime).catch(() => undefined)
      if (entry.analysis) {
        const restored = await fs.stat(back)
        await saveAnalysis(fingerprint(name, restored.size, restored.mtimeMs), name, entry.analysis).catch(() => undefined)
      }
      undoEntries.delete(token)
      return { ok: true, name, renamed: n > 1 } as const
    } catch (err) {
      console.error("[filing] undo failed", (err as NodeJS.ErrnoException)?.code)
      return { ok: false, code: "unknown" } as const
    }
  })
}
