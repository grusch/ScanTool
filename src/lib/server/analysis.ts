// AI analysis of one scan from the inbox (PROJ-4).
import { promises as fs } from "fs"
import path from "path"
import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { PDFDocument } from "pdf-lib"
import { z } from "zod"
import type { AnalysisErrorCode, AnalysisResult, AnalyzeResponse, Suggestion } from "@/lib/analysis-types"
import { cleanPath } from "@/lib/paths"
import { fingerprint, getAnalysis, saveAnalysis } from "./analysis-store"
import { apiKeyPresent, classifyConnectionError } from "./anthropic"
import { FOLDER_CHECK_TIMEOUT_MS, networkGuard } from "./folders"
import { TimeoutError, withTimeout } from "./network"
import { SCAN_READ_TIMEOUT_MS, scanNameSchema } from "./scan-file"
import { readSettings } from "./settings-store"

/** Chosen by the user (cost ~0.1 Rp. per scan). Change here only – e.g. to "claude-sonnet-5-5". */
export const ANALYSIS_MODEL = "claude-haiku-5-5"
export const MAX_PAGES = 5
export const MAX_FILE_BYTES = 30 * 1024 * 1024
/** Whole analysis incl. one retry must finish within 60 s */
export const ANALYSIS_TIMEOUT_MS = 60_000
const REQUEST_TIMEOUT_MS = 28_000
const MAX_ARTICLES = 10

class AnalysisError extends Error {
  constructor(public code: AnalysisErrorCode) {
    super(code)
  }
}

// ---------------------------------------------------------------------------
// What Claude must return (structured output) – kept free of length limits,
// those are enforced afterwards in normalize().
const OutputSchema = z.object({
  is_invoice_document: z.boolean().describe("true, wenn es eine Rechnung, Quittung, Kassenbon, Gutschrift oder ein Garantieschein ist"),
  doc_type: z.enum(["rechnung", "garantieschein"]).nullable(),
  date: z.string().nullable().describe("Rechnungsdatum (beim Garantieschein Kaufdatum) als YYYY-MM-DD, nur wenn Tag, Monat und Jahr sicher lesbar sind"),
  supplier: z.string().nullable().describe("Kurzname des Lieferanten/Händlers ohne Rechtsform und Adresse"),
  description: z.string().nullable().describe("2–5 Wörter zum Hauptprodukt bzw. zur Leistung"),
  amount: z.number().nullable().describe("Gesamtbetrag inkl. MWST; Gutschriften negativ"),
  currency: z.string().nullable().describe("ISO-Währungscode, z. B. CHF, EUR, USD"),
  invoice_number: z.string().nullable(),
  articles: z.array(z.string()).describe("Hauptpositionen, höchstens 10, ohne Versandkosten und Gebühren"),
  warranty_months: z.number().int().nullable().describe("Garantiedauer in Monaten, nur wenn auf dem Dokument angegeben"),
})
type Output = z.infer<typeof OutputSchema>

const SYSTEM_PROMPT = `Du liest eingescannte Rechnungen und Garantiescheine eines Schweizer Privathaushalts und füllst daraus Felder für die Ablage aus.

Wichtigste Regel: Trage nur ein, was du auf dem Dokument sicher erkennst. Bist du bei einem Feld unsicher, setze null (bzw. eine leere Liste) – rate nie. Ein leeres Feld ist für den Nutzer besser als ein falsches, weil er es einfach selbst ausfüllt. Ist nur ein Teil sicher (z. B. der Lieferant, aber nicht die Beschreibung), trage nur diesen Teil ein.

Regeln je Feld:
- doc_type: "rechnung" für Rechnungen, Quittungen, Kassenbons und Gutschriften; "garantieschein" für Garantiescheine/-karten. Enthält das PDF beides, gilt "rechnung".
- date: Rechnungsdatum hat Vorrang vor Liefer- oder Bestelldatum; beim Garantieschein das Kaufdatum. Nur vollständige Daten (Tag, Monat, Jahr), sonst null.
- supplier: kurzer, gebräuchlicher Name des Händlers, ohne Rechtsform (AG, GmbH …), Ort oder Adresse – z. B. "Digitec" statt "Digitec Galaxus AG, Zürich".
- description: 2 bis 5 Wörter, die das gekaufte Hauptprodukt bzw. die Leistung benennen – wie ein Stichwort für die spätere Suche. Beispiele: "Monitor Dell U2724D", "Strom E-Mobility", "Zahnreinigung", "Winterreifen Michelin". Nicht hineinschreiben: Dokumentart (Rechnung, Quittung, Garantie), Datum, Zeitraum/Periode, Nummern, Beträge, Lieferantenname. Keine Sonderzeichen wie / \\ : * ? " < > | _.
- amount: Gesamtbetrag inklusive MWST als Zahl; bei Gutschriften negativ.
- currency: dreistelliger ISO-Code der auf dem Dokument genannten Währung, keine Umrechnung.
- articles: die Hauptpositionen nur als Bezeichnung in Kurzform (ohne Preise, Beträge, Mengen oder Einheiten), höchstens 10; Versandkosten, Gebühren, Rabatte und Pfand weglassen.
- warranty_months: nur wenn eine Garantiedauer genannt ist, in Monaten (2 Jahre = 24).
- is_invoice_document: false, wenn es weder Rechnung, Quittung, Kassenbon, Gutschrift noch Garantieschein ist (z. B. ein Brief). Erkennbare Angaben wie Datum oder Absender darfst du trotzdem eintragen; doc_type ist dann null.`

