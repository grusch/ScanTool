// @vitest-environment node
import { createHash } from "crypto"
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fingerprint, getAnalysis, saveAnalysis } from "@/lib/server/analysis-store"
import { resetUndo, variantName } from "@/lib/server/filing"
import { writeSettings } from "@/lib/server/settings-store"
import type { AnalysisResult } from "@/lib/analysis-types"
import { POST } from "./route"
import { POST as UNDO } from "./undo/route"

function req(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://127.0.0.1:3000${url}`, {
    method: "POST",
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

async function file(body: unknown) {
  const res = await POST(req("/api/filing", body))
  return { status: res.status, body: await res.json() }
}
async function undo(token: unknown) {
  const res = await UNDO(req("/api/filing/undo", { token }))
  return { status: res.status, body: await res.json() }
}

let tmp: string
let inbox: string
let archive: string
const SCAN_DATE = new Date("2026-11-13T22:44:48.123Z")

async function scan(name: string, content = `%PDF-1.4 ${name}`) {
  const p = path.join(inbox, name)
  await fs.writeFile(p, content)
  await fs.utimes(p, SCAN_DATE, SCAN_DATE)
  return p
}
const exists = (p: string) => fs.stat(p).then(() => true, () => false)
const ls = async (dir: string) => (await fs.readdir(dir).catch(() => [])).sort()
const sha = async (p: string) => createHash("sha256").update(await fs.readFile(p)).digest("hex")

beforeEach(async () => {
  resetUndo()
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "scantool-filing-"))
  inbox = path.join(tmp, "Scanner")
  archive = path.join(tmp, "Finanzen")
  await fs.mkdir(inbox)
  await fs.mkdir(archive)
  process.env.SCANTOOL_DATA_DIR = path.join(tmp, "data")
  await writeSettings({ inboxPath: inbox, archivePath: archive })
})

afterEach(async () => {
  vi.restoreAllMocks()
  delete process.env.SCANTOOL_DATA_DIR
  await new Promise((r) => setTimeout(r, 30))
  await fs.rm(tmp, { recursive: true, force: true })
})

const invoice = (fileName = "261102_Elektra_Strom.pdf", year = 2026) => ({ scan: "a.pdf", target: "rechnung", fileName, year })

