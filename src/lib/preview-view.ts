// View logic of the PDF preview (PROJ-3): zoom steps, fit modes, rotation.
// Pure functions – no React, no PDF library – so they can be unit-tested.

/** Zoom steps in percent for "+" / "−" and Ctrl + mouse wheel */
export const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 250, 300] as const
export const ZOOM_MIN = ZOOM_STEPS[0]
export const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1]

/**
 * 100 % = real size on screen (like browser PDF viewers): 1 PDF point = 1/72 inch,
 * 1 CSS pixel = 1/96 inch → scale factor 96/72.
 */
export const CSS_PER_POINT = 96 / 72

export type ZoomMode = { kind: "fit-width" } | { kind: "fit-page" } | { kind: "percent"; value: number }

export type Rotation = 0 | 90 | 180 | 270

/** Page size in PDF points, already including the page's own /Rotate */
export interface PageSize {
  width: number
  height: number
}

/** Available space for one page inside the scroll area (CSS px, padding already subtracted) */
export interface Viewport {
  width: number
  height: number
}

/** Adds a rotation step (−90, +90, +180) to the current rotation, always 0/90/180/270 */
export function rotate(current: Rotation, delta: -90 | 90 | 180): Rotation {
  return ((((current + delta) % 360) + 360) % 360) as Rotation
}

/** Page size as displayed – width/height swapped for 90°/270° */
export function displaySize(page: PageSize, rotation: Rotation): PageSize {
  return rotation === 90 || rotation === 270 ? { width: page.height, height: page.width } : page
}

/**
 * Scale factor (PDF points → CSS px) for one page.
 * fit-width: page width = available width; fit-page: whole page visible; percent: fixed.
 */
export function pageScale(page: PageSize, rotation: Rotation, mode: ZoomMode, view: Viewport): number {
  if (mode.kind === "percent") return (mode.value / 100) * CSS_PER_POINT
  const size = displaySize(page, rotation)
  if (size.width <= 0 || size.height <= 0 || view.width <= 0) return CSS_PER_POINT
  const byWidth = view.width / size.width
  if (mode.kind === "fit-width") return byWidth
  if (view.height <= 0) return byWidth
  return Math.min(byWidth, view.height / size.height)
}

/** Scale factor → percent as shown in the toolbar (rounded) */
export function scaleToPercent(scale: number): number {
  return Math.round((scale / CSS_PER_POINT) * 100)
}

/** Next larger zoom step from the current effective percent, or null at the upper limit */
export function zoomIn(currentPercent: number): number | null {
  const next = ZOOM_STEPS.find((s) => s > currentPercent + 0.5)
  return next ?? null
}

/** Next smaller zoom step from the current effective percent, or null at the lower limit */
export function zoomOut(currentPercent: number): number | null {
  const prev = [...ZOOM_STEPS].reverse().find((s) => s < currentPercent - 0.5)
  return prev ?? null
}

/**
 * Index of the page that occupies most of the visible area.
 * `tops`/`heights` are the page positions inside the scroll content (CSS px).
 */
export function currentPageIndex(
  tops: number[],
  heights: number[],
  scrollTop: number,
  viewHeight: number
): number {
  if (tops.length === 0) return 0
  const top = scrollTop
  const bottom = scrollTop + viewHeight
  let best = 0
  let bestVisible = -1
  for (let i = 0; i < tops.length; i++) {
    const visible = Math.min(bottom, tops[i] + heights[i]) - Math.max(top, tops[i])
    if (visible > bestVisible) {
      best = i
      bestVisible = visible
    }
  }
  return best
}

/**
 * Pages that should be drawn: visible ones plus a margin of one screen height
 * above and below (pages outside stay size-correct placeholders).
 */
export function pagesToRender(
  tops: number[],
  heights: number[],
  scrollTop: number,
  viewHeight: number
): Set<number> {
  const margin = Math.max(viewHeight, 400)
  const from = scrollTop - margin
  const to = scrollTop + viewHeight + margin
  const result = new Set<number>()
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] + heights[i] >= from && tops[i] <= to) result.add(i)
  }
  if (result.size === 0 && tops.length > 0) result.add(0)
  return result
}
