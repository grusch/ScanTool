// Shared contract between the settings UI and the local API routes (PROJ-1).

export type FolderKind = "inbox" | "archive"

export type FolderStatus = "ok" | "not_found" | "not_a_directory" | "no_access"

export interface FolderCheck {
  status: FolderStatus
  /** Cleaned path as the server interpreted it */
  path: string
  /** Number of PDFs in the folder (inbox only, status "ok") */
  pdfCount?: number
}

export interface Settings {
  inboxPath: string
  archivePath: string
  /** ISO timestamp */
  updatedAt: string
}

/** GET /api/settings */
export interface SettingsStatusResponse {
  /** null = never configured (first start) */
  settings: Settings | null
  inbox: FolderCheck | null
  archive: FolderCheck | null
  apiKeyPresent: boolean
}

/** POST /api/settings/check-folder and POST /api/settings/create-folder */
export interface FolderRequest {
  path: string
  kind: FolderKind
}

/** PUT /api/settings */
export interface SaveSettingsRequest {
  inboxPath: string
  archivePath: string
}

export type SaveSettingsErrorCode =
  | "validation"
  | "same_folder"
  | "nested"
  | "invalid_folder"
  | "unknown"

export interface SaveSettingsError {
  code: SaveSettingsErrorCode
  message: string
  field?: "inboxPath" | "archivePath"
}

/** POST /api/settings/test-connection */
export type ConnectionErrorCode =
  | "missing_key"
  | "invalid_key"
  | "no_credit"
  | "unreachable"
  | "unknown"

export type ConnectionTestResponse =
  | { ok: true }
  | { ok: false; code: ConnectionErrorCode }
