"use client"

import { useEffect, useState } from "react"
import { fetchScan, type ScanLoadError } from "@/lib/preview-api"

export type ScanFileState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; blob: Blob }
  | { status: "error"; error: ScanLoadError }

/**
 * Loads the selected scan. A change of `name` aborts the running request, so after
 * fast ↑/↓ switching only the last selected scan is shown. `reloadKey` forces a new
 * attempt ("Erneut versuchen"). The same name keeps the loaded file (no reload).
 */
export function useScanFile(name: string | null, reloadKey = 0): ScanFileState {
  const [state, setState] = useState<{ key: string; value: ScanFileState }>({
    key: "",
    value: { status: "idle" },
  })
  const key = name === null ? "" : `${reloadKey}\n${name}`

  useEffect(() => {
    if (name === null) return
    const controller = new AbortController()
    fetchScan(name, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setState({
          key,
          value: result.ok ? { status: "loaded", blob: result.blob } : { status: "error", error: result.error },
        })
      })
      .catch(() => {
        // aborted because the selection changed – the newer request takes over
      })
    return () => controller.abort()
  }, [name, key])

  if (name === null) return { status: "idle" }
  // Result belongs to an older selection → still loading the current one
  return state.key === key ? state.value : { status: "loading" }
}
