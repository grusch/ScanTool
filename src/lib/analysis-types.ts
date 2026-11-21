// Shared contract between the suggestions panel and POST /api/analysis (PROJ-4).

export type DocType = "rechnung" | "garantieschein"

/** What the AI suggests for one scan – null = not recognised with certainty */
export interface Suggestion {
  docType: DocType | null
  /** Whether the scan looks like an invoice / warranty document at all */
  isInvoiceDocument: boolean
  /** Calendar date as YYYY-MM-DD */
  date: string | null
  supplier: string | null
  description: string | null
  /** Total incl. VAT; negative for credit notes */
  amount: number | null
  /** ISO currency code, e.g. CHF */
  currency: string | null
  invoiceNumber: string | null
  articles: string[]
  warrantyMonths: number | null
}

export interface AnalysisResult {
  suggestion: Suggestion
  pagesAnalyzed: number
  totalPages: number
  analyzedAt: string
  model: string
}

export type AnalysisErrorCode =
  | "missing_key" // no API key configured
  | "invalid_key"
  | "no_credit"
  | "unreachable" // Claude API not reachable
  | "timeout" // analysis took longer than 60 s
  | "unreadable" // damaged or password-protected PDF
  | "too_large" // > 30 MB
  | "not_found" // scan no longer in the inbox
  | "inbox_unreachable" // NAS not reachable
  | "bad_response" // AI answer unusable / refused
  | "invalid_name"
  | "unknown"

export type AnalyzeResponse =
  | ({ ok: true; cached: boolean } & AnalysisResult)
  | { ok: false; code: AnalysisErrorCode }

export interface AnalyzeRequest {
  name: string
  /** "Neu analysieren": ignore a remembered result */
  force?: boolean
}
