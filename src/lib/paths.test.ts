import { describe, expect, it } from "vitest"
import { cleanPath, isAbsoluteWindowsPath, isNestedPath, isSamePath } from "./paths"

describe("cleanPath", () => {
  it("trims whitespace and removes surrounding quotes", () => {
    expect(cleanPath('  "C:\\Scans\\Eingang"  ')).toBe("C:\\Scans\\Eingang")
  })
  it("removes trailing backslashes", () => {
    expect(cleanPath("C:\\Scans\\")).toBe("C:\\Scans")
  })
  it("keeps drive root", () => {
    expect(cleanPath("C:\\")).toBe("C:\\")
    expect(cleanPath("C:")).toBe("C:\\")
  })
  it("converts forward slashes and collapses duplicates", () => {
    expect(cleanPath("C:/Scans//Eingang/")).toBe("C:\\Scans\\Eingang")
  })
  it("keeps UNC prefix", () => {
    expect(cleanPath("\\\\NAS\\Scans\\")).toBe("\\\\NAS\\Scans")
  })
})

describe("isSamePath", () => {
  it("ignores case and trailing backslash", () => {
    expect(isSamePath("C:\\Scans\\", "c:\\scans")).toBe(true)
  })
  it("detects different paths", () => {
    expect(isSamePath("C:\\Scans", "C:\\Scans2")).toBe(false)
  })
})

describe("isNestedPath", () => {
  it("detects inbox inside archive and vice versa", () => {
    expect(isNestedPath("C:\\Ablage\\Eingang", "C:\\Ablage")).toBe(true)
    expect(isNestedPath("C:\\Ablage", "c:\\ablage\\eingang\\")).toBe(true)
  })
  it("does not treat name prefixes as nesting", () => {
    expect(isNestedPath("C:\\Scans", "C:\\Scans2")).toBe(false)
  })
  it("returns false for identical paths", () => {
    expect(isNestedPath("C:\\Scans", "c:\\scans")).toBe(false)
  })
  it("handles drive roots", () => {
    expect(isNestedPath("C:\\", "C:\\Scans")).toBe(true)
  })
})

describe("isAbsoluteWindowsPath", () => {
  it("accepts drive and UNC paths", () => {
    expect(isAbsoluteWindowsPath("C:\\Scans")).toBe(true)
    expect(isAbsoluteWindowsPath("\\\\NAS\\Scans")).toBe(true)
  })
  it("rejects relative paths", () => {
    expect(isAbsoluteWindowsPath("Scans\\Eingang")).toBe(false)
    expect(isAbsoluteWindowsPath("")).toBe(false)
  })
})
