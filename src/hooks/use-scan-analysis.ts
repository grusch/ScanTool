"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { analyzeScan } from "@/lib/analysis-api"
import type { AnalysisErrorCode, AnalysisResult } from "@/lib/analysis-types"
import type { InboxFile } from "@/lib/inbox-types"

export type ScanAnalysisState =
  | { status: "idle" }
  | { status: "loading"; previous: AnalysisResult | null }
  | { status: "done"; result: AnalysisResult }
  | { status: "error"; error: AnalysisErrorCode; previous: AnalysisResult | null }

/** Same name + size + modification time = same file (a replaced file gets a new key) */
export function scanKey(file: InboxFile): string {
  return `${file.name}\n${file.size}\n${file.modifiedAt}`
}

/**
 * Analysis of the selected scan (PROJ-4). Starts automatically on selection, keeps results
 * per file for the session (no flicker when switching back) and offers "Neu analysieren".
 * Switching away only stops waiting in the browser – the server finishes and remembers.
 */
export function useScanAnalysis(file: InboxFile | null, apiKeyPresent: boolean) {
  const key = file ? scanKey(file) : ""
  const name = file?.name ?? null
  const cache = useRef(new Map<string, AnalysisResult>())
  const [state, setState] = useState<{ key: string; value: ScanAnalysisState }>({ key: "", value: { status: "idle" } })
  // Bumped by "Neu analysieren" / "Erneut versuchen"
  const [request, setRequest] = useState<{ key: string; force: boolean; n: number }>({ key: "", force: false, n: 0 })

  useEffect(() => {
    if (!name || !key) return
    if (!apiKeyPresent) {
      setState({ key, value: { status: "error", error: "missing_key", previous: null } })
      return
    }
    const force = request.key === key && request.force
    const cached = cache.current.get(key)
    if (cached && !force) {
      setState({ key, value: { status: "done", result: cached } })
      return
    }

    const controller = new AbortController()
    setState({ key, value: { status: "loading", previous: cached ?? null } })
    analyzeScan(name, force, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return
        if (res.ok) {
          const { ok: _ok, cached: _cached, ...result } = res
          cache.current.set(key, result)
          setState({ key, value: { status: "done", result } })
        } else {
          setState({ key, value: { status: "error", error: res.code, previous: cached ?? null } })
        }
      })
      .catch(() => {
        // aborted: selection changed – the server keeps the result for later
      })
    return () => controller.abort()
  }, [name, key, apiKeyPresent, request])

  const reanalyze = useCallback(() => setRequest((r) => ({ key, force: true, n: r.n + 1 })), [key])
  const retry = useCallback(() => setRequest((r) => ({ key, force: false, n: r.n + 1 })), [key])

  const value: ScanAnalysisState =
    !key ? { status: "idle" } : state.key === key ? state.value : { status: "loading", previous: cache.current.get(key) ?? null }
  return { state: value, reanalyze, retry }
}
