// Browser-side client for filing (PROJ-5).
import type { FilingErrorCode, FilingRequest, FilingResponse, UndoResponse } from "./filing-types"

async function post<T>(url: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const json = (await res.json()) as T
    if (json && typeof json === "object" && "ok" in json) return json
  } catch {
    // fall through
  }
  return fallback
}

export function fileScan(request: FilingRequest): Promise<FilingResponse> {
  return post<FilingResponse>("/api/filing", request, { ok: false, code: "unknown" })
}

export function undoFiling(token: string): Promise<UndoResponse> {
  return post<UndoResponse>("/api/filing/undo", { token }, { ok: false, code: "unknown" })
}

export const FILING_MESSAGES: Record<FilingErrorCode, string> = {
  not_found: "Der Scan ist nicht mehr im Eingang.",
  inbox_unreachable: "Eingangsordner nicht erreichbar – nichts wurde verändert.",
  archive_unreachable: "Ablage-Ordner nicht erreichbar – der Scan bleibt im Eingang.",
  no_permission: "Ablegen nicht möglich (keine Schreibrechte oder kein Speicherplatz) – nichts wurde gelöscht.",
  invalid_request: "Ungültiger Dateiname oder Zielordner.",
  unknown: "Ablegen fehlgeschlagen – antwortet der lokale Server? Nichts wurde gelöscht.",
}

export const UNDO_MESSAGES: Record<Exclude<UndoResponse, { ok: true }>["code"], string> = {
  expired: "Rückgängig nicht mehr möglich (zu lange her oder ScanTool neu gestartet).",
  gone: "Rückgängig nicht möglich – Datei nicht mehr am Ablageort.",
  inbox_unreachable: "Rückgängig nicht möglich – Eingangsordner nicht erreichbar.",
  unknown: "Rückgängig fehlgeschlagen.",
}