describe("POST /api/filing – Rechnung", () => {
  it("moves the scan renamed into Rechnungen\\<Jahr>\\ (folders created), content and date unchanged", async () => {
    const src = await scan("a.pdf")
    const hash = await sha(src)
    const { status, body } = await file(invoice())
    expect(status).toBe(200)
    expect(body).toMatchObject({ ok: true, status: "filed", location: "Rechnungen\\2026\\261102_Elektra_Strom.pdf", renamed: false })
    expect(typeof body.undoToken).toBe("string")
    const target = path.join(archive, "Rechnungen", "2026", "261102_Elektra_Strom.pdf")
    expect(await sha(target)).toBe(hash)
    expect(await exists(src)).toBe(false)
    expect(Math.floor((await fs.stat(target)).mtimeMs / 1000)).toBe(Math.floor(SCAN_DATE.getTime() / 1000))
    expect(await ls(path.join(archive, "Rechnungen", "2026"))).toEqual(["261102_Elektra_Strom.pdf"]) // no temp leftovers
  })

  it("uses the year from the request, not from the file name", async () => {
    await scan("a.pdf")
    const { body } = await file(invoice("261102_X.pdf", 2025))
    expect(body.location).toBe("Rechnungen\\2025\\261102_X.pdf")
  })

  it("adds .pdf when missing", async () => {
    await scan("a.pdf")
    expect((await file(invoice("Mein Name"))).body.location).toBe("Rechnungen\\2026\\Mein Name.pdf")
  })

  it("never overwrites: _2, _3 – before _Garantie", async () => {
    const dir = path.join(archive, "Rechnungen", "2026")
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, "X.pdf"), "anders 1")
    await fs.writeFile(path.join(dir, "X_2.pdf"), "anders 2")
    await fs.writeFile(path.join(dir, "Y_Garantie.pdf"), "anders")
    await scan("a.pdf")
    await scan("b.pdf")
    expect((await file(invoice("X.pdf"))).body).toMatchObject({ location: "Rechnungen\\2026\\X_3.pdf", renamed: true })
    expect((await file({ ...invoice("Y_Garantie.pdf"), scan: "b.pdf" })).body).toMatchObject({
      location: "Rechnungen\\2026\\Y_2_Garantie.pdf",
      renamed: true,
    })
    expect(await fs.readFile(path.join(dir, "X.pdf"), "utf8")).toBe("anders 1")
  })

  it("identical file already filed (also as _2) → no copy, only the inbox is cleaned", async () => {
    const dir = path.join(archive, "Rechnungen", "2026")
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, "X.pdf"), "anders")
    await fs.writeFile(path.join(dir, "X_2.pdf"), "%PDF-1.4 a.pdf")
    const src = await scan("a.pdf")
    const { body } = await file(invoice("X.pdf"))
    expect(body).toMatchObject({ ok: true, status: "already_filed", location: "Rechnungen\\2026\\X_2.pdf" })
    expect(body.undoToken).toBeUndefined()
    expect(await exists(src)).toBe(false)
    expect(await ls(dir)).toEqual(["X.pdf", "X_2.pdf"])
  })

  it("keeps the copy and reports copied_not_deleted when the original cannot be deleted; next try cleans up", async () => {
    const src = await scan("a.pdf")
    const realUnlink = fs.unlink
    const spy = vi.spyOn(fs, "unlink").mockImplementation(async (p) => {
      if (String(p) === src) throw Object.assign(new Error("locked"), { code: "EBUSY" })
      return realUnlink(p)
    })
    const first = await file(invoice())
    expect(first.body).toMatchObject({ ok: true, status: "copied_not_deleted", location: "Rechnungen\\2026\\261102_Elektra_Strom.pdf" })
    expect(await exists(src)).toBe(true)
    spy.mockRestore()
    const second = await file(invoice())
    expect(second.body).toMatchObject({ ok: true, status: "already_filed", location: "Rechnungen\\2026\\261102_Elektra_Strom.pdf" })
    expect(await exists(src)).toBe(false)
  })

  it("verifies the copy: a broken copy is removed and the original stays", async () => {
    const src = await scan("a.pdf")
    vi.spyOn(fs, "copyFile").mockImplementation(async (_s, d) => {
      await fs.writeFile(String(d), "kaputt")
    })
    const { body } = await file(invoice())
    expect(body.ok).toBe(false)
    expect(await exists(src)).toBe(true)
    expect(await ls(path.join(archive, "Rechnungen", "2026"))).toEqual([])
  })

  it("no space / no rights → no_permission, nothing deleted, no temp file left", async () => {
    const src = await scan("a.pdf")
    vi.spyOn(fs, "copyFile").mockRejectedValue(Object.assign(new Error("full"), { code: "ENOSPC" }))
    const { status, body } = await file(invoice())
    expect(status).toBe(409)
    expect(body).toEqual({ ok: false, code: "no_permission" })
    expect(await exists(src)).toBe(true)
    expect(await ls(path.join(archive, "Rechnungen", "2026"))).toEqual([])
  })

  it("archive folder gone → archive_unreachable, the scan stays", async () => {
    const src = await scan("a.pdf")
    await fs.rm(archive, { recursive: true })
    const { status, body } = await file(invoice())
    expect(status).toBe(503)
    expect(body).toEqual({ ok: false, code: "archive_unreachable" })
    expect(await exists(src)).toBe(true)
    expect(await exists(archive)).toBe(false) // the archive root is never created
  })

  it("requires file name and year for an invoice", async () => {
    await scan("a.pdf")
    expect((await file({ ...invoice(), year: undefined })).status).toBe(400)
    expect((await file({ ...invoice(), fileName: null })).status).toBe(400)
  })
})

describe("POST /api/filing – Scan", () => {
  it("moves into <Eingang>\\Abgelegt\\ with the given name (folder created)", async () => {
    const src = await scan("a.pdf")
    const { body } = await file({ scan: "a.pdf", target: "scan", fileName: "Brief Bootslager.pdf" })
    expect(body).toMatchObject({ ok: true, status: "filed", location: "Scanner\\Abgelegt\\Brief Bootslager.pdf" })
    expect(await exists(path.join(inbox, "Abgelegt", "Brief Bootslager.pdf"))).toBe(true)
    expect(await exists(src)).toBe(false)
  })

  it("keeps the original name without a valid name", async () => {
    await scan("a.pdf")
    const { body } = await file({ scan: "a.pdf", target: "scan", fileName: null })
    expect(body.location).toBe("Scanner\\Abgelegt\\a.pdf")
  })

  it("never overwrites in Abgelegt either", async () => {
    await fs.mkdir(path.join(inbox, "Abgelegt"))
    await fs.writeFile(path.join(inbox, "Abgelegt", "a.pdf"), "anders")
    await scan("a.pdf")
    expect((await file({ scan: "a.pdf", target: "scan", fileName: null })).body).toMatchObject({
      location: "Scanner\\Abgelegt\\a_2.pdf",
      renamed: true,
    })
  })
})