// ---------------------------------------------------------------------------

function cleanText(v: string | null): string | null {
  const t = v?.replace(/\s+/g, " ").trim()
  return t ? t : null
}

/**
 * Description as a search keyword (PROJ-4 BUG-1): no file-name special characters,
 * no document type words, no periods like "09-10/2026", at most 5 words.
 */
export function cleanDescription(v: string | null): string | null {
  const t = cleanText(v)
  if (!t) return null
  const words = t
    .replace(/[\\/:*?"<>|_]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(rechnung|quittung|garantieschein|garantie|kassenbon|gutschrift)$/i.test(w))
    // years and dates/periods ("2026", "09-10", "01.09.2026") – "iPhone 15", "U2724D" stay
    .filter((w) => !/^(19|20)\d{2}$/.test(w) && !/^\d+[.,\-–][\d.,\-–]*$/.test(w))
    .filter((w) => !/^(periode|zeitraum|vom|bis)$/i.test(w))
  const result = words.slice(0, 5).join(" ").slice(0, 80).trim()
  return result || null
}

/** Article without price/amount at the end ("Energie 73.14", "Kabel CHF 9.90" → name only) */
export function cleanArticle(v: string): string | null {
  const t = cleanText(v)
    ?.replace(/\s*(CHF|EUR|USD|Fr\.?)?\s*-?\d[\d'’]*[.,]\d{2}\s*(CHF|EUR|USD|Fr\.?)?$/i, "")
    .trim()
  return t ? t.slice(0, 120) : null
}

function validIsoDate(v: string | null): string | null {
  const m = v ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim()) : null
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null
  if (y < 1990 || y > 2100) return null
  return m[0]
}

/** Makes the AI answer safe and consistent, whatever came back */
export function normalize(o: Output): Suggestion {
  const currency = o.currency?.trim().toUpperCase() ?? ""
  const warranty = o.warranty_months
  return {
    isInvoiceDocument: o.is_invoice_document,
    docType: o.is_invoice_document ? o.doc_type : null,
    date: validIsoDate(o.date),
    supplier: cleanText(o.supplier)?.slice(0, 80) ?? null,
    description: cleanDescription(o.description),
    amount: o.amount !== null && Number.isFinite(o.amount) ? Math.round(o.amount * 100) / 100 : null,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : null,
    invoiceNumber: cleanText(o.invoice_number)?.slice(0, 60) ?? null,
    articles: o.articles
      .map((a) => cleanArticle(a))
      .filter((a): a is string => a !== null)
      .slice(0, MAX_ARTICLES),
    warrantyMonths: warranty !== null && Number.isInteger(warranty) && warranty > 0 && warranty <= 600 ? warranty : null,
  }
}

/** Opens the PDF (detects damaged / password-protected files) and keeps at most 5 pages */
export async function preparePdf(data: Uint8Array): Promise<{ pdf: Uint8Array; totalPages: number; pagesAnalyzed: number }> {
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(data, { updateMetadata: false })
  } catch {
    // EncryptedPDFError or parse error
    throw new AnalysisError("unreadable")
  }
  const totalPages = doc.getPageCount()
  if (totalPages === 0) throw new AnalysisError("unreadable")
  if (totalPages <= MAX_PAGES) return { pdf: data, totalPages, pagesAnalyzed: totalPages }

  const cut = await PDFDocument.create()
  const pages = await cut.copyPages(doc, Array.from({ length: MAX_PAGES }, (_, i) => i))
  pages.forEach((p) => cut.addPage(p))
  return { pdf: await cut.save(), totalPages, pagesAnalyzed: MAX_PAGES }
}

function mapApiError(err: unknown): AnalysisErrorCode {
  if (err instanceof AnalysisError) return err.code
  if (err instanceof TimeoutError || err instanceof Anthropic.APIConnectionTimeoutError) return "timeout"
  if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) return "unreachable"
  const c = classifyConnectionError(err)
  if (!c.ok && (c.code === "invalid_key" || c.code === "no_credit" || c.code === "unreachable")) return c.code
  if (err instanceof Anthropic.BadRequestError) return "bad_response"
  return "unknown"
}

async function askClaude(pdf: Uint8Array): Promise<Suggestion> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1, // one retry on overload / rate limit, total stays below 60 s
  })
  const response = await client.messages.parse({
    model: ANALYSIS_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    output_config: { effort: "low", format: zodOutputFormat(OutputSchema) },
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: Buffer.from(pdf).toString("base64") } },
          { type: "text", text: "Fülle die Felder für dieses Dokument aus." },
        ],
      },
    ],
  })
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens" || !response.parsed_output) {
    console.warn("[analysis] unusable answer, stop_reason:", response.stop_reason)
    throw new AnalysisError("bad_response")
  }
  return normalize(response.parsed_output)
}

