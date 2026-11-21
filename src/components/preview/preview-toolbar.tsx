"use client"

import type { ReactNode } from "react"
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ZoomMode } from "@/lib/preview-view"
import { cn } from "@/lib/utils"

export interface PreviewToolbarProps {
  /** Current page (1-based) and page count – null while nothing is shown */
  page: { current: number; total: number } | null
  onPrevPage?: () => void
  onNextPage?: () => void
  /** Effective zoom in percent – null while nothing is shown */
  zoomPercent: number | null
  mode?: ZoomMode
  /** undefined = button disabled (limit reached or nothing shown) */
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitWidth?: () => void
  onFitPage?: () => void
  onRotate?: (delta: -90 | 90 | 180) => void
  /** Address for "In neuem Tab öffnen" – null = no scan selected */
  newTabUrl: string | null
}

function ToolButton({
  label,
  onClick,
  pressed,
  children,
  className,
}: {
  label: string
  onClick?: () => void
  pressed?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span keeps the tooltip working on disabled buttons */}
        <span className="inline-flex">
          <Button
            type="button"
            variant={pressed ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 px-2", className)}
            aria-label={label}
            aria-pressed={pressed}
            disabled={!onClick}
            onClick={onClick}
          >
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Toolbar above the preview: page · zoom · rotate · open in new tab */
export function PreviewToolbar(props: PreviewToolbarProps) {
  const { page, zoomPercent, mode, newTabUrl } = props
  const isFirst = !page || page.current <= 1
  const isLast = !page || page.current >= page.total

  return (
    <div
      role="toolbar"
      aria-label="Vorschau-Werkzeuge"
      className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b px-2 py-1.5"
    >
      {/* Page */}
      <div className="flex items-center">
        <ToolButton label="Vorherige Seite" onClick={isFirst ? undefined : props.onPrevPage}>
          <ChevronLeft className="h-4 w-4" />
        </ToolButton>
        <span className="min-w-24 text-center text-sm tabular-nums" aria-live="polite">
          {page ? `Seite ${page.current} von ${page.total}` : "Seite – von –"}
        </span>
        <ToolButton label="Nächste Seite" onClick={isLast ? undefined : props.onNextPage}>
          <ChevronRight className="h-4 w-4" />
        </ToolButton>
      </div>

      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      {/* Zoom */}
      <div className="flex items-center">
        <ToolButton label="Verkleinern" onClick={props.onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </ToolButton>
        <span className="min-w-12 text-center text-sm tabular-nums" aria-label="Zoom">
          {zoomPercent === null ? "–" : `${zoomPercent} %`}
        </span>
        <ToolButton label="Vergrössern" onClick={props.onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Breite anpassen" onClick={props.onFitWidth} pressed={mode?.kind === "fit-width"}>
          <ArrowLeftRight className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Ganze Seite" onClick={props.onFitPage} pressed={mode?.kind === "fit-page"}>
          <Maximize className="h-4 w-4" />
        </ToolButton>
      </div>

      <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

      {/* Rotate (view only) */}
      <div className="flex items-center">
        <ToolButton label="90° links drehen" onClick={props.onRotate && (() => props.onRotate?.(-90))}>
          <RotateCcw className="h-4 w-4" />
          <span className="text-xs">90°</span>
        </ToolButton>
        <ToolButton label="90° rechts drehen" onClick={props.onRotate && (() => props.onRotate?.(90))}>
          <RotateCw className="h-4 w-4" />
          <span className="text-xs">90°</span>
        </ToolButton>
        <ToolButton label="180° drehen" onClick={props.onRotate && (() => props.onRotate?.(180))}>
          <span className="text-xs font-medium">180°</span>
        </ToolButton>
      </div>

      <div className="ml-auto flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            {newTabUrl ? (
              <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                <a href={newTabUrl} target="_blank" rel="noopener noreferrer" aria-label="In neuem Tab öffnen">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <span className="inline-flex">
                <Button variant="ghost" size="sm" className="h-8 px-2" disabled aria-label="In neuem Tab öffnen">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent>In neuem Tab öffnen</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
