// @vitest-environment node
import { promises as fs } from "fs"
import os from "os"
import path from "path"
import Anthropic from "@anthropic-ai/sdk"
import { PDFDocument } from "pdf-lib"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { listInbox, resetInboxObservations } from "@/lib/server/inbox"
import { writeSettings } from "@/lib/server/settings-store"
import { A4, makePdf } from "../../../../tests/helpers/make-pdf"
import { POST } from "./route"

// Intercept the real SDK call – no network, no costs
const parse = vi.spyOn(Anthropic.Messages.prototype, "parse")

type Output = Record<string, unknown>
const GOOD: Output = {
  is_invoice_document: true,
  doc_type: "rechnung",
  date: "2026-11-21",
  supplier: " Digitec ",
  description: "Monitor Dell U2724D",
  amount: 389,
  currency: "chf",
  invoice_number: "R-4711",
  articles: ["Dell U2724D Monitor", "HDMI-Kabel"],
  warranty_months: 24,
}

function answer(output: Output | null, stop_reason = "end_turn") {
  return { stop_reason, parsed_output: output, content: [] } as unknown as Awaited<ReturnType<typeof Anthropic.Messages.prototype.parse>>
}

function apiError(status: number, type: string, message = "error") {
  return Anthropic.APIError.generate(status, { type: "error", error: { type, message } }, message, new Headers())
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://127.0.0.1:3000/api/analysis", {
    method: "POST",
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

async function analyze(name: string, force = false) {
  const res = await POST(req({ name, force }))
  return { status: res.status, body: await res.json() }
}

/** PDF document that was sent to Claude in call `n` */
function sentPdf(n = 0): Buffer {
  const params = parse.mock.calls[n][0] as { messages: { content: { type: string; source?: { data: string } }[] }[] }
  const doc = params.messages[0].content.find((c) => c.type === "document")!
  return Buffer.from(doc.source!.data, "base64")
}

let tmp: string
let inbox: string

async function scan(name: string, content: Buffer = makePdf([A4, A4])) {
  const p = path.join(inbox, name)
  await fs.writeFile(p, content)
  const t = new Date(Date.now() - 600_000)
  await fs.utimes(p, t, t)
  return p
}

async function storeEntries() {
  try {
    return Object.keys(JSON.parse(await fs.readFile(path.join(tmp, "data", "analyses.json"), "utf8")).entries)
  } catch {
    return []
  }
}

beforeEach(async () => {
  resetInboxObservations()
  parse.mockReset()
  process.env.ANTHROPIC_API_KEY = "sk-ant-test"
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "scantool-analysis-"))
  inbox = path.join(tmp, "Eingang")
  await fs.mkdir(inbox)
  await fs.mkdir(path.join(tmp, "Ablage"))
  process.env.SCANTOOL_DATA_DIR = path.join(tmp, "data")
  await writeSettings({ inboxPath: inbox, archivePath: path.join(tmp, "Ablage") })
})

afterEach(async () => {
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.SCANTOOL_DATA_DIR
  await new Promise((r) => setTimeout(r, 50)) // let background store writes finish
  await fs.rm(tmp, { recursive: true, force: true })
})

