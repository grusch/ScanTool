// Shared contract between the filing UI and POST /api/filing (+ /api/filing/undo) – PROJ-5.

/** "rechnung" → <Ablage>\Rechnungen\<Jahr>\ · "scan" → <Eingang>\Abgelegt\ */
export type FilingTarget = "rechnung" | "scan"

export interface FilingRequest {
  /** File name of the scan in the inbox (no path) */
  scan: string
  target: FilingTarget
  /** New file name (no path); for "scan" null = keep the original name */
  fileName: string | null
  /** Year folder for "rechnung" (from the date field) */
  year?: number
}

export type FilingErrorCode =
  | "not_found" // scan no longer in the inbox
  | "inbox_unreachable"
  | "archive_unreachable" // archive folder missing / not reachable
  | "no_permission" // cannot write / no space
  | "invalid_request" // bad name, year or target
  | "unknown"

export type FilingResponse =
  | {
      ok: true
      /** filed: moved · already_filed: identical file was there, inbox cleaned · copied_not_deleted: copy ok, original locked */
      status: "filed" | "already_filed" | "copied_not_deleted"
      /** Where the file is now, for display (e.g. "Rechnungen\2026\261102_….pdf") */
      location: string
      /** Name had to get a number because it was taken */
      renamed: boolean
      /** Token for "Rückgängig" (only when the file was moved) */
      undoToken?: string
    }
  | { ok: false; code: FilingErrorCode }

export type UndoResponse =
  | { ok: true; name: string; renamed: boolean }
  | { ok: false; code: "expired" | "gone" | "inbox_unreachable" | "unknown" }
