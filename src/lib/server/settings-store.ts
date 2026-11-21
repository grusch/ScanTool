// Persists settings to a small JSON file on the local machine (PROJ-1).
import { promises as fs } from "fs"
import path from "path"
import { z } from "zod"
import type { Settings } from "@/lib/settings-types"

const settingsSchema = z.object({
  inboxPath: z.string().min(1),
  archivePath: z.string().min(1),
  updatedAt: z.string(),
})

/** Directory for local app data. Overridable for tests. */
export function dataDir(): string {
  return process.env.SCANTOOL_DATA_DIR || path.join(process.cwd(), "data")
}

function settingsFile(): string {
  return path.join(dataDir(), "settings.json")
}

/** Returns null if not configured yet (or the file is unreadable/corrupt). */
export async function readSettings(): Promise<Settings | null> {
  let raw: string
  try {
    raw = await fs.readFile(settingsFile(), "utf8")
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null
    throw err
  }
  try {
    const parsed = settingsSchema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
  } catch {
    // fall through
  }
  console.warn("[settings] settings.json is invalid – treating as not configured")
  return null
}

export async function writeSettings(values: Omit<Settings, "updatedAt">): Promise<Settings> {
  const settings: Settings = { ...values, updatedAt: new Date().toISOString() }
  await fs.mkdir(dataDir(), { recursive: true })
  // Write to a temp file first so a crash never leaves a half-written file
  const tmp = `${settingsFile()}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(settings, null, 2), "utf8")
  await fs.rename(tmp, settingsFile())
  return settings
}