// ---------------------------------------------------------------------------
// Running analyses per fingerprint: a second request for the same scan joins the
// first, and an analysis keeps running when the browser stops waiting.
const running = new Map<string, Promise<AnalysisResult>>()

/** Test helper */
export function runningAnalyses(): number {
  return running.size
}

async function runAnalysis(filePath: string, fp: string, name: string): Promise<AnalysisResult> {
  const data = await withTimeout(fs.readFile(filePath), SCAN_READ_TIMEOUT_MS)
  const { pdf, totalPages, pagesAnalyzed } = await preparePdf(data)
  const suggestion = await askClaude(pdf)
  const result: AnalysisResult = {
    suggestion,
    pagesAnalyzed,
    totalPages,
    analyzedAt: new Date().toISOString(),
    model: ANALYSIS_MODEL,
  }
  await saveAnalysis(fp, name, result)
  return result
}

export async function analyzeScan(rawName: unknown, force = false): Promise<AnalyzeResponse> {
  const parsed = scanNameSchema.safeParse(rawName)
  if (!parsed.success) return { ok: false, code: "invalid_name" }
  const name = parsed.data
  if (!apiKeyPresent()) return { ok: false, code: "missing_key" }

  const settings = await readSettings()
  if (!settings) return { ok: false, code: "not_found" }
  const folder = cleanPath(settings.inboxPath)
  if (await networkGuard(folder)) return { ok: false, code: "inbox_unreachable" }

  const filePath = path.resolve(folder, name)
  if (path.dirname(filePath).toLowerCase() !== path.resolve(folder).toLowerCase()) {
    return { ok: false, code: "invalid_name" }
  }

  let stat
  try {
    stat = await withTimeout(fs.stat(filePath), FOLDER_CHECK_TIMEOUT_MS)
  } catch (err) {
    if (err instanceof TimeoutError) return { ok: false, code: "inbox_unreachable" }
    const code = (err as NodeJS.ErrnoException)?.code
    return { ok: false, code: code === "ENOENT" || code === "ENOTDIR" ? "not_found" : "unknown" }
  }
  if (!stat.isFile()) return { ok: false, code: "not_found" }
  if (stat.size > MAX_FILE_BYTES) return { ok: false, code: "too_large" }

  const fp = fingerprint(name, stat.size, stat.mtimeMs)
  if (!force) {
    const cached = await getAnalysis(fp)
    if (cached) return { ok: true, cached: true, ...cached }
  }

  let job = running.get(fp)
  if (!job) {
    job = runAnalysis(filePath, fp, name)
    running.set(fp, job)
    // Keep running independently of this request; forget once finished
    job.catch(() => undefined).finally(() => running.delete(fp))
  }

  try {
    const result = await withTimeout(job, ANALYSIS_TIMEOUT_MS)
    return { ok: true, cached: false, ...result }
  } catch (err) {
    const code = mapApiError(err)
    if (code === "unknown") {
      const e = err as { name?: string; status?: number }
      console.error("[analysis] unexpected error", e?.name, e?.status)
    }
    return { ok: false, code }
  }
}
