import { describe, expect, it } from "vitest"
import { moveSelection, reconcileSelection } from "./inbox-selection"

describe("reconcileSelection", () => {
  it("selects the oldest scan when nothing is selected", () => {
    expect(reconcileSelection([], ["a", "b"], null)).toBe("a")
  })

  it("returns null for an empty list", () => {
    expect(reconcileSelection(["a"], [], "a")).toBeNull()
  })

  it("keeps the selection if the scan still exists, even with new scans", () => {
    expect(reconcileSelection(["a", "b"], ["x", "a", "b", "c"], "b")).toBe("b")
  })

  it("selects the next scan when the selected one vanished", () => {
    expect(reconcileSelection(["a", "b", "c"], ["a", "c"], "b")).toBe("c")
  })

  it("skips vanished successors", () => {
    expect(reconcileSelection(["a", "b", "c", "d"], ["a", "d"], "b")).toBe("d")
  })

  it("selects the previous scan when the last one vanished", () => {
    expect(reconcileSelection(["a", "b", "c"], ["a", "b"], "c")).toBe("b")
  })

  it("falls back to the oldest if no previous scan survived", () => {
    expect(reconcileSelection(["a", "b"], ["x", "y"], "a")).toBe("x")
  })

  it("selects the oldest if the selection is unknown", () => {
    expect(reconcileSelection(["a"], ["b", "c"], "zzz")).toBe("b")
  })

  it("auto-selects a new scan after the inbox was empty", () => {
    expect(reconcileSelection([], ["new.pdf"], null)).toBe("new.pdf")
  })
})

describe("moveSelection", () => {
  const ids = ["a", "b", "c"]
  it("moves down and up", () => {
    expect(moveSelection(ids, "a", 1)).toBe("b")
    expect(moveSelection(ids, "c", -1)).toBe("b")
  })
  it("stays at the ends", () => {
    expect(moveSelection(ids, "c", 1)).toBe("c")
    expect(moveSelection(ids, "a", -1)).toBe("a")
  })
  it("selects the first if nothing is selected", () => {
    expect(moveSelection(ids, null, 1)).toBe("a")
  })
  it("returns null for an empty list", () => {
    expect(moveSelection([], null, 1)).toBeNull()
  })
})
