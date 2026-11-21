"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { checkFolder } from "@/lib/settings-api"
import { isAbsoluteWindowsPath } from "@/lib/paths"
import type { FolderCheck, FolderKind } from "@/lib/settings-types"

const DEBOUNCE_MS = 400

export interface FolderCheckState {
  check: FolderCheck | null
  checking: boolean
  /** Request failed (server not reachable etc.) */
  failed: boolean
  /** Immediately re-run the check (e.g. after creating the folder) */
  setCheck: (check: FolderCheck) => void
}

/**
 * Checks a folder path on the local server while the user types.
 * Only absolute Windows paths are sent; others yield `check = null`.
 */
export function useFolderCheck(
  path: string,
  kind: FolderKind,
  initial: FolderCheck | null = null
): FolderCheckState {
  const [check, setCheckState] = useState<FolderCheck | null>(initial)
  const [checking, setChecking] = useState(false)
  const [failed, setFailed] = useState(false)
  const skipFirst = useRef(initial !== null)

  useEffect(() => {
    // The initial value already reflects the saved path – don't re-check on mount.
    if (skipFirst.current) {
      skipFirst.current = false
      return
    }
    if (!isAbsoluteWindowsPath(path)) {
      setCheckState(null)
      setChecking(false)
      setFailed(false)
      return
    }
    const controller = new AbortController()
    setChecking(true)
    const timer = setTimeout(async () => {
      try {
        const result = await checkFolder({ path, kind }, controller.signal)
        setCheckState(result)
        setFailed(false)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setCheckState(null)
          setFailed(true)
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [path, kind])

  const setCheck = useCallback((c: FolderCheck) => {
    setCheckState(c)
    setFailed(false)
  }, [])

  return { check, checking, failed, setCheck }
}
