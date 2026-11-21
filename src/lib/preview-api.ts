// Browser-side client for delivering one scan from the inbox (PROJ-3).

/** Why a scan could not be loaded – mapped to the messages of the spec */
export type ScanLoadError =
  | "not_found" // file no longer in the inbox
  | "unreachable" // inbox folder / NAS not reachable
  | "damaged" // not a valid PDF (detected by the PDF library or the server)
  | "password" // password-protected PDF
  | "unknown" // server did not answer / unexpected response

/** Address of a scan – used for loading and for "Open in new tab" */
export function scanFileUrl(name: string): string {
  return `/api/inbox/file?name=${encodeURIComponent(name)}`
}

export type ScanFetchResult = { ok: true; blob: Blob } | { ok: false; error: ScanLoadError }

/** Loads a scan as Blob (never cached, so a replaced file with the same name shows its new content) */
export async function fetchScan(name: string, signal?: AbortSignal): Promise<ScanFetchResult> {
  let res: Response
  try {
    res = await fetch(scanFileUrl(name), { cache: "no-store", signal })
  } catch (err) {
    if (signal?.aborted) throw err
    return { ok: false, error: "unknown" }
  }
  if (res.ok) return { ok: true, blob: await res.blob() }

  let code: unknown
  try {
    code = ((await res.json()) as { code?: unknown }).code
  } catch {
    code = undefined
  }
  if (code === "not_found" || res.status === 404) return { ok: false, error: "not_found" }
  if (code === "unreachable" || res.status === 503) return { ok: false, error: "unreachable" }
  if (code === "invalid_name") return { ok: false, error: "not_found" }
  return { ok: false, error: "unknown" }
}

export const SCAN_ERROR_MESSAGES: Record<ScanLoadError, string> = {
  not_found: "Der Scan ist nicht mehr im Eingang.",
  unreachable: "Eingangsordner nicht erreichbar – ist die NAS eingeschaltet?",
  damaged: "Dieser Scan lässt sich nicht anzeigen – die Datei ist beschädigt oder kein gültiges PDF.",
  password: "Dieser Scan ist passwortgeschützt und kann nicht angezeigt werden.",
  unknown: "Der Scan konnte nicht geladen werden – antwortet der lokale Server?",
}
