import { describe, expect, it } from "vitest"
import type { Suggestion } from "./analysis-types"
import {
  buildFileName,
  EMPTY_FIELDS,
  fieldsFromSuggestion,
  MAX_FILE_NAME_LENGTH,
  mergeFields,
  parseSwissDate,
  sanitizePart,
} from "./suggestion-form"

const base = { docType: "rechnung" as const, date: "21.11.2026", supplier: "Digitec", description: "Monitor Dell U2724D" }

describe("buildFileName", () => {
  it("builds JJMMTT_Lieferant_Beschreibung.pdf", () => {
    expect(buildFileName(base)).toEqual({ ok: true, name: "261121_Digitec_Monitor-Dell-U2724D.pdf" })
  })
  it("adds _Garantie for warranty documents", () => {
    expect(buildFileName({ ...base, docType: "garantieschein" })).toEqual({
      ok: true,
      name: "261121_Digitec_Monitor-Dell-U2724D_Garantie.pdf",
    })
  })
  it("keeps umlauts, turns spaces into dashes", () => {
    const r = buildFileName({ ...base, supplier: "Müller Söhne", description: "Kühlschrank groß" })
    expect(r).toEqual({ ok: true, name: "261121_Müller-Söhne_Kühlschrank-groß.pdf" })
  })
  it("removes forbidden characters and underscores", () => {
    const r = buildFileName({ ...base, supplier: 'A/B:C*D?"E<F>G|H_I\\J', description: "x__y" })
    expect(r).toEqual({ ok: true, name: "261121_A-B-C-D-E-F-G-H-I-J_x-y.pdf" })
  })
  it("keeps dots inside names but not at the ends", () => {
    expect(buildFileName({ ...base, supplier: "Brack.ch", description: "Kabel." })).toEqual({
      ok: true,
      name: "261121_Brack.ch_Kabel.pdf",
    })
  })
  it("shortens the description to max. 100 characters", () => {
    const r = buildFileName({ ...base, description: "Sehr lange Beschreibung ".repeat(10) })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.name.length).toBeLessThanOrEqual(MAX_FILE_NAME_LENGTH)
      expect(r.name.startsWith("261121_Digitec_Sehr-lange")).toBe(true)
      expect(r.name.endsWith(".pdf")).toBe(true)
      expect(r.name).not.toMatch(/-\.pdf$/)
    }
  })
  it("stays within 100 characters even with a huge supplier name", () => {
    const r = buildFileName({ ...base, docType: "garantieschein", supplier: "X".repeat(150) })
    expect(r.ok && r.name.length).toBeLessThanOrEqual(MAX_FILE_NAME_LENGTH)
    expect(r.ok && r.name.endsWith("_Garantie.pdf")).toBe(true)
  })
  it("names what is missing instead of a half name", () => {
    expect(buildFileName({ docType: "", date: "", supplier: "", description: "" })).toEqual({
      ok: false,
      missing: ["Datum fehlt", "Lieferant fehlt", "Beschreibung fehlt"],
    })
    expect(buildFileName({ ...base, date: "31.02.2026" })).toEqual({ ok: false, missing: ["Datum ungültig"] })
    expect(buildFileName({ ...base, supplier: "  ___ " })).toEqual({ ok: false, missing: ["Lieferant fehlt"] })
  })
})

describe("parseSwissDate", () => {
  it("accepts TT.MM.JJJJ and T.M.JJJJ", () => {
    expect(parseSwissDate("21.11.2026")).toEqual({ year: 2026, month: 11, day: 21 })
    expect(parseSwissDate("1.2.2026")).toEqual({ year: 2026, month: 2, day: 1 })
  })
  it("rejects impossible or malformed dates", () => {
    expect(parseSwissDate("29.02.2026")).toBeNull()
    expect(parseSwissDate("2026-11-21")).toBeNull()
    expect(parseSwissDate("21.11.26")).toBeNull()
  })
  it("knows leap years", () => {
    expect(parseSwissDate("29.02.2028")).not.toBeNull()
  })
})

describe("sanitizePart", () => {
  it("collapses dashes and trims", () => {
    expect(sanitizePart("  -- a  b --  ")).toBe("a-b")
  })
})

const suggestion: Suggestion = {
  docType: "garantieschein",
  isInvoiceDocument: true,
  date: "2026-11-21",
  supplier: "Digitec",
  description: "Monitor Dell U2724D",
  amount: -389.5,
  currency: "CHF",
  invoiceNumber: "R-123",
  articles: ["Monitor", "Kabel"],
  warrantyMonths: 24,
}

describe("fieldsFromSuggestion / mergeFields", () => {
  it("turns the AI suggestion into form text", () => {
    expect(fieldsFromSuggestion(suggestion)).toEqual({
      docType: "garantieschein",
      date: "21.11.2026",
      supplier: "Digitec",
      description: "Monitor Dell U2724D",
      amount: "-389.50",
      currency: "CHF",
      invoiceNumber: "R-123",
      warrantyMonths: "24",
      articles: "Monitor\nKabel",
    })
  })
  it("leaves unsure fields empty", () => {
    const unsure: Suggestion = { ...suggestion, date: null, amount: null, warrantyMonths: null, docType: null, articles: [] }
    const f = fieldsFromSuggestion(unsure)
    expect([f.date, f.amount, f.warrantyMonths, f.docType, f.articles]).toEqual(["", "", "", "", ""])
    expect(fieldsFromSuggestion(null)).toEqual(EMPTY_FIELDS)
  })
  it("never overwrites what the user typed – also not with an empty string", () => {
    const merged = mergeFields(fieldsFromSuggestion(suggestion), { supplier: "Galaxus", description: "" })
    expect(merged.supplier).toBe("Galaxus")
    expect(merged.description).toBe("")
    expect(merged.date).toBe("21.11.2026")
  })
})

describe("withFileDateFallback (Datum aus Datei-Eigenschaften)", () => {
  it("uses the file date when the AI found no invoice date", async () => {
    const { withFileDateFallback, isoToSwissDate } = await import("./suggestion-form")
    const local = new Date(2026, 10, 13, 23, 44) // 13.11.2026 local time
    expect(isoToSwissDate(local.toISOString())).toBe("13.11.2026")
    const r = withFileDateFallback(EMPTY_FIELDS, local.toISOString())
    expect(r).toEqual({ fields: { ...EMPTY_FIELDS, date: "13.11.2026" }, dateFromFile: true })
  })
  it("keeps the invoice date from the AI", async () => {
    const { withFileDateFallback } = await import("./suggestion-form")
    const ai = { ...EMPTY_FIELDS, date: "02.11.2026" }
    expect(withFileDateFallback(ai, new Date(2026, 10, 13).toISOString())).toEqual({ fields: ai, dateFromFile: false })
  })
  it("does nothing without a usable file date", async () => {
    const { withFileDateFallback } = await import("./suggestion-form")
    expect(withFileDateFallback(EMPTY_FIELDS, undefined).dateFromFile).toBe(false)
    expect(withFileDateFallback(EMPTY_FIELDS, "kein datum").dateFromFile).toBe(false)
  })
})