describe("POST /api/filing – Papierkorb („Löschen“)", () => {
  const trash = (fileName: string | null = null) => ({ scan: "a.pdf", target: "papierkorb", fileName })

  it("moves into <Eingang>\\Papierkorb\\ under the original name with its date (folder created, never deleted)", async () => {
    const src = await scan("a.pdf")
    const before = await sha(src)
    const { status, body } = await file(trash())
    expect(status).toBe(200)
    expect(body).toMatchObject({ ok: true, status: "filed", location: "Scanner\\Papierkorb\\a.pdf", renamed: false })
    expect(body.undoToken).toEqual(expect.any(String))
    const moved = path.join(inbox, "Papierkorb", "a.pdf")
    expect(await sha(moved)).toBe(before)
    expect(Math.floor((await fs.stat(moved)).mtimeMs)).toBe(Math.floor(SCAN_DATE.getTime()))
    expect(await exists(src)).toBe(false)
    expect(await ls(inbox)).toEqual(["Papierkorb"])
  })

  it("ignores a sent file name – also an invalid one", async () => {
    await scan("a.pdf")
    const { body } = await file(trash("..\\..\\evil:name.pdf"))
    expect(body).toMatchObject({ ok: true, location: "Scanner\\Papierkorb\\a.pdf" })
    expect(await ls(path.join(inbox, "Papierkorb"))).toEqual(["a.pdf"])
  })

  it("never overwrites in Papierkorb, numbers the name instead", async () => {
    await fs.mkdir(path.join(inbox, "Papierkorb"))
    await fs.writeFile(path.join(inbox, "Papierkorb", "a.pdf"), "anders")
    await scan("a.pdf")
    expect((await file(trash())).body).toMatchObject({ location: "Scanner\\Papierkorb\\a_2.pdf", renamed: true })
    expect(await fs.readFile(path.join(inbox, "Papierkorb", "a.pdf"), "utf8")).toBe("anders")
  })

  it("an identical file already in Papierkorb → only the inbox is cleaned", async () => {
    await fs.mkdir(path.join(inbox, "Papierkorb"))
    await fs.writeFile(path.join(inbox, "Papierkorb", "a.pdf"), "%PDF-1.4 a.pdf")
    const src = await scan("a.pdf")
    expect((await file(trash())).body).toMatchObject({ ok: true, status: "already_filed", location: "Scanner\\Papierkorb\\a.pdf" })
    expect(await exists(src)).toBe(false)
    expect(await ls(path.join(inbox, "Papierkorb"))).toEqual(["a.pdf"])
  })

  it("works without a reachable archive folder (only the inbox is involved)", async () => {
    await fs.rm(archive, { recursive: true })
    await scan("a.pdf")
    expect((await file(trash())).body).toMatchObject({ ok: true, status: "filed" })
  })

  it("a missing scan → not_found, nothing created", async () => {
    const { status, body } = await file(trash())
    expect(status).toBe(404)
    expect(body).toEqual({ ok: false, code: "not_found" })
    expect(await exists(path.join(inbox, "Papierkorb"))).toBe(false)
  })

  it("„Rückgängig“ brings the scan back from Papierkorb with its date", async () => {
    const src = await scan("a.pdf")
    const { body } = await file(trash())
    expect((await undo(body.undoToken)).body).toEqual({ ok: true, name: "a.pdf", renamed: false })
    expect(Math.floor((await fs.stat(src)).mtimeMs)).toBe(Math.floor(SCAN_DATE.getTime()))
    expect(await ls(path.join(inbox, "Papierkorb"))).toEqual([])
  })

  it("rejects an unknown target", async () => {
    await scan("a.pdf")
    expect((await file({ scan: "a.pdf", target: "loeschen", fileName: null })).status).toBe(400)
    expect(await ls(inbox)).toEqual(["a.pdf"])
  })
})

