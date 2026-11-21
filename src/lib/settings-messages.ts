import type { ConnectionErrorCode, FolderCheck } from "./settings-types"

export function folderCheckMessage(check: FolderCheck, showPdfCount: boolean): string {
  switch (check.status) {
    case "ok":
      return showPdfCount
        ? `Ordner gefunden, ${check.pdfCount ?? 0} ${check.pdfCount === 1 ? "PDF" : "PDFs"}`
        : "Ordner gefunden"
    case "not_found":
      return "Ordner nicht gefunden"
    case "not_a_directory":
      return "Pfad ist kein Ordner"
    case "no_access":
      return "Kein Lese-/Schreibzugriff auf diesen Ordner"
  }
}

export const CONNECTION_MESSAGES: Record<ConnectionErrorCode, string> = {
  missing_key:
    "Kein API-Schlüssel gefunden. Trage ANTHROPIC_API_KEY in .env.local ein und starte das Tool neu.",
  invalid_key: "API-Schlüssel wurde abgelehnt. Prüfe ihn in der Anthropic Console.",
  no_credit: "Kein Guthaben auf dem API-Konto. Lade es in der Anthropic Console auf.",
  unreachable: "Claude ist nicht erreichbar. Prüfe die Internetverbindung.",
  unknown: "Unerwarteter Fehler beim Verbindungstest. Bitte später erneut versuchen.",
}

export const MSG_SAME_FOLDER = "Eingangs- und Ablageordner müssen verschieden sein"
export const MSG_NESTED = "Eingangs- und Ablageordner dürfen nicht ineinander liegen"
