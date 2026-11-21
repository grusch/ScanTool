// Display helpers for the inbox list (PROJ-2).

const DAY_MS = 24 * 60 * 60 * 1000
/** Scans waiting at least this many days get a "seit X Tagen" marker */
export const OVERDUE_DAYS = 7

const dateTime = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const time = new Intl.DateTimeFormat("de-CH", { hour: "2-digit", minute: "2-digit" })

const decimal = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 1 })

/** "21.11.2026, 09:35" */
export function formatScanDate(iso: string): string {
  return dateTime.format(new Date(iso))
}

/** "14:32" */
export function formatTime(iso: string): string {
  return time.format(new Date(iso))
}

/** "512 B", "245 KB", "1.2 MB" */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${decimal.format(bytes / (1024 * 1024))} MB`
}

/** Days a scan has been waiting, or null if below the threshold or in the future. */
export function overdueDays(modifiedIso: string, now: Date = new Date()): number | null {
  const diff = now.getTime() - new Date(modifiedIso).getTime()
  if (diff < 0) return null
  const days = Math.floor(diff / DAY_MS)
  return days >= OVERDUE_DAYS ? days : null
}