describe("POST /api/filing – Eingaben & Schutz", () => {
  it("returns 404 for a scan that is gone", async () => {
    expect(await file(invoice())).toEqual({ status: 404, body: { ok: false, code: "not_found" } })
  })

  it.each([
    ["path in scan", { ...invoice(), scan: "..\\Finanzen\\x.pdf" }],
    ["path in file name", invoice("..\\..\\Windows\\x.pdf")],
    ["slash in file name", invoice("Rechnungen/2026/x.pdf")],
    ["reserved name", invoice("CON.pdf")],
    ["bad target", { ...invoice(), target: "irgendwo" }],
    ["bad year", invoice("x.pdf", 1899)],
    ["year as text", { ...invoice(), year: "2026" }],
    ["broken body", "kein json"],
  ])("rejects %s with 400 and changes nothing", async (_l, body) => {
    const src = await scan("a.pdf")
    const res = await POST(req("/api/filing", body))
    expect(res.status).toBe(400)
    expect(await exists(src)).toBe(true)
    expect(await ls(archive)).toEqual([])
  })

  it("reports an unreachable network inbox quickly", async () => {
    await writeSettings({ inboxPath: "\\\\192.0.2.1\\share\\Scans", archivePath: archive })
    const start = Date.now()
    expect((await file(invoice())).body).toEqual({ ok: false, code: "inbox_unreachable" })
    expect(Date.now() - start).toBeLessThan(5_000)
  })

  it("two requests for the same scan file it only once", async () => {
    await scan("a.pdf")
    const [a, b] = await Promise.all([file(invoice()), file(invoice())])
    const results = [a.body, b.body]
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect(results.find((r) => !r.ok)).toEqual({ ok: false, code: "not_found" })
    expect(await ls(path.join(archive, "Rechnungen", "2026"))).toEqual(["261102_Elektra_Strom.pdf"])
  })

  it("rejects requests from other websites", async () => {
    await scan("a.pdf")
    expect((await POST(req("/api/filing", invoice(), { origin: "https://evil.example" }))).status).toBe(403)
    expect((await UNDO(req("/api/filing/undo", { token: crypto.randomUUID() }, { "sec-fetch-site": "cross-site" }))).status).toBe(403)
  })
})

describe("POST /api/filing/undo", () => {
  const ANALYSIS: AnalysisResult = {
    suggestion: {
      docType: "rechnung", isInvoiceDocument: true, date: "2026-11-02", supplier: "Elektra", description: "Strom",
      amount: 1, currency: "CHF", invoiceNumber: null, articles: [], warrantyMonths: null,
    },
    pagesAnalyzed: 1, totalPages: 1, analyzedAt: "2026-11-21T10:00:00.000Z", model: "claude-haiku-5-5",
  }

  it("brings an invoice back with original name, date and AI result; token works once", async () => {
    const src = await scan("a.pdf")
    const stat = await fs.stat(src)
    await saveAnalysis(fingerprint("a.pdf", stat.size, stat.mtimeMs), "a.pdf", ANALYSIS)
    const { body } = await file(invoice())
    const res = await undo(body.undoToken)
    expect(res).toEqual({ status: 200, body: { ok: true, name: "a.pdf", renamed: false } })
    const back = await fs.stat(src)
    expect(Math.floor(back.mtimeMs)).toBe(Math.floor(stat.mtimeMs))
    expect(await exists(path.join(archive, "Rechnungen", "2026", "261102_Elektra_Strom.pdf"))).toBe(false)
    expect(await getAnalysis(fingerprint("a.pdf", back.size, back.mtimeMs))).toMatchObject({ suggestion: { supplier: "Elektra" } })
    expect((await undo(body.undoToken)).body).toEqual({ ok: false, code: "expired" })
  })

  it("brings a scan back from Abgelegt", async () => {
    const src = await scan("a.pdf")
    const { body } = await file({ scan: "a.pdf", target: "scan", fileName: "Brief.pdf" })
    expect((await undo(body.undoToken)).body).toEqual({ ok: true, name: "a.pdf", renamed: false })
    expect(await exists(src)).toBe(true)
    expect(await ls(path.join(inbox, "Abgelegt"))).toEqual([])
  })

  it("does not overwrite a new scan with the same name in the inbox", async () => {
    await scan("a.pdf")
    const { body } = await file(invoice())
    await scan("a.pdf", "neuer Scan")
    expect((await undo(body.undoToken)).body).toEqual({ ok: true, name: "a_2.pdf", renamed: true })
    expect(await fs.readFile(path.join(inbox, "a.pdf"), "utf8")).toBe("neuer Scan")
  })

  it("reports gone when the filed file was moved away meanwhile", async () => {
    await scan("a.pdf")
    const { body } = await file(invoice())
    await fs.rm(path.join(archive, "Rechnungen", "2026", "261102_Elektra_Strom.pdf"))
    expect(await undo(body.undoToken)).toEqual({ status: 410, body: { ok: false, code: "gone" } })
  })

  it("reports expired for unknown tokens and rejects non-UUIDs", async () => {
    expect((await undo(crypto.randomUUID())).body).toEqual({ ok: false, code: "expired" })
    expect((await undo("..\\..\\x")).status).toBe(400)
  })
})

describe("variantName", () => {
  it("numbers before _Garantie and keeps the extension", () => {
    expect(variantName("X.pdf", 1)).toBe("X.pdf")
    expect(variantName("X.pdf", 2)).toBe("X_2.pdf")
    expect(variantName("X_Garantie.PDF", 3)).toBe("X_3_Garantie.PDF")
  })
})
