// Form fields of the suggestions panel (PROJ-4) and the file name rule shared with PROJ-5.
import type { DocType, Suggestion } from "./analysis-types"

/** All form values as text, exactly as the user sees/edits them */
export interface SuggestionFields {
  docType: DocType | ""
  /** TT.MM.JJJJ */
  date: string
  supplier: string
  description: string
  /** e.g. "389.00" */
  amount: string
  currency: string
  invoiceNumber: string
  warrantyMonths: string
  /** One article per line */
  articles: string
}

export type FieldName = keyof SuggestionFields

export const EMPTY_FIELDS: SuggestionFields = {
  docType: "",
  date: "",
  supplier: "",
  description: "",
  amount: "",
  currency: "",
  invoiceNumber: "",
  warrantyMonths: "",
  articles: "",
}

/** AI suggestion → form text (empty where the AI was not sure) */
export function fieldsFromSuggestion(s: Suggestion | null | undefined): SuggestionFields {
  if (!s) return EMPTY_FIELDS
  const iso = s.date && /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.date)
  return {
    docType: s.docType ?? "",
    date: iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : "",
    supplier: s.supplier ?? "",
    description: s.description ?? "",
    amount: s.amount === null || !Number.isFinite(s.amount) ? "" : s.amount.toFixed(2),
    currency: s.currency ?? "",
    invoiceNumber: s.invoiceNumber ?? "",
    warrantyMonths: s.warrantyMonths === null ? "" : String(s.warrantyMonths),
    articles: s.articles.join("\n"),
  }
}

/** ISO timestamp → TT.MM.JJJJ in local time (the day the user sees in Explorer) */
export function isoToSwissDate(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
}

/**
 * Date fallback (PROJ-4 change 2026-11-21): no invoice date from the AI → date from the
 * file properties. Returns the AI fields with the date filled and whether the fallback was used.
 */
export function withFileDateFallback(
  ai: SuggestionFields,
  fileDate: string | undefined
): { fields: SuggestionFields; dateFromFile: boolean } {
  if (ai.date) return { fields: ai, dateFromFile: false }
  const date = isoToSwissDate(fileDate)
  return date ? { fields: { ...ai, date }, dateFromFile: true } : { fields: ai, dateFromFile: false }
}

/**
 * Shown values: what the user typed wins, all untouched fields show the AI suggestion.
 * So a (new) AI result never overwrites the user's own input.
 */
export function mergeFields(ai: SuggestionFields, touched: Partial<SuggestionFields>): SuggestionFields {
  return { ...ai, ...touched }
}

/** Parses TT.MM.JJJJ (also T.M.JJJJ) into a real calendar date, or null */
export function parseSwissDate(text: string): { year: number; month: number; day: number } | null {
  const m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\s*$/.exec(text)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  const d = new Date(Date.UTC(year, month - 1, day))
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null
  return { year, month, day }
}

export const MAX_FILE_NAME_LENGTH = 100

/**
 * One part of the file name: spaces → "-", forbidden Windows characters and "_" → "-",
 * umlauts stay, repeated "-" collapse, no "-" or "." at the ends.
 */
export function sanitizePart(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|_]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
}

export type FileNameResult = { ok: true; name: string } | { ok: false; missing: string[] }

/** `JJMMTT_Lieferant_Beschreibung[_Garantie].pdf`, max. 100 characters (description is shortened) */
export function buildFileName(f: Pick<SuggestionFields, "docType" | "date" | "supplier" | "description">): FileNameResult {
  const missing: string[] = []
  const date = parseSwissDate(f.date)
  if (!f.date.trim()) missing.push("Datum fehlt")
  else if (!date) missing.push("Datum ungültig")
  let supplier = sanitizePart(f.supplier)
  if (!supplier) missing.push("Lieferant fehlt")
  let description = sanitizePart(f.description)
  if (!description) missing.push("Beschreibung fehlt")
  if (missing.length > 0 || !date) return { ok: false, missing }

  const yymmdd =
    String(date.year % 100).padStart(2, "0") + String(date.month).padStart(2, "0") + String(date.day).padStart(2, "0")
  const suffix = (f.docType === "garantieschein" ? "_Garantie" : "") + ".pdf"
  const fixed = yymmdd.length + 2 + suffix.length // two "_" separators

  // Shorten the description first; only if that is not enough, the supplier too
  let room = MAX_FILE_NAME_LENGTH - fixed - supplier.length
  if (room < 1) {
    supplier = supplier.slice(0, Math.max(1, MAX_FILE_NAME_LENGTH - fixed - 1)).replace(/[-.]+$/, "")
    room = MAX_FILE_NAME_LENGTH - fixed - supplier.length
  }
  if (description.length > room) description = description.slice(0, room).replace(/[-.]+$/, "") || description[0]

  return { ok: true, name: `${yymmdd}_${supplier}_${description}${suffix}` }
}
