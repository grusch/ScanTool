// @vitest-environment node
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { GET, PUT } from "./route"
import { POST as CHECK } from "./check-folder/route"
import { POST as CREATE } from "./create-folder/route"

const ORIGIN = "http://127.0.0.1:3000"

function req(url: string, method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${url}`, {
    method,
    headers: { host: "127.0.0.1:3000", origin: ORIGIN, "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  })
}

let tmp: string
let inbox: string
let archive: string

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "scantool-"))
  inbox = path.join(tmp, "Eingang")
  archive = path.join(tmp, "Ablage")
  await fs.mkdir(inbox)
  await fs.mkdir(archive)
  await fs.writeFile(path.join(inbox, "a.pdf"), "x")
  await fs.writeFile(path.join(inbox, "B.PDF"), "x")
  await fs.writeFile(path.join(inbox, "note.txt"), "x")
  process.env.SCANTOOL_DATA_DIR = path.join(tmp, "data")
  delete process.env.ANTHROPIC_API_KEY
})

afterEach(async () => {
  delete process.env.SCANTOOL_DATA_DIR
  await fs.rm(tmp, { recursive: true, force: true })
})

describe("GET /api/settings", () => {
  it("returns empty status on first start", async () => {
    const res = await GET(req("/api/settings", "GET"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ settings: null, inbox: null, archive: null, apiKeyPresent: false })
  })

  it("reports API key presence without exposing it", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-secret"
    const res = await GET(req("/api/settings", "GET"))
    const text = await res.text()
    expect(JSON.parse(text).apiKeyPresent).toBe(true)
    expect(text).not.toContain("sk-ant-secret")
  })

  it("re-checks saved folders and reports missing ones", async () => {
    await PUT(req("/api/settings", "PUT", { inboxPath: inbox, archivePath: archive }))
    await fs.rm(archive, { recursive: true })
    const body = await (await GET(req("/api/settings", "GET"))).json()
    expect(body.settings.inboxPath).toBe(inbox)
    expect(body.inbox).toMatchObject({ status: "ok", pdfCount: 2 })
    expect(body.archive).toMatchObject({ status: "not_found", path: archive })
  })
})

describe("PUT /api/settings", () => {
  it("saves valid paths (cleaned) and persists them", async () => {
    const res = await PUT(req("/api/settings", "PUT", { inboxPath: `"${inbox}\\"`, archivePath: ` ${archive} ` }))
    expect(res.status).toBe(200)
    const saved = await res.json()
    expect(saved).toMatchObject({ inboxPath: inbox, archivePath: archive })
    const file = JSON.parse(await fs.readFile(path.join(tmp, "data", "settings.json"), "utf8"))
    expect(file.inboxPath).toBe(inbox)
  })

  it("rejects empty fields", async () => {
    const res = await PUT(req("/api/settings", "PUT", { inboxPath: "", archivePath: archive }))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "validation", field: "inboxPath" })
  })

  it("rejects malformed JSON", async () => {
    const res = await PUT(req("/api/settings", "PUT", "{nope"))
    expect(res.status).toBe(400)
  })

  it("rejects identical folders (case-insensitive)", async () => {
    const res = await PUT(req("/api/settings", "PUT", { inboxPath: inbox, archivePath: inbox.toUpperCase() }))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "same_folder", field: "archivePath" })
  })

  it("rejects nested folders", async () => {
    const nested = path.join(archive, "Eingang")
    await fs.mkdir(nested)
    const res = await PUT(req("/api/settings", "PUT", { inboxPath: nested, archivePath: archive }))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "nested" })
  })

  it("rejects a missing folder", async () => {
    const res = await PUT(req("/api/settings", "PUT", { inboxPath: inbox, archivePath: path.join(tmp, "nope") }))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "invalid_folder", field: "archivePath" })
  })

  it("rejects a file instead of a folder", async () => {
    const res = await PUT(
      req("/api/settings", "PUT", { inboxPath: path.join(inbox, "a.pdf"), archivePath: archive })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "invalid_folder", field: "inboxPath" })
  })
})

describe("POST /api/settings/check-folder", () => {
  it("counts PDFs in the inbox", async () => {
    const res = await CHECK(req("/api/settings/check-folder", "POST", { path: inbox, kind: "inbox" }))
    expect(await res.json()).toEqual({ status: "ok", path: inbox, pdfCount: 2 })
  })

  it("reports not_found and not_a_directory", async () => {
    const missing = await CHECK(req("/x", "POST", { path: path.join(tmp, "nope"), kind: "archive" }))
    expect((await missing.json()).status).toBe("not_found")
    const file = await CHECK(req("/x", "POST", { path: path.join(inbox, "a.pdf"), kind: "archive" }))
    expect((await file.json()).status).toBe("not_a_directory")
  })

  it("reports an unreachable network path quickly (BUG-1)", async () => {
    const start = Date.now()
    const res = await CHECK(req("/x", "POST", { path: "\\\\192.0.2.1\\share\\Scans", kind: "inbox" }))
    expect(await res.json()).toEqual({ status: "unreachable", path: "\\\\192.0.2.1\\share\\Scans" })
    expect(Date.now() - start).toBeLessThan(5000)
  })

  it("does not try to create folders on an unreachable share (BUG-1)", async () => {
    const res = await CREATE(req("/x", "POST", { path: "\\\\192.0.2.1\\share\\Neu", kind: "inbox" }))
    expect((await res.json()).status).toBe("unreachable")
  })

  it("validates input", async () => {
    expect((await CHECK(req("/x", "POST", { path: "relative\\dir", kind: "inbox" }))).status).toBe(400)
    expect((await CHECK(req("/x", "POST", { path: inbox, kind: "other" }))).status).toBe(400)
  })
})

describe("POST /api/settings/create-folder", () => {
  it("creates a folder including parents", async () => {
    const target = path.join(tmp, "neu", "Eingang")
    const res = await CREATE(req("/x", "POST", { path: target, kind: "inbox" }))
    expect(await res.json()).toEqual({ status: "ok", path: target, pdfCount: 0 })
    expect((await fs.stat(target)).isDirectory()).toBe(true)
  })
})

describe("local request guard", () => {
  it("rejects requests from other websites", async () => {
    const res = await GET(req("/api/settings", "GET", undefined, { origin: "https://evil.example" }))
    expect(res.status).toBe(403)
  })

  it("rejects a foreign Host header (DNS rebinding)", async () => {
    const res = await PUT(
      req("/api/settings", "PUT", { inboxPath: inbox, archivePath: archive }, { host: "evil.example:3000" })
    )
    expect(res.status).toBe(403)
  })

  it("rejects cross-site fetch metadata", async () => {
    const res = await CREATE(
      req("/x", "POST", { path: path.join(tmp, "x"), kind: "inbox" }, { "sec-fetch-site": "cross-site" })
    )
    expect(res.status).toBe(403)
    await expect(fs.stat(path.join(tmp, "x"))).rejects.toThrow()
  })

  it("allows localhost without Origin (non-browser clients)", async () => {
    const res = await GET(
      new Request("http://localhost:3000/api/settings", { headers: { host: "localhost:3000" } })
    )
    expect(res.status).toBe(200)
  })
})
