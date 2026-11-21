// Settings use-cases shared by API routes and server pages (PROJ-1).
import { cleanPath, isAbsoluteWindowsPath, isNestedPath, isSamePath } from "@/lib/paths"
import { folderCheckMessage, MSG_NESTED, MSG_SAME_FOLDER } from "@/lib/settings-messages"
import type {
  SaveSettingsError,
  SaveSettingsRequest,
  Settings,
  SettingsStatusResponse,
} from "@/lib/settings-types"
import { apiKeyPresent } from "./anthropic"
import { checkFolder } from "./folders"
import { readSettings, writeSettings } from "./settings-store"

export async function getSettingsStatus(): Promise<SettingsStatusResponse> {
  const settings = await readSettings()
  if (!settings) {
    return { settings: null, inbox: null, archive: null, apiKeyPresent: apiKeyPresent() }
  }
  const [inbox, archive] = await Promise.all([
    checkFolder(settings.inboxPath, "inbox"),
    checkFolder(settings.archivePath, "archive"),
  ])
  return { settings, inbox, archive, apiKeyPresent: apiKeyPresent() }
}

/** True when both folders are configured and currently valid. */
export function isConfigured(status: SettingsStatusResponse): boolean {
  return status.inbox?.status === "ok" && status.archive?.status === "ok"
}

export type SaveOutcome = { ok: true; settings: Settings } | { ok: false; error: SaveSettingsError }

export async function saveSettings(req: SaveSettingsRequest): Promise<SaveOutcome> {
  const inboxPath = cleanPath(req.inboxPath)
  const archivePath = cleanPath(req.archivePath)

  for (const [field, value] of [
    ["inboxPath", inboxPath],
    ["archivePath", archivePath],
  ] as const) {
    if (!isAbsoluteWindowsPath(value)) {
      return {
        ok: false,
        error: { code: "validation", field, message: "Bitte einen vollständigen Pfad angeben" },
      }
    }
  }

  if (isSamePath(inboxPath, archivePath)) {
    return { ok: false, error: { code: "same_folder", field: "archivePath", message: MSG_SAME_FOLDER } }
  }
  if (isNestedPath(inboxPath, archivePath)) {
    return { ok: false, error: { code: "nested", field: "archivePath", message: MSG_NESTED } }
  }

  const [inbox, archive] = await Promise.all([
    checkFolder(inboxPath, "inbox"),
    checkFolder(archivePath, "archive"),
  ])
  if (inbox.status !== "ok") {
    return {
      ok: false,
      error: { code: "invalid_folder", field: "inboxPath", message: folderCheckMessage(inbox, false) },
    }
  }
  if (archive.status !== "ok") {
    return {
      ok: false,
      error: { code: "invalid_folder", field: "archivePath", message: folderCheckMessage(archive, false) },
    }
  }

  return { ok: true, settings: await writeSettings({ inboxPath, archivePath }) }
}
