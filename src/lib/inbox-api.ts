// Browser-side client for GET /api/inbox (PROJ-2).
import type { InboxResponse } from "./inbox-types"

export async function fetchInbox(signal?: AbortSignal): Promise<InboxResponse> {
  const res = await fetch("/api/inbox", { cache: "no-store", signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as InboxResponse
}
