import { describe, expect, it } from "vitest"
import {
  CSS_PER_POINT,
  currentPageIndex,
  displaySize,
  pageScale,
  pagesToRender,
  rotate,
  scaleToPercent,
  zoomIn,
  zoomOut,
} from "./preview-view"

const A4 = { width: 595, height: 842 }

describe("rotate", () => {
  it("adds steps and stays within 0/90/180/270", () => {
    expect(rotate(0, 90)).toBe(90)
    expect(rotate(0, -90)).toBe(270)
    expect(rotate(270, 90)).toBe(0)
    expect(rotate(90, 180)).toBe(270)
  })
  it("right then left = start; 180 twice = start", () => {
    expect(rotate(rotate(0, 90), -90)).toBe(0)
    expect(rotate(rotate(0, 180), 180)).toBe(0)
  })
})

describe("displaySize", () => {
  it("swaps width and height for 90/270", () => {
    expect(displaySize(A4, 90)).toEqual({ width: 842, height: 595 })
    expect(displaySize(A4, 270)).toEqual({ width: 842, height: 595 })
    expect(displaySize(A4, 180)).toEqual(A4)
  })
})

describe("pageScale", () => {
  const view = { width: 600, height: 400 }
  it("fit-width: page width = available width", () => {
    expect(A4.width * pageScale(A4, 0, { kind: "fit-width" }, view)).toBeCloseTo(600)
  })
  it("fit-page: whole page fits (height limits here)", () => {
    const s = pageScale(A4, 0, { kind: "fit-page" }, view)
    expect(A4.height * s).toBeCloseTo(400)
    expect(A4.width * s).toBeLessThanOrEqual(600)
  })
  it("fit-width on a rotated page uses the swapped width", () => {
    expect(842 * pageScale(A4, 90, { kind: "fit-width" }, view)).toBeCloseTo(600)
  })
  it("percent: 100 % = real size (96/72)", () => {
    expect(pageScale(A4, 0, { kind: "percent", value: 100 }, view)).toBeCloseTo(CSS_PER_POINT)
    expect(scaleToPercent(pageScale(A4, 0, { kind: "percent", value: 125 }, view))).toBe(125)
  })
  it("falls back to 100 % when the column has no size yet", () => {
    expect(pageScale(A4, 0, { kind: "fit-width" }, { width: 0, height: 0 })).toBe(CSS_PER_POINT)
  })
})

describe("zoomIn / zoomOut", () => {
  it("moves to the next step from the effective value", () => {
    expect(zoomIn(100)).toBe(125)
    expect(zoomIn(107)).toBe(125)
    expect(zoomOut(107)).toBe(100)
    expect(zoomOut(100)).toBe(75)
  })
  it("stops at 50 % and 300 %", () => {
    expect(zoomIn(300)).toBeNull()
    expect(zoomOut(50)).toBeNull()
    expect(zoomIn(320)).toBeNull()
    expect(zoomOut(40)).toBeNull()
  })
})

describe("currentPageIndex / pagesToRender", () => {
  const tops = [0, 1000, 2000, 3000]
  const heights = [990, 990, 990, 990]
  it("picks the page with the largest visible part", () => {
    expect(currentPageIndex(tops, heights, 0, 800)).toBe(0)
    expect(currentPageIndex(tops, heights, 700, 800)).toBe(1)
    expect(currentPageIndex(tops, heights, 2900, 800)).toBe(3)
  })
  it("renders visible pages plus one screen margin, not all", () => {
    const r = pagesToRender(tops, heights, 0, 800)
    expect([...r].sort()).toEqual([0, 1])
    expect(pagesToRender([...Array(30)].map((_, i) => i * 1000), Array(30).fill(990), 15000, 800).size).toBeLessThan(6)
  })
})
