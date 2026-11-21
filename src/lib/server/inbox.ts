// Lists finished scans in the configured inbox folder (PROJ-2).
import { promises as fs } from "fs"
import path from "path"
import { cleanPath } from "@/lib/paths"
import type { InboxFile, InboxResponse } from "@/lib/inbox-types"
import type { FolderStatus } from "@/lib/settings-types"
import { fingerprint, pruneAnalyses } from "./analysis-store"
import { FOLDER_CHECK_TIMEOUT_MS, networkGuard } from "./folders"
import { TimeoutError, withTimeout } from "./network"
import { readSettings } from "./settings-store"

/** A file counts as finished once unchanged for this long */
export const STABLE_AFTER_MS = 5_000
/** Parallel stat calls – fast on many files without flooding the NAS */
const STAT_CONCURRENCY = 16

interface Observation {
  size: number
  mtimeMs: number
  /** When this exact size/mtime was first seen by the server */
  since: number
}

// In-memory only: last observed size/mtime per file (key: folder + name).
// Lets files with a skewed NAS clock (mtime in the future) appear after a
// second unchanged observation.
const observations = new Map<string, Observation>()

/** Test helper */
export function resetInboxObservations(): void {
  observations.clear()
}

function isCandidate(name: string): boolean {
  if (!/\.pdf$/i.test(name)) return false
  if (name.startsWith(".") || name.startsWith("~$")) return false
  return true
}

async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

function isStable(key: string, size: number, mtimeMs: number, now: number): boolean {
  const prev = observations.get(key)
  const unchanged = prev && prev.size === size && prev.mtimeMs === mtimeMs
  const since = unchanged ? prev.since : now
  if (!unchanged) observations.set(key, { size, mtimeMs, since: now })
  return now - mtimeMs >= STABLE_AFTER_MS || now - since >= STABLE_AFTER_MS
}

function statusFromError(err: unknown): FolderStatus {
  const code = (err as NodeJS.ErrnoException)?.code
  if (code === "EACCES" || code === "EPERM") return "no_access"
  if (code === "ENOTDIR") return "not_a_directory"
  return "not_found"
}

async function scan(folder: string, now: number): Promise<InboxFile[]> {
  const entries = await fs.readdir(folder, { withFileTypes: true })
  const names = entries.filter((e) => e.isFile() && isCandidate(e.name)).map((e) => e.name)
  const keyPrefix = folder.toLowerCase() + "\\"

  const stats = await mapLimited(names, STAT_CONCURRENCY, async (name) => {
    try {
      const s = await fs.stat(path.join(folder, name))
      return { name, size: s.size, mtimeMs: s.mtimeMs }
    } catch {
      return null // vanished between listing and stat
    }
  })

  // Forget files of this folder that are gone
  const present = new Set(names.map((n) => keyPrefix + n))
  for (const key of observations.keys()) {
    if (key.startsWith(keyPrefix) && !present.has(key)) observations.delete(key)
  }

  return stats
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .filter((s) => isStable(keyPrefix + s.name, s.size, s.mtimeMs, now))
    .sort((a, b) => a.mtimeMs - b.mtimeMs || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((s) => ({ name: s.name, size: s.size, modifiedAt: new Date(s.mtimeMs).toISOString() }))
}

/** Lists the configured inbox. Never throws for folder problems – reports a status instead. */
export async function listInbox(): Promise<InboxResponse> {
  const now = Date.now()
  const checkedAt = new Date(now).toISOString()
  const settings = await readSettings()
  if (!settings) return { folder: "", status: "not_found", checkedAt, files: [] }

  const folder = cleanPath(settings.inboxPath)
  const unreachable = await networkGuard(folder)
  if (unreachable) return { folder, status: "unreachable", checkedAt, files: [] }

  try {
    const files = await withTimeout(scan(folder, now), FOLDER_CHECK_TIMEOUT_MS)
    // PROJ-4: forget AI results of scans that were filed, deleted or replaced (in the background)
    pruneAnalyses(files.map((f) => fingerprint(f.name, f.size, Date.parse(f.modifiedAt)))).catch((err) =>
      console.warn("[inbox] could not prune analyses", (err as Error)?.message)
    )
    return { folder, status: "ok", checkedAt, files }
  } catch (err) {
    const status = err instanceof TimeoutError ? "unreachable" : statusFromError(err)
    return { folder, status, checkedAt, files: [] }
  }
}