describe("POST /api/analysis – Analyse & Merken", () => {
  it("analyses with Claude Haiku 5.5 and returns normalised suggestions", async () => {
    await scan("rechnung.pdf")
    parse.mockResolvedValue(answer(GOOD))
    const { status, body } = await analyze("rechnung.pdf")
    expect(status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      cached: false,
      pagesAnalyzed: 2,
      totalPages: 2,
      model: "claude-haiku-5-5",
      suggestion: {
        docType: "rechnung",
        isInvoiceDocument: true,
        date: "2026-11-21",
        supplier: "Digitec",
        currency: "CHF",
        amount: 389,
        invoiceNumber: "R-4711",
        articles: ["Dell U2724D Monitor", "HDMI-Kabel"],
        warrantyMonths: 24,
      },
    })
    const params = parse.mock.calls[0][0] as unknown as Record<string, unknown>
    expect(params.model).toBe("claude-haiku-5-5")
    expect(params.output_config).toMatchObject({ effort: "low" })
    expect(sentPdf().subarray(0, 5).toString()).toBe("%PDF-")
  })

  it("remembers the result – second request costs nothing, also after a restart (file store)", async () => {
    await scan("a.pdf")
    parse.mockResolvedValue(answer(GOOD))
    await analyze("a.pdf")
    const second = await analyze("a.pdf")
    expect(second.body).toMatchObject({ ok: true, cached: true, suggestion: { supplier: "Digitec" } })
    expect(parse).toHaveBeenCalledTimes(1)
    expect(await storeEntries()).toHaveLength(1)
  })

  it("„Neu analysieren“ (force) asks Claude again", async () => {
    await scan("a.pdf")
    parse.mockResolvedValueOnce(answer(GOOD)).mockResolvedValueOnce(answer({ ...GOOD, supplier: "Galaxus" }))
    await analyze("a.pdf")
    const again = await analyze("a.pdf", true)
    expect(again.body).toMatchObject({ ok: true, cached: false, suggestion: { supplier: "Galaxus" } })
    expect(parse).toHaveBeenCalledTimes(2)
  })

  it("two requests at the same time trigger only one analysis", async () => {
    await scan("a.pdf")
    let release!: () => void
    parse.mockImplementation(() => new Promise((r) => (release = () => r(answer(GOOD)))) as never)
    const p1 = analyze("a.pdf")
    const p2 = analyze("a.pdf")
    await vi.waitFor(() => expect(parse).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 50))
    release()
    const [a, b] = await Promise.all([p1, p2])
    expect(a.body.ok && b.body.ok).toBe(true)
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it("analyses a replaced file (same name, new content) again and drops the old result", async () => {
    const p = await scan("a.pdf")
    parse.mockResolvedValue(answer(GOOD))
    await analyze("a.pdf")
    await fs.writeFile(p, makePdf([A4, A4, A4]))
    const res = await analyze("a.pdf")
    expect(res.body).toMatchObject({ ok: true, cached: false, totalPages: 3 })
    expect(parse).toHaveBeenCalledTimes(2)
    expect(await storeEntries()).toHaveLength(1)
  })

  it("does not remember errors – the next attempt asks again", async () => {
    await scan("a.pdf")
    parse.mockRejectedValueOnce(new Anthropic.APIConnectionError({ message: "offline" })).mockResolvedValueOnce(answer(GOOD))
    expect((await analyze("a.pdf")).body).toEqual({ ok: false, code: "unreachable" })
    expect((await analyze("a.pdf")).body.ok).toBe(true)
    expect(parse).toHaveBeenCalledTimes(2)
  })

  it("forgets results of scans that left the inbox when the list is refreshed", async () => {
    await scan("bleibt.pdf")
    const weg = await scan("weg.pdf")
    parse.mockResolvedValue(answer(GOOD))
    await analyze("bleibt.pdf")
    await analyze("weg.pdf")
    expect(await storeEntries()).toHaveLength(2)
    await fs.rm(weg)
    await listInbox()
    await vi.waitFor(async () => expect(await storeEntries()).toHaveLength(1))
    expect((await storeEntries())[0]).toMatch(/^bleibt\.pdf\|/)
  })
})

describe("POST /api/analysis – Grosse und kaputte Scans", () => {
  it("sends only the first 5 pages of a 7-page scan", async () => {
    await scan("dick.pdf", makePdf(Array(7).fill(A4)))
    parse.mockResolvedValue(answer(GOOD))
    const { body } = await analyze("dick.pdf")
    expect(body).toMatchObject({ ok: true, pagesAnalyzed: 5, totalPages: 7 })
    expect((await PDFDocument.load(sentPdf())).getPageCount()).toBe(5)
  })

  it("leaves the original file untouched", async () => {
    const p = await scan("dick.pdf", makePdf(Array(7).fill(A4)))
    const before = await fs.readFile(p)
    parse.mockResolvedValue(answer(GOOD))
    await analyze("dick.pdf")
    expect((await fs.readFile(p)).equals(before)).toBe(true)
  })

  it.each([
    ["damaged file", Buffer.from("das ist kein pdf")],
    ["password-protected PDF", makePdf([A4], { passwordProtected: true })],
  ])("reports %s as unreadable without calling Claude", async (_label, content) => {
    await scan("x.pdf", content)
    const { status, body } = await analyze("x.pdf")
    expect(status).toBe(422)
    expect(body).toEqual({ ok: false, code: "unreadable" })
    expect(parse).not.toHaveBeenCalled()
  })

  it("refuses scans over 30 MB without reading or calling Claude", async () => {
    const p = path.join(inbox, "riesig.pdf")
    await fs.writeFile(p, "")
    await fs.truncate(p, 31 * 1024 * 1024)
    const { status, body } = await analyze("riesig.pdf")
    expect(status).toBe(413)
    expect(body).toEqual({ ok: false, code: "too_large" })
    expect(parse).not.toHaveBeenCalled()
  })
})

