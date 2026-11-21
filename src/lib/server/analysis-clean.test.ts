// @vitest-environment node
import { describe, expect, it } from "vitest"
import { cleanArticle, cleanDescription } from "./analysis"

describe("cleanDescription (PROJ-4 BUG-1)", () => {
  it.each([
    // real answers from the QA sample
    ["Elektrizität Rechnung Periode 09-10/2026", "Elektrizität"],
    ["Strom Rechnung E-Mobility", "Strom E-Mobility"],
    // must stay unchanged
    ["Monitor Dell U2724D", "Monitor Dell U2724D"],
    ["iPhone 15 Pro", "iPhone 15 Pro"],
    ["Winterreifen Michelin", "Winterreifen Michelin"],
    // special characters and document words
    ["Kabel/Adapter_USB-C", "Kabel Adapter USB-C"],
    ["Garantie Kühlschrank", "Kühlschrank"],
    ["Zahnreinigung vom 01.09.2026 bis 31.10.2026", "Zahnreinigung"],
  ])("%s → %s", (input, expected) => {
    expect(cleanDescription(input)).toBe(expected)
  })

  it("keeps at most 5 words", () => {
    expect(cleanDescription("eins zwei drei vier fünf sechs sieben")).toBe("eins zwei drei vier fünf")
  })

  it("returns null when nothing useful is left", () => {
    expect(cleanDescription("Rechnung 2026")).toBeNull()
    expect(cleanDescription("   ")).toBeNull()
    expect(cleanDescription(null)).toBeNull()
  })
})

describe("cleanArticle (PROJ-4 BUG-1)", () => {
  it.each([
    ["Energie 73.14", "Energie"],
    ["Netznutzung 53.37", "Netznutzung"],
    ["Kabel CHF 9.90", "Kabel"],
    ["Monitor 1'299.00 CHF", "Monitor"],
    ["Rabatt -10,00", "Rabatt"],
    ["iPhone 15 Pro", "iPhone 15 Pro"],
    ["Mietvertrag 2026", "Mietvertrag 2026"],
  ])("%s → %s", (input, expected) => {
    expect(cleanArticle(input)).toBe(expected)
  })

  it("drops empty entries", () => {
    expect(cleanArticle("  ")).toBeNull()
    expect(cleanArticle("CHF 9.90")).toBeNull()
  })
})
