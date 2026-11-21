// File name rule for filing (PROJ-5) – used in the browser (instant feedback) and on the
// server (never trusts the browser). Only a name, never a path.

export const MAX_NAME_LENGTH = 100

const RESERVED = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])$/i

export type FileNameCheck = { ok: true; name: string } | { ok: false; message: string }

/** Validates a user-entered file name; adds ".pdf" when missing (any case of the extension counts) */
export function validateFileName(input: string): FileNameCheck {
  const raw = input.trim()
  if (!raw) return { ok: false, message: "Dateiname fehlt" }
  const forbidden = /[\\/:*?"<>|]/.exec(raw)
  if (forbidden) return { ok: false, message: `Unerlaubtes Zeichen: ${forbidden[0]}` }
  if (/[\u0000-\u001f\u007f]/.test(raw)) return { ok: false, message: "Unerlaubtes Steuerzeichen" }

  // Office/OneDrive treat "~$…" as temporary files: not synced, hidden in the inbox list
  if (raw.startsWith("~$")) return { ok: false, message: "Darf nicht mit ~$ beginnen" }

  const name = /\.pdf$/i.test(raw) ? raw : `${raw}.pdf`
  const stem = name.slice(0, -4)
  if (!stem.replace(/[.\s]/g, "")) return { ok: false, message: "Dateiname fehlt" }
  if (/[.\s]$/.test(stem)) return { ok: false, message: "Darf nicht mit Punkt oder Leerzeichen enden" }
  if (RESERVED.test(stem.split(".")[0])) return { ok: false, message: `„${stem}“ ist unter Windows reserviert` }
  if (name.length > MAX_NAME_LENGTH) return { ok: false, message: `Höchstens ${MAX_NAME_LENGTH} Zeichen (jetzt ${name.length})` }
  return { ok: true, name }
}
