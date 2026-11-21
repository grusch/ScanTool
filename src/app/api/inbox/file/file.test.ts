// @vitest-environment node
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { writeSettings } from "@/lib/server/settings-store"
import { GET } from "./route"

const PDF = Buffer.from("%PDF-1.4\n% test scan\n%%EOF\n")

function req(name: string | null, headers: Record<string, string> = {}) {
  const q = name === null ? "" : `?name=${encodeURIComponent(name)}`
  return new Request(`http://127.0.0.1:3000/api/inbox/file${q}`, {
    headers: { host: "127.0.0.1:3000", ...headers },
  })
}

let tmp: string
let inbox: string
let archive: string

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "scantool-file-"))
  inbox = path.join(tmp, "Eingang")
  archive = path.join(tmp, "Ablage")
  await fs.mkdir(inbox)
  await fs.mkdir(archive)
  process.env.SCANTOOL_DATA_DIR = path.join(tmp, "data")
  await writeSettings({ inboxPath: inbox, archivePath: archive })
})

afterEach(async () => {
  delete process.env.SCANTOOL_DATA_DIR
  await fs.rm(tmp, { recursive: true, force: true })
})

describe("GET /api/inbox/file", () => {
  it("delivers the PDF unchanged, inline, never cached", async () => {
    await fs.writeFile(path.join(inbox, "scan.pdf"), PDF)
    const res = await GET(req("scan.pdf"))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("application/pdf")
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(res.headers.get("content-disposition")).toMatch(/^inline;/)
    expect(Buffer.from(await res.arrayBuffer()).equals(PDF)).toBe(true)
  })

  it("handles special characters and umlauts in the name", async () => {
    const name = "Rechnung Müller #3 & 50%.PDF"
    await fs.writeFile(path.join(inbox, name), PDF)
    const res = await GET(req(name))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-disposition")).toContain(encodeURIComponent(name))
  })

  it("does not modify the file (read-only)", async () => {
    const p = path.join(inbox, "scan.pdf")
    await fs.writeFile(p, PDF)
    const t = new Date(Date.now() - 3_600_000)
    await fs.utimes(p, t, t)
    await GET(req("scan.pdf"))
    const s = await fs.stat(p)
    expect(Math.round(s.mtimeMs / 1000)).toBe(Math.round(t.getTime() / 1000))
    expect((await fs.readFile(p)).equals(PDF)).toBe(true)
  })

  it("shows the new content of a replaced file with the same name", async () => {
    const p = path.join(inbox, "scan.pdf")
    await fs.writeFile(p, PDF)
    await GET(req("scan.pdf"))
    const v2 = Buffer.from("%PDF-1.4\n% version 2\n%%EOF\n")
    await fs.writeFile(p, v2)
    const res = await GET(req("scan.pdf"))
    expect(Buffer.from(await res.arrayBuffer()).equals(v2)).toBe(true)
  })

  it("returns 404 not_found for a vanished scan", async () => {
    const res = await GET(req("weg.pdf"))
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ code: "not_found" })
  })

  it("returns 404 for a folder named like a PDF", async () => {
    await fs.mkdir(path.join(inbox, "ordner.pdf"))
    expect((await GET(req("ordner.pdf"))).status).toBe(404)
  })

  it.each([
    ["missing name", null],
    ["empty name", ""],
    ["parent folder", "..\\Ablage\\geheim.pdf"],
    ["forward slash", "../Ablage/geheim.pdf"],
    ["absolute path", "C:\\Windows\\win.ini.pdf"],
    ["UNC path", "\\\\server\\share\\x.pdf"],
    ["dots only", "...pdf"],
    ["alternate data stream", "scan.pdf:hidden.pdf"],
    ["other file type", "notiz.txt"],
    ["hidden file", ".versteckt.pdf"],
    ["temporary file", "~$lock.pdf"],
    ["control character", "a\u0000b.pdf"],
  ])("rejects %s with 400 invalid_name", async (_label, name) => {
    const res = await GET(req(name))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "invalid_name" })
  })

  it("never delivers files from the archive folder", async () => {
    await fs.writeFile(path.join(archive, "geheim.pdf"), PDF)
    const res = await GET(req("..\\Ablage\\geheim.pdf"))
    expect(res.status).toBe(400)
  })

  it("returns 404 when nothing is configured", async () => {
    await fs.rm(path.join(tmp, "data"), { recursive: true })
    expect((await GET(req("scan.pdf"))).status).toBe(404)
  })

  it("reports an unreachable network inbox with 503 within seconds", async () => {
    await writeSettings({ inboxPath: "\\\\192.0.2.1\\share\\Scans", archivePath: archive })
    const start = Date.now()
    const res = await GET(req("scan.pdf"))
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ code: "unreachable" })
    expect(Date.now() - start).toBeLessThan(5_000)
  })

  it("rejects requests from other websites", async () => {
    await fs.writeFile(path.join(inbox, "scan.pdf"), PDF)
    expect((await GET(req("scan.pdf", { origin: "https://evil.example" }))).status).toBe(403)
    expect((await GET(req("scan.pdf", { "sec-fetch-site": "cross-site" }))).status).toBe(403)
    expect((await GET(new Request("http://evil.example/api/inbox/file?name=scan.pdf", { headers: { host: "evil.example" } }))).status).toBe(403)
  })

  it("allows opening in a new tab (same-origin navigation without Origin)", async () => {
    await fs.writeFile(path.join(inbox, "scan.pdf"), PDF)
    const res = await GET(req("scan.pdf", { "sec-fetch-site": "same-origin", "sec-fetch-mode": "navigate" }))
    expect(res.status).toBe(200)
  })
})
