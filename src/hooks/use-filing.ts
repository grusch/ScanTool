"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { FILING_MESSAGES, fileScan, UNDO_MESSAGES, undoFiling } from "@/lib/filing-api"
import type { FilingRequest, FilingTarget } from "@/lib/filing-types"

/** How long the "Abgelegt …" message with "Rückgängig" stays (PROJ-5) */
export const UNDO_TOAST_MS = 8000

interface UseFilingOptions {
  /** Reloads the inbox list (PROJ-2); resolves when the new list is there */
  refresh: () => Promise<void> | void
  /** Called after a successful undo with the scan's name in the inbox (to select it again) */
  onRestored: (name: string) => void
}

/**
 * Files the selected scan via POST /api/filing, shows the result with "Rückgängig"
 * and refreshes the list so the next scan gets selected. Only one filing at a time.
 */
export function useFiling({ refresh, onRestored }: UseFilingOptions) {
  const [busy, setBusy] = useState<FilingTarget | null>(null)
  const busyRef = useRef(false)
  // Scans whose copy is in the archive but whose original could not be deleted
  const [alreadyCopied, setAlreadyCopied] = useState<ReadonlySet<string>>(new Set())

  const undo = useCallback(
    async (token: string) => {
      const res = await undoFiling(token)
      if (!res.ok) {
        toast.error(UNDO_MESSAGES[res.code])
        return
      }
      await refresh()
      onRestored(res.name)
      toast.success(
        res.renamed ? `Zurück im Eingang als ${res.name} (Name war inzwischen belegt)` : `Zurück im Eingang: ${res.name}`
      )
    },
    [refresh, onRestored]
  )

  const file = useCallback(
    async (request: FilingRequest) => {
      if (busyRef.current) return // no double filing (fast clicks / repeated shortcut)
      busyRef.current = true
      setBusy(request.target)
      try {
        const res = await fileScan(request)
        if (!res.ok) {
          toast.error(FILING_MESSAGES[res.code])
          if (res.code === "not_found") await refresh()
          return
        }
        if (res.status === "copied_not_deleted") {
          setAlreadyCopied((s) => new Set(s).add(request.scan))
          toast.warning(`Abgelegt als ${res.location}, aber das Original konnte nicht aus dem Eingang gelöscht werden.`, {
            duration: UNDO_TOAST_MS,
          })
          return
        }
        setAlreadyCopied((s) => {
          if (!s.has(request.scan)) return s
          const next = new Set(s)
          next.delete(request.scan)
          return next
        })
        await refresh()
        const text =
          res.status === "already_filed"
            ? `War bereits abgelegt – Eingang bereinigt (${res.location})`
            : `Abgelegt: ${res.location}${res.renamed ? " (Name war schon vergeben)" : ""}`
        const token = res.undoToken
        toast.success(text, {
          duration: UNDO_TOAST_MS,
          action: token ? { label: "Rückgängig", onClick: () => void undo(token) } : undefined,
        })
      } finally {
        busyRef.current = false
        setBusy(null)
      }
    },
    [refresh, undo]
  )

  return { file, busy, alreadyCopied }
}
