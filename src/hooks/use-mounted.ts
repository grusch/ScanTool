"use client"

import { useSyncExternalStore } from "react"

const noop = () => () => {}

/**
 * false on the server and while React takes over the server HTML (hydration), true afterwards.
 * Lets components render the same HTML as the server first – no hydration mismatch – and
 * avoids lost input: fields stay disabled until they really work.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}
