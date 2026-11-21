import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { InboxResponse } from "@/lib/inbox-types"
import { NEW_MARK_MS, REFRESH_INTERVAL_MS, useInbox } from "./use-inbox"

const ok = (...names: string[]): InboxResponse => ({
  folder: "C:\\Eingang",
  status: "ok",
  checkedAt: new Date().toISOString(),
  files: names.map((name) => ({ name, size: 1, modifiedAt: "2026-11-01T10:00:00.000Z" })),
})
const unreachable = (): InboxResponse => ({
  folder: "C:\\Eingang",
  status: "unreachable",
  checkedAt: new Date().toISOString(),
  files: [],
})

const fetchMock = vi.fn()
let visibility: DocumentVisibilityState = "visible"

function respond(body: InboxResponse) {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => body } as Response)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("fetch", fetchMock)
  visibility = "visible"
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  fetchMock.mockReset()
})

async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe("useInbox", () => {
  it("uses the server-rendered list without an initial request", () => {
    const { result } = renderHook(() => useInbox(ok("a.pdf")))
    expect(result.current.inbox?.files).toHaveLength(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("loads in the browser when no initial list was given", async () => {
    respond(ok("a.pdf"))
    const { result } = renderHook(() => useInbox(null))
    await tick(0)
    expect(result.current.inbox?.files.map((f) => f.name)).toEqual(["a.pdf"])
  })

  it("refreshes every 30 s while the tab is visible", async () => {
    renderHook(() => useInbox(ok("a.pdf")))
    respond(ok("a.pdf"))
    await tick(REFRESH_INTERVAL_MS)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("does not refresh while the tab is hidden and refreshes on return", async () => {
    renderHook(() => useInbox(ok("a.pdf")))
    visibility = "hidden"
    await tick(REFRESH_INTERVAL_MS * 2)
    expect(fetchMock).not.toHaveBeenCalled()

    visibility = "visible"
    respond(ok("a.pdf"))
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"))
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("marks scans that appear after the first load as new – until cleared or 60 s", async () => {
    const { result } = renderHook(() => useInbox(ok("a.pdf")))
    respond(ok("a.pdf", "b.pdf", "c.pdf"))
    await act(async () => {
      result.current.refresh()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect([...result.current.newNames].sort()).toEqual(["b.pdf", "c.pdf"])

    act(() => result.current.clearNew("b.pdf"))
    expect([...result.current.newNames]).toEqual(["c.pdf"])

    await tick(NEW_MARK_MS)
    expect(result.current.newNames.size).toBe(0)
  })

  it("keeps the last list and marks it stale when the folder becomes unreachable", async () => {
    const { result } = renderHook(() => useInbox(ok("a.pdf")))
    const firstGood = result.current.lastGoodAt
    respond(unreachable())
    await act(async () => {
      result.current.refresh()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.stale).toBe(true)
    expect(result.current.staleStatus).toBe("unreachable")
    expect(result.current.inbox?.files.map((f) => f.name)).toEqual(["a.pdf"])
    expect(result.current.lastGoodAt).toBe(firstGood)

    respond(ok("a.pdf", "b.pdf"))
    await act(async () => {
      result.current.refresh()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.stale).toBe(false)
    expect(result.current.inbox?.files).toHaveLength(2)
  })

  it("keeps the last list when the server does not answer", async () => {
    const { result } = renderHook(() => useInbox(ok("a.pdf")))
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await act(async () => {
      result.current.refresh()
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.stale).toBe(true)
    expect(result.current.staleStatus).toBeNull()
    expect(result.current.failed).toBe(false)
    expect(result.current.inbox?.files).toHaveLength(1)
  })

  it("reports failed if nothing could ever be loaded", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    const { result } = renderHook(() => useInbox(null))
    await tick(0)
    expect(result.current.failed).toBe(true)
  })

  it("does not start a second request while one is running", async () => {
    let release!: (r: Response) => void
    fetchMock.mockReturnValueOnce(new Promise<Response>((r) => (release = r)))
    const { result } = renderHook(() => useInbox(ok("a.pdf")))
    act(() => {
      result.current.refresh()
      result.current.refresh()
    })
    expect(result.current.refreshing).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => {
      release({ ok: true, json: async () => ok("a.pdf") } as Response)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.refreshing).toBe(false)
  })
})
