import { describe, expect, it } from "vitest"
import { formatScanDate, formatSize, overdueDays } from "./inbox-format"

describe("formatSize", () => {
  it("formats bytes, KB and MB", () => {
    expect(formatSize(512)).toBe("512 B")
    expect(formatSize(250 * 1024)).toBe("250 KB")
    expect(formatSize(1.25 * 1024 * 1024)).toBe("1.3 MB")
  })
})

describe("formatScanDate", () => {
  it("uses the Swiss date/time format", () => {
    const local = new Date(2026, 10, 21, 9, 35)
    expect(formatScanDate(local.toISOString())).toBe("21.11.2026, 09:35")
  })
})

describe("overdueDays", () => {
  const now = new Date("2026-11-21T12:00:00Z")
  it("returns null below 7 days", () => {
    expect(overdueDays("2026-11-15T12:00:00Z", now)).toBeNull()
  })
  it("returns the number of days from 7 days on", () => {
    expect(overdueDays("2026-11-14T12:00:00Z", now)).toBe(7)
    expect(overdueDays("2026-11-12T11:00:00Z", now)).toBe(9)
  })
  it("returns null for dates in the future", () => {
    expect(overdueDays("2026-12-01T00:00:00Z", now)).toBeNull()
  })
})
