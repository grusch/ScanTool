// Remembers AI suggestions per scan in data/analyses.json (PROJ-4), so every scan is
// paid for once – also across a restart. Only suggestions are stored, never the scan.
import { promises as fs } from "fs"
import path from "path"
import { z } from "zod"
import type { AnalysisResult } from "@/lib/analysis-types"
import { dataDir } from "./settings-store"

/** Same name + size + modification time = same file; a replaced file gets a new fingerprint */
export function fingerprint(name: string, size: number, mtimeMs: number): string {
  // floor = same millisecond as the ISO date the inbox list reports
  return `${name}|${size}|${Math.floor(mtimeMs)}`
}

const suggestionSchema = z.object({
  docType: z.enum(["rechnung", "garantieschein"]).nullable(),
  isInvoiceDocument: z.boolean(),
  date: z.string().nullable(),
  supplier: z.string().nullable(),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  articles: z.array(z.string()),
  warrantyMonths: z.number().nullable(),
})

const entrySchema = z.object({
  name: z.string(),
  suggestion: suggestionSchema,
  pagesAnalyzed: z.number(),
  totalPages: z.number(),
  analyzedAt: z.string(),
  model: z.string(),
})

const fileSchema = z.object({ version: z.literal(1), entries: z.record(z.string(), entrySchema) })
type StoreFile = z.infer<typeof fileSchema>
type Entry = z.infer<typeof entrySchema>

function storeFile(): string {
  return path.join(dataDir(), "analyses.json")
}

async function readStore(): Promise<StoreFile> {
  try {
    const parsed = fileSchema.safeParse(JSON.parse(await fs.readFile(storeFile(), "utf8")))
    if (parsed.success) return parsed.data
    console.warn("[analyses] analyses.json is invalid – starting empty")
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") console.warn("[analyses] could not read analyses.json")
  }
  return { version: 1, entries: {} }
}

// All changes run one after another (read → change → atomic write), so parallel
// analyses never lose each other's results.
let queue: Promise<unknown> = Promise.resolve()
let tmpCounter = 0

function update<T>(change: (store: StoreFile) => T): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore()
    const result = change(store)
    await fs.mkdir(dataDir(), { recursive: true })
    const tmp = `${storeFile()}.${process.pid}.${++tmpCounter}.tmp`
    await fs.writeFile(tmp, JSON.stringify(store), "utf8")
    await fs.rename(tmp, storeFile())
    return result
  })
  queue = run.catch(() => undefined)
  return run
}

export async function getAnalysis(fp: string): Promise<AnalysisResult | null> {
  await queue
  const entry: Entry | undefined = (await readStore()).entries[fp]
  if (!entry) return null
  const { name: _name, ...result } = entry
  return result
}

export function saveAnalysis(fp: string, name: string, result: AnalysisResult): Promise<void> {
  return update((store) => {
    // Older results of the same file name are obsolete (file was replaced)
    for (const [key, e] of Object.entries(store.entries)) if (e.name === name) delete store.entries[key]
    store.entries[fp] = { name, ...result }
  })
}

/** Drops results of scans that are no longer in the inbox (or were replaced). */
export async function pruneAnalyses(present: string[]): Promise<number> {
  await queue
  const keep = new Set(present)
  const stale = Object.keys((await readStore()).entries).filter((k) => !keep.has(k))
  if (stale.length === 0) return 0
  return update((store) => {
    let removed = 0
    for (const key of Object.keys(store.entries)) {
      if (!keep.has(key)) {
        delete store.entries[key]
        removed++
      }
    }
    return removed
  })
}
