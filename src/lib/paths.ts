// Windows path helpers shared by UI and server (PROJ-1).
// Pure string logic – no filesystem access.

/**
 * Cleans a pasted path: trims whitespace, removes surrounding quotes
 * (Explorer "Copy as path"), unifies separators and drops a trailing
 * backslash (except for drive roots like "C:\").
 */
export function cleanPath(input: string): string {
  let p = input.trim()
  if (p.length >= 2 && p.startsWith('"') && p.endsWith('"')) {
    p = p.slice(1, -1).trim()
  }
  p = p.replace(/\//g, "\\")
  // collapse duplicate separators, but keep a leading UNC "\\"
  const isUnc = p.startsWith("\\\\")
  p = (isUnc ? "\\\\" : "") + p.slice(isUnc ? 2 : 0).replace(/\\{2,}/g, "\\")
  if (p.length > 3 && p.endsWith("\\")) {
    p = p.replace(/\\+$/, "")
  }
  if (/^[a-zA-Z]:$/.test(p)) {
    p += "\\"
  }
  return p
}

/** Comparison key: cleaned and case-insensitive (Windows semantics). */
function key(input: string): string {
  return cleanPath(input).toLowerCase()
}

export function isSamePath(a: string, b: string): boolean {
  return key(a) === key(b)
}

/** True if one path lies inside the other (not if they are equal). */
export function isNestedPath(a: string, b: string): boolean {
  const ka = key(a)
  const kb = key(b)
  if (ka === kb) return false
  const withSep = (k: string) => (k.endsWith("\\") ? k : k + "\\")
  return ka.startsWith(withSep(kb)) || kb.startsWith(withSep(ka))
}

/** Absolute Windows path: drive ("C:\...") or UNC ("\\server\share"). */
export function isAbsoluteWindowsPath(input: string): boolean {
  const p = cleanPath(input)
  return /^[a-zA-Z]:\\/.test(p) || /^\\\\[^\\]+\\[^\\]+/.test(p)
}
