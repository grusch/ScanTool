"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { fetchInbox } from "@/lib/inbox-api"
import type { InboxResponse } from "@/lib/inbox-types"

export const REFRESH_INTERVAL_MS = 30_000
export const NEW_MARK_MS = 60_000

export interface InboxState {
  /** Last successfully loaded list (kept while the folder is unreachable) */
  inbox: InboxResponse | null
  /** Time of the last successful load (ISO) */
  lastGoodAt: string | null
  /** Latest load failed or folder not reachable → show last state greyed out */
  stale: boolean
  /** Status reported for the stale state (e.g. "unreachable"), null if the server failed */
  staleStatus: InboxResponse["status"] | null
  /** Initial load failed and nothing to show */
  failed: boolean
  /** A refresh is running */
  refreshing: boolean
  /** Names of scans that appeared after the first load (cleared on select / after 60 s) */
  newNames: ReadonlySet<string>
  refresh: () => Promise<void>
  clearNew: (name: string) => void
}

/**
 * Loads the inbox list, refreshes it every 30 s while the tab is visible and
 * immediately when the tab becomes visible again.
 */
export function useInbox(initial: InboxResponse | null): InboxState {
  const initialOk = initial?.status === "ok"
  const [inbox, setInbox] = useState<InboxResponse | null>(initial)
  const [lastGoodAt, setLastGoodAt] = useState<string | null>(initialOk ? initial!.checkedAt : null)
  const [stale, setStale] = useState(initial !== null && !initialOk)
  const [staleStatus, setStaleStatus] = useState<InboxResponse["status"] | null>(
    initial && !initialOk ? initial.status : null
  )
  const [failed, setFailed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [newNames, setNewNames] = useState<ReadonlySet<string>>(new Set())

  const inFlight = useRef(false)
  const hasData = useRef(initial !== null)
  const known = useRef<Set<string> | null>(initialOk ? new Set(initial!.files.map((f) => f.name)) : null)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const clearNew = useCallback((name: string) => {
    const t = timers.current.get(name)
    if (t) clearTimeout(t)
    timers.current.delete(name)
    setNewNames((prev) => {
      if (!prev.has(name)) return prev
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }, [])

  const markNew = useCallback(
    (names: string[]) => {
      if (names.length === 0) return
      setNewNames((prev) => new Set([...prev, ...names]))
      for (const name of names) {
        timers.current.set(
          name,
          setTimeout(() => clearNew(name), NEW_MARK_MS)
        )
      }
    },
    [clearNew]
  )

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setRefreshing(true)
    try {
      const res = await fetchInbox()
      hasData.current = true
      if (res.status === "ok") {
        const names = res.files.map((f) => f.name)
        // Only scans appearing after the first successful load count as "new"
        if (known.current) markNew(names.filter((n) => !known.current!.has(n)))
        known.current = new Set(names)
        setInbox(res)
        setLastGoodAt(res.checkedAt)
        setStale(false)
        setStaleStatus(null)
      } else {
        // Keep the last good list; show why it is stale
        setInbox((prev) => prev ?? res)
        setStale(true)
        setStaleStatus(res.status)
      }
      setFailed(false)
    } catch {
      setStale(true)
      setStaleStatus(null)
      if (!hasData.current) setFailed(true)
    } finally {
      inFlight.current = false
      setRefreshing(false)
    }
  }, [markNew])

  // Initial load if the page did not deliver a list
  useEffect(() => {
    if (initial === null) load()
  }, [initial, load])

  // Periodic refresh while visible + immediate refresh on return to the tab
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load()
    }, REFRESH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") load()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [load])

  // Clean up "new" timers on unmount
  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
  }, [])

  return { inbox, lastGoodAt, stale, staleStatus, failed, refreshing, newNames, refresh: load, clearNew }
}
