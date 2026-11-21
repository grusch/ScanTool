import { describe, expect, it } from "vitest"
import { MAX_NAME_LENGTH, validateFileName } from "./file-name-rules"

describe("validateFileName", () => {
  it("accepts a normal name and keeps umlauts, & and dots", () => {
    expect(validateFileName("261102_Müller-&-Söhne_Brack.ch.pdf")).toEqual({ ok: true, name: "261102_Müller-&-Söhne_Brack.ch.pdf" })
  })
  it("adds .pdf when missing, accepts .PDF", () => {
    expect(validateFileName("Rechnung")).toEqual({ ok: true, name: "Rechnung.pdf" })
    expect(validateFileName("Rechnung.PDF")).toEqual({ ok: true, name: "Rechnung.PDF" })
  })
  it.each(["\\", "/", ":", "*", "?", '"', "<", ">", "|"])("rejects %s", (c) => {
    const r = validateFileName(`a${c}b.pdf`)
    expect(r).toEqual({ ok: false, message: `Unerlaubtes Zeichen: ${c}` })
  })
  it("rejects paths like ..\\x.pdf", () => {
    expect(validateFileName("..\\Ablage\\x.pdf").ok).toBe(false)
    expect(validateFileName("../x.pdf").ok).toBe(false)
  })
  it("rejects empty names, only dots/spaces, trailing dot or space", () => {
    expect(validateFileName("   ").ok).toBe(false)
    expect(validateFileName("...pdf").ok).toBe(false)
    expect(validateFileName(" . .pdf").ok).toBe(false)
    expect(validateFileName("name..pdf").ok).toBe(false)
    expect(validateFileName("name .pdf").ok).toBe(false)
  })
  it("rejects control characters", () => {
    expect(validateFileName("a\u0007b.pdf").ok).toBe(false)
  })
  it.each(["CON", "nul.pdf", "COM1.pdf", "lpt9", "aux.backup.pdf"])("rejects the Windows name %s", (n) => {
    expect(validateFileName(n).ok).toBe(false)
  })
  it("allows names that only start like a reserved one", () => {
    expect(validateFileName("Console.pdf").ok).toBe(true)
  })
  it(`limits to ${MAX_NAME_LENGTH} characters including .pdf`, () => {
    expect(validateFileName("x".repeat(96)).ok).toBe(true)
    expect(validateFileName("x".repeat(97)).ok).toBe(false)
  })
})
