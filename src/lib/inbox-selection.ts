// Selection rules for the inbox list (PROJ-2). Pure functions – no React.

/**
 * Decides which scan is selected after the list changed.
 * - nothing selected → oldest (first)
 * - selected still present → keep it
 * - selected vanished → next surviving scan after it, else the one before it
 * - list empty → null
 */
export function reconcileSelection(
  prevIds: readonly string[],
  nextIds: readonly string[],
  selected: string | null
): string | null {
  if (nextIds.length === 0) return null
  if (selected === null) return nextIds[0]
  const next = new Set(nextIds)
  if (next.has(selected)) return selected

  const idx = prevIds.indexOf(selected)
  if (idx === -1) return nextIds[0]
  for (let i = idx + 1; i < prevIds.length; i++) {
    if (next.has(prevIds[i])) return prevIds[i]
  }
  for (let i = idx - 1; i >= 0; i--) {
    if (next.has(prevIds[i])) return prevIds[i]
  }
  // None of the previous scans survived → newest list starts over
  return nextIds[0]
}

/** Moves the selection by `delta` (±1), clamped to the list bounds. */
export function moveSelection(ids: readonly string[], selected: string | null, delta: number): string | null {
  if (ids.length === 0) return null
  const idx = selected === null ? -1 : ids.indexOf(selected)
  if (idx === -1) return ids[0]
  const target = Math.min(ids.length - 1, Math.max(0, idx + delta))
  return ids[target]
}
