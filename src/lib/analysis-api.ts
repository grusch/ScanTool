// Browser-side client for POST /api/analysis (PROJ-4).
import type { AnalysisErrorCode, AnalyzeResponse } from "./analysis-types"

export async function analyzeScan(name: string, force: boolean, signal?: AbortSignal): Promise<AnalyzeResponse> {
  let res: Response
  try {
    res = await fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, force }),
      cache: "no-store",
      signal,
    })
  } catch (err) {
    if (signal?.aborted) throw err
    return { ok: false, code: "unknown" }
  }
  try {
    const body = (await res.json()) as AnalyzeResponse
    if (body && typeof body === "object" && "ok" in body) return body
  } catch {
    // fall through
  }
  if (res.status === 404) return { ok: false, code: "not_found" }
  return { ok: false, code: "unknown" }
}

/** User-facing messages; `retry` = offer "Erneut versuchen" */
export const ANALYSIS_MESSAGES: Record<AnalysisErrorCode, { text: string; retry: boolean }> = {
  missing_key: { text: "KI-Analyse nicht verfügbar – API-Schlüssel in den Einstellungen hinterlegen.", retry: false },
  invalid_key: { text: "Der API-Schlüssel ist ungültig – bitte in den Einstellungen prüfen.", retry: true },
  no_credit: { text: "Kein Guthaben mehr in der Anthropic Console – bitte aufladen.", retry: true },
  unreachable: { text: "Claude ist nicht erreichbar – Internetverbindung prüfen.", retry: true },
  timeout: { text: "Die Analyse dauert zu lange (über 60 Sekunden).", retry: true },
  unreadable: { text: "Scan kann nicht analysiert werden (beschädigt oder passwortgeschützt).", retry: false },
  too_large: { text: "Scan zu gross für die KI-Analyse – bitte Felder selbst ausfüllen.", retry: false },
  not_found: { text: "Der Scan ist nicht mehr im Eingang.", retry: false },
  inbox_unreachable: { text: "Eingangsordner nicht erreichbar – ist die NAS eingeschaltet?", retry: true },
  bad_response: { text: "Die KI-Antwort war unbrauchbar.", retry: true },
  invalid_name: { text: "Ungültiger Dateiname.", retry: false },
  unknown: { text: "Die Analyse ist fehlgeschlagen – antwortet der lokale Server?", retry: true },
}
