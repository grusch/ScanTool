"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { ExternalLink, FileSearch, FileWarning, Lock, RefreshCw, WifiOff, FileX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PreviewToolbar } from "@/components/preview/preview-toolbar"
import { useScanFile } from "@/hooks/use-scan-file"
import { SCAN_ERROR_MESSAGES, scanFileUrl, type ScanLoadError } from "@/lib/preview-api"

function LoadingPage() {
  return (
    <div className="flex h-full items-start justify-center p-4" role="status" aria-label="Scan wird geladen">
      <Skeleton className="aspect-[1/1.414] w-full max-w-[560px]" />
    </div>
  )
}

// PDF.js needs browser APIs → load the viewer only in the browser
const PdfViewer = dynamic(() => import("@/components/preview/pdf-viewer").then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => <LoadingPage />,
})

interface PdfPreviewProps {
  /** Selected scan (file name) or null */
  selected: string | null
  /** Called when the scan is no longer in the inbox → list refresh, selection moves on (PROJ-2 rules) */
  onScanMissing: () => void
}

const ERROR_ICONS: Record<ScanLoadError, typeof FileWarning> = {
  not_found: FileX,
  unreachable: WifiOff,
  damaged: FileWarning,
  password: Lock,
  no_access: Lock,
  unknown: WifiOff,
}

function ErrorState({ error, url, onRetry }: { error: ScanLoadError; url: string; onRetry: () => void }) {
  const Icon = ERROR_ICONS[error]
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="max-w-sm text-sm">{SCAN_ERROR_MESSAGES[error]}</p>
      {error === "damaged" && (
        <Button asChild variant="outline" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            In neuem Tab öffnen
          </a>
        </Button>
      )}
      {(error === "unreachable" || error === "unknown" || error === "no_access") && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Erneut versuchen
        </Button>
      )}
    </div>
  )
}

/** Middle column of the work area: preview of the selected scan (PROJ-3) */
export function PdfPreview({ selected, onScanMissing }: PdfPreviewProps) {
  const [reloadKey, setReloadKey] = useState(0)
  const file = useScanFile(selected, reloadKey)
  // Errors detected while reading the PDF (damaged, password), per scan
  const [docError, setDocError] = useState<{ name: string; error: ScanLoadError } | null>(null)

  const onDocError = useCallback(
    (e: ScanLoadError) => {
      if (selected) setDocError({ name: selected, error: e })
    },
    [selected]
  )

  const fetchError = file.status === "error" ? file.error : null
  const error = fetchError ?? (docError && docError.name === selected ? docError.error : null)

  // Scan vanished → refresh the list right away instead of waiting for the 30-s interval
  useEffect(() => {
    if (fetchError === "not_found") onScanMissing()
  }, [fetchError, selected, onScanMissing])

  if (!selected) {
    return (
      <Card className="flex h-[70dvh] min-h-48 flex-col items-center justify-center gap-2 border-dashed p-6 text-center lg:h-full">
        <FileSearch className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">Kein Scan ausgewählt</p>
      </Card>
    )
  }

  const url = scanFileUrl(selected)
  return (
    <Card className="flex h-[70dvh] min-h-0 flex-col overflow-hidden lg:h-full" aria-label={`Vorschau: ${selected}`}>
      {error ? (
        <>
          <PreviewToolbar page={null} zoomPercent={null} newTabUrl={url} />
          <ErrorState
            error={error}
            url={url}
            onRetry={() => {
              setDocError(null)
              setReloadKey((k) => k + 1)
            }}
          />
        </>
      ) : file.status === "loaded" ? (
        <PdfViewer
          key={`${reloadKey}\n${selected}`}
          blob={file.blob}
          newTabUrl={url}
          onError={onDocError}
        />
      ) : (
        <>
          <PreviewToolbar page={null} zoomPercent={null} newTabUrl={url} />
          <LoadingPage />
        </>
      )}
    </Card>
  )
}
