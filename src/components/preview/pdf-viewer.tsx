"use client"

// Loaded only in the browser (next/dynamic with ssr: false) – PDF.js needs browser APIs.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Skeleton } from "@/components/ui/skeleton"
import { PreviewToolbar } from "@/components/preview/preview-toolbar"
import type { ScanLoadError } from "@/lib/preview-api"
import {
  currentPageIndex,
  displaySize,
  pageScale,
  pagesToRender,
  rotate,
  scaleToPercent,
  zoomIn,
  zoomOut,
  type PageSize,
  type Rotation,
  type ZoomMode,
} from "@/lib/preview-view"

// Worker is bundled and served locally (no CDN) – must be set in the module that renders <Document>
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

/** Padding of the scroll area and gap between pages (CSS px) */
const PAD = 16
const GAP = 16

interface PageInfo extends PageSize {
  /** Page's own /Rotate from the PDF */
  intrinsic: number
}

interface PdfViewerProps {
  blob: Blob
  newTabUrl: string
  onError: (error: ScanLoadError) => void
}

/** Skeleton in page shape while a scan or a page is loading */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex h-full items-start justify-center p-4"} role="status" aria-label="Scan wird geladen">
      <Skeleton className="aspect-[1/1.414] w-full max-w-[560px]" />
    </div>
  )
}

/**
 * Shows one scan: all pages below each other, only pages near the visible area are drawn.
 * Zoom and rotation live here – a new scan mounts a new viewer (key = name) and starts fresh.
 */
export function PdfViewer({ blob, newTabUrl, onError }: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<PageInfo[] | null>(null)
  const [mode, setMode] = useState<ZoomMode>({ kind: "fit-width" })
  const [rotation, setRotation] = useState<Rotation>(0)
  const [view, setView] = useState({ width: 0, height: 0 })
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRatio = useRef(0)

  // Available space follows the size of the preview column
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const measure = () =>
      setView({ width: Math.max(0, el.clientWidth - 2 * PAD), height: Math.max(0, el.clientHeight - 2 * PAD) })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Layout of all pages (sizes in CSS px, position inside the scroll content)
  const layout = useMemo(() => {
    if (!pages) return null
    const items = pages.map((p) => {
      const scale = pageScale(p, rotation, mode, view)
      const size = displaySize(p, rotation)
      return { scale, width: size.width * scale, height: size.height * scale }
    })
    const tops: number[] = []
    let y = PAD
    for (const it of items) {
      tops.push(y)
      y += it.height + GAP
    }
    const maxWidth = Math.max(0, ...items.map((i) => i.width))
    return { items, tops, heights: items.map((i) => i.height), total: y - GAP + PAD, maxWidth }
  }, [pages, rotation, mode, view])

  const current = layout ? currentPageIndex(layout.tops, layout.heights, scrollTop, view.height + 2 * PAD) : 0
  const visible = useMemo(
    () => (layout ? pagesToRender(layout.tops, layout.heights, scrollTop, view.height + 2 * PAD) : new Set<number>()),
    [layout, scrollTop, view.height]
  )
  const percent = layout ? scaleToPercent(layout.items[current]?.scale ?? 0) : null

  // Keep the reading position when zoom/rotation changes the content height
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !layout) return
    el.scrollTop = scrollRatio.current * layout.total
    setScrollTop(el.scrollTop)
  }, [layout])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
    scrollRatio.current = el.scrollHeight > 0 ? el.scrollTop / el.scrollHeight : 0
  }, [])

  const goToPage = useCallback(
    (index: number) => {
      const el = scrollRef.current
      if (!el || !layout) return
      const i = Math.max(0, Math.min(layout.tops.length - 1, index))
      el.scrollTo({ top: layout.tops[i] - PAD })
    },
    [layout]
  )

  const stepZoom = useCallback(
    (direction: 1 | -1) => {
      if (percent === null) return
      const next = direction > 0 ? zoomIn(percent) : zoomOut(percent)
      if (next !== null) setMode({ kind: "percent", value: next })
    },
    [percent]
  )

  // Ctrl + mouse wheel zooms only the preview (not the browser page)
  const stepZoomRef = useRef(stepZoom)
  stepZoomRef.current = stepZoom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let last = 0
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const now = Date.now()
      if (now - last < 120 || e.deltaY === 0) return // trackpads fire many small events
      last = now
      stepZoomRef.current(e.deltaY < 0 ? 1 : -1)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const file = useMemo(() => blob, [blob])

  const onLoadSuccess = useCallback(async (pdf: pdfjs.PDFDocumentProxy) => {
    // Read all page sizes up front (cheap, no drawing) → size-correct placeholders
    const infos: PageInfo[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const vp = page.getViewport({ scale: 1 })
      infos.push({ width: vp.width, height: vp.height, intrinsic: page.rotate })
    }
    setPages(infos)
  }, [])

  const onLoadError = useCallback(
    (err: Error) => onError(err?.name === "PasswordException" ? "password" : "damaged"),
    [onError]
  )

  const loaded = layout !== null
  const zoomInTarget = percent !== null ? zoomIn(percent) : null
  const zoomOutTarget = percent !== null ? zoomOut(percent) : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PreviewToolbar
        page={loaded ? { current: current + 1, total: layout.items.length } : null}
        onPrevPage={() => goToPage(current - 1)}
        onNextPage={() => goToPage(current + 1)}
        zoomPercent={percent}
        mode={mode}
        onZoomIn={loaded && zoomInTarget !== null ? () => stepZoom(1) : undefined}
        onZoomOut={loaded && zoomOutTarget !== null ? () => stepZoom(-1) : undefined}
        onFitWidth={loaded ? () => setMode({ kind: "fit-width" }) : undefined}
        onFitPage={loaded ? () => setMode({ kind: "fit-page" }) : undefined}
        onRotate={loaded ? (d) => setRotation((r) => rotate(r, d)) : undefined}
        newTabUrl={newTabUrl}
      />
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative min-h-0 flex-1 overflow-auto bg-muted/40 [scrollbar-gutter:stable]"
        data-testid="preview-scroll"
      >
        <Document
          file={file}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          onPassword={() => onError("password")}
          loading={<PageSkeleton />}
          error={null}
          noData={null}
          suspense={false}
        >
          {layout ? (
            // Dynamic sizes need inline styles; wider than the column when zoomed in → horizontal scroll
            <div className="relative" style={{ height: layout.total, width: `max(100%, ${layout.maxWidth + 2 * PAD}px)` }}>
              {layout.items.map((item, i) => (
                <div
                  key={i}
                  data-testid="preview-page"
                  data-page={i + 1}
                  aria-label={`Seite ${i + 1}`}
                  className="absolute left-0 right-0 mx-auto bg-white shadow-sm ring-1 ring-border"
                  style={{ top: layout.tops[i], width: item.width, height: item.height }}
                >
                  {visible.has(i) && pages && (
                    <Page
                      pageNumber={i + 1}
                      scale={item.scale}
                      rotate={(pages[i].intrinsic + rotation) % 360}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<Skeleton className="h-full w-full rounded-none" />}
                      error={null}
                      suspense={false}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <PageSkeleton />
          )}
        </Document>
      </div>
    </div>
  )
}
