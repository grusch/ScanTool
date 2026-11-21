// @vitest-environment node
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { resetInboxObservations } from "@/lib/server/inbox"
import { writeSettings } from "@/lib/server/settings-store"
import { GET } from "./route"

function req(headers: Record<string, string> = {}) {
  return new Request("http://127.0.0.1:3000/api/inbox", {
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", ...headers },
  })
}

async function list() {
  const res = await GET(req())
  expect(res.status).toBe(200)
  return res.json()
}

let tmp: string
let inbox: string
let archive: string

/** Creates a file and sets its modification time to `minutesAgo` minutes in the past */
async function scan(name: string, minutesAgo: number, content = "pdf") {
  const p = path.join(inbox, name)
  await fs.writeFile(p, content)
  const t = new Date(Date.now() - minutesAgo * 60_000)
  await fs.utimes(p, t, t)
}

beforeEach(async () => {
  resetInboxObservations()
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "scantool-inbox-"))
  inbox = path.join(tmp, "Eingang")
  archive = path.join(tmp, "Ablage")
  await fs.mkdir(inbox)
  await fs.mkdir(archive)
  process.env.SCANTOOL_DATA_DIR = path.join(tmp, "data")
  await writeSettings({ inboxPath: inbox, archivePath: archive })
})

afterEach(async () => {
  vi.useRealTimers()
  delete process.env.SCANTOOL_DATA_DIR
  await fs.rm(tmp, { recursive: true, force: true })
})

describe("GET /api/inbox", () => {
  it("lists PDFs oldest first with name, size and scan date", async () => {
    await scan("b.pdf", 10, "12345")
    await scan("a.pdf", 60)
    await scan("c.PDF", 5)
    const body = await list()
    expect(body.status).toBe("ok")
    expect(body.folder).toBe(inbox)
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["a.pdf", "b.pdf", "c.PDF"])
    expect(body.files[1].size).toBe(5)
    expect(new Date(body.files[0].modifiedAt).getTime()).toBeLessThan(Date.now() - 59 * 60_000)
  })

  it("reports the earlier of creation and modification time as fileDate (PROJ-4 date fallback)", async () => {
    await scan("a.pdf", 60)
    const body = await list()
    const file = body.files[0]
    expect(typeof file.fileDate).toBe("string")
    expect(new Date(file.fileDate).getTime()).toBeLessThanOrEqual(new Date(file.modifiedAt).getTime())
  })

  it("ignores subfolders, other file types, hidden and temporary files", async () => {
    await scan("ok.pdf", 10)
    await scan("bild.jpg", 10)
    await scan("notiz.txt", 10)
    await scan("~$lock.pdf", 10)
    await scan(".hidden.pdf", 10)
    await scan("upload.pdf.part", 10)
    await fs.mkdir(path.join(inbox, "Unterordner.pdf"))
    const body = await list()
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["ok.pdf"])
  })

  it("sorts files with the same timestamp by name (stable order)", async () => {
    const t = new Date(Date.now() - 600_000)
    for (const n of ["z.pdf", "m.pdf", "a.pdf"]) {
      await fs.writeFile(path.join(inbox, n), "x")
      await fs.utimes(path.join(inbox, n), t, t)
    }
    const body = await list()
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["a.pdf", "m.pdf", "z.pdf"])
  })

  it("returns an empty list for an empty inbox", async () => {
    expect((await list()).files).toEqual([])
  })

  it("hides a file that is still being written (changed < 5 s ago)", async () => {
    await scan("fertig.pdf", 10)
    await fs.writeFile(path.join(inbox, "laeuft.pdf"), "partial")
    const body = await list()
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["fertig.pdf"])
  })

  it("shows a file once it has been unchanged for 5 s", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    const p = path.join(inbox, "neu.pdf")
    await fs.writeFile(p, "x")
    const t = new Date(Date.now() - 2_000)
    await fs.utimes(p, t, t)
    expect((await list()).files).toHaveLength(0)
    vi.setSystemTime(Date.now() + 4_000)
    expect((await list()).files.map((f: { name: string }) => f.name)).toEqual(["neu.pdf"])
  })

  it("shows a file with a future timestamp (skewed NAS clock) after a second unchanged observation", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    const p = path.join(inbox, "zukunft.pdf")
    await fs.writeFile(p, "x")
    const future = new Date(Date.now() + 3_600_000)
    await fs.utimes(p, future, future)
    expect((await list()).files).toHaveLength(0)
    vi.setSystemTime(Date.now() + 6_000)
    expect((await list()).files.map((f: { name: string }) => f.name)).toEqual(["zukunft.pdf"])
  })

  it("keeps hiding a file that keeps growing", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    const p = path.join(inbox, "gross.pdf")
    const future = () => new Date(Date.now() + 3_600_000)
    await fs.writeFile(p, "a")
    await fs.utimes(p, future(), future())
    expect((await list()).files).toHaveLength(0)
    vi.setSystemTime(Date.now() + 6_000)
    await fs.appendFile(p, "more")
    await fs.utimes(p, future(), future())
    expect((await list()).files).toHaveLength(0)
  })

  it("reports not_found (HTTP 200) when the inbox folder was deleted", async () => {
    await fs.rm(inbox, { recursive: true })
    const body = await list()
    expect(body).toMatchObject({ status: "not_found", files: [] })
  })

  it("reports not_found when nothing is configured", async () => {
    await fs.rm(path.join(tmp, "data"), { recursive: true })
    expect(await list()).toMatchObject({ status: "not_found", folder: "", files: [] })
  })

  it("reports an unreachable network inbox within seconds", async () => {
    await writeSettings({ inboxPath: "\\\\192.0.2.1\\share\\Scans", archivePath: archive })
    const start = Date.now()
    expect(await list()).toMatchObject({ status: "unreachable", files: [] })
    expect(Date.now() - start).toBeLessThan(5_000)
  })

  it("only lists the configured folder – query parameters are ignored", async () => {
    await scan("eingang.pdf", 10)
    await fs.writeFile(path.join(archive, "geheim.pdf"), "x")
    const res = await GET(
      new Request(`http://127.0.0.1:3000/api/inbox?path=${encodeURIComponent(archive)}`, {
        headers: { host: "127.0.0.1:3000" },
      })
    )
    const body = await res.json()
    expect(body.files.map((f: { name: string }) => f.name)).toEqual(["eingang.pdf"])
  })

  it("rejects requests from other websites", async () => {
    const res = await GET(req({ origin: "https://evil.example" }))
    expect(res.status).toBe(403)
  })
})
