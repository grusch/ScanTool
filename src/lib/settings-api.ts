// Browser-side client for the local settings API (PROJ-1).
import type {
  ConnectionTestResponse,
  FolderCheck,
  FolderRequest,
  SaveSettingsError,
  SaveSettingsRequest,
  Settings,
  SettingsStatusResponse,
} from "./settings-types"

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export async function fetchSettingsStatus(): Promise<SettingsStatusResponse> {
  return json(await fetch("/api/settings", { cache: "no-store" }))
}

export async function checkFolder(req: FolderRequest, signal?: AbortSignal): Promise<FolderCheck> {
  return json(
    await fetch("/api/settings/check-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    })
  )
}

export async function createFolder(req: FolderRequest): Promise<FolderCheck> {
  return json(
    await fetch("/api/settings/create-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
  )
}

export type SaveResult = { ok: true; settings: Settings } | { ok: false; error: SaveSettingsError }

export async function saveSettings(req: SaveSettingsRequest): Promise<SaveResult> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  if (res.ok) {
    return { ok: true, settings: (await res.json()) as Settings }
  }
  try {
    return { ok: false, error: (await res.json()) as SaveSettingsError }
  } catch {
    return { ok: false, error: { code: "unknown", message: "Speichern fehlgeschlagen" } }
  }
}

export async function testConnection(): Promise<ConnectionTestResponse> {
  try {
    return await json(await fetch("/api/settings/test-connection", { method: "POST" }))
  } catch {
    return { ok: false, code: "unknown" }
  }
}