describe("POST /api/analysis – Antwort von Claude", () => {
  it("leaves unsure / invalid values empty", async () => {
    await scan("a.pdf")
    parse.mockResolvedValue(
      answer({
        ...GOOD,
        date: "2026-02-30",
        currency: "Franken",
        amount: 12.345,
        supplier: "   ",
        warranty_months: 0,
        articles: Array.from({ length: 12 }, (_, i) => `Pos ${i + 1}`).concat(["  "]),
      })
    )
    const { body } = await analyze("a.pdf")
    expect(body.suggestion).toMatchObject({ date: null, currency: null, amount: 12.35, supplier: null, warrantyMonths: null })
    expect(body.suggestion.articles).toHaveLength(10)
  })

  it("keeps no document type when it is not an invoice document", async () => {
    await scan("brief.pdf")
    parse.mockResolvedValue(answer({ ...GOOD, is_invoice_document: false, doc_type: "rechnung" }))
    const { body } = await analyze("brief.pdf")
    expect(body.suggestion).toMatchObject({ isInvoiceDocument: false, docType: null, date: "2026-11-21" })
  })

  it.each([
    ["a refusal", answer(GOOD, "refusal")],
    ["a cut-off answer", answer(GOOD, "max_tokens")],
    ["an unparseable answer", answer(null)],
  ])("reports %s as bad_response", async (_label, response) => {
    await scan("a.pdf")
    parse.mockResolvedValue(response)
    expect((await analyze("a.pdf")).body).toEqual({ ok: false, code: "bad_response" })
  })

  it.each([
    [apiError(401, "authentication_error"), "invalid_key"],
    [apiError(402, "billing_error"), "no_credit"],
    [apiError(400, "invalid_request_error", "Your credit balance is too low"), "no_credit"],
    [new Anthropic.APIConnectionError({ message: "offline" }), "unreachable"],
    [new Anthropic.APIConnectionTimeoutError(), "timeout"],
    [apiError(529, "overloaded_error"), "unreachable"],
  ])("maps %s to %s", async (err, code) => {
    await scan("a.pdf")
    parse.mockRejectedValue(err)
    expect((await analyze("a.pdf")).body).toEqual({ ok: false, code })
  })
})

describe("POST /api/analysis – Eingaben & Schutz", () => {
  it("does nothing without API key", async () => {
    delete process.env.ANTHROPIC_API_KEY
    await scan("a.pdf")
    const { status, body } = await analyze("a.pdf")
    expect(status).toBe(412)
    expect(body).toEqual({ ok: false, code: "missing_key" })
    expect(parse).not.toHaveBeenCalled()
  })

  it("returns 404 for a scan that is gone", async () => {
    const { status, body } = await analyze("weg.pdf")
    expect(status).toBe(404)
    expect(body).toEqual({ ok: false, code: "not_found" })
  })

  it.each(["..\\Ablage\\x.pdf", "../x.pdf", "C:\\Windows\\x.pdf", "notiz.txt", "~$x.pdf", ""])(
    "rejects the name %j",
    async (name) => {
      const { status } = await analyze(name)
      expect(status).toBe(400)
      expect(parse).not.toHaveBeenCalled()
    }
  )

  it("rejects a broken request body", async () => {
    expect((await POST(req("{kein json"))).status).toBe(400)
    expect((await POST(req({ name: 5 }))).status).toBe(400)
  })

  it("reports an unreachable network inbox quickly", async () => {
    await writeSettings({ inboxPath: "\\\\192.0.2.1\\share\\Scans", archivePath: path.join(tmp, "Ablage") })
    const start = Date.now()
    const { status, body } = await analyze("a.pdf")
    expect(status).toBe(503)
    expect(body).toEqual({ ok: false, code: "inbox_unreachable" })
    expect(Date.now() - start).toBeLessThan(5_000)
  })

  it("rejects requests from other websites", async () => {
    await scan("a.pdf")
    expect((await POST(req({ name: "a.pdf" }, { origin: "https://evil.example" }))).status).toBe(403)
    expect((await POST(req({ name: "a.pdf" }, { "sec-fetch-site": "cross-site" }))).status).toBe(403)
    expect(parse).not.toHaveBeenCalled()
  })

  it("never returns the API key", async () => {
    await scan("a.pdf")
    parse.mockRejectedValue(apiError(401, "authentication_error"))
    expect(await (await POST(req({ name: "a.pdf" }))).text()).not.toContain("sk-ant-test")
  })
})
