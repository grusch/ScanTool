import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InboxWorkspace } from "@/components/inbox/inbox-workspace"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { FilingRequest, FilingResponse, UndoResponse } from "@/lib/filing-types"
import type { InboxResponse } from "@/lib/inbox-types"

vi.mock("@/components/preview/pdf-preview", () => ({ PdfPreview: () => null }))

/** Simulated inbox on the "server" */
let names: string[]
let filingCalls: FilingRequest[]
let filingAnswer: (req: FilingRequest) => FilingResponse | Promise<FilingResponse>
let undoAnswer: () => UndoResponse

const list = (): InboxResponse => ({
  folder: "C:\\Eingang",
  status: "ok",
  checkedAt: new Date().toISOString(),
  files: names.map((name, i) => ({ name, size: 1000 + i, modifiedAt: `2026-11-0${i + 1}T10:00:00.000Z` })),
})

const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response

const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  if (url === "/api/filing") {
    const req = JSON.parse(String(init?.body)) as FilingRequest
    filingCalls.push(req)
    const res = await filingAnswer(req)
    if (res.ok && res.status !== "copied_not_deleted") names = names.filter((n) => n !== req.scan)
    return json(res)
  }
  if (url === "/api/filing/undo") {
    const res = undoAnswer()
    if (res.ok) names = [...names, res.name].sort()
    return json(res)
  }
  return json(list())
})

function renderWorkspace() {
  return render(
    <TooltipProvider>
      <InboxWorkspace initialInbox={list()} apiKeyPresent={false} />
      <Toaster />
    </TooltipProvider>
  )
}

const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement
const nameField = () => screen.getByTestId("file-name-input") as HTMLInputElement
const invoiceButton = () => screen.getByRole("button", { name: /^Rechnung$/ })
const scanButton = () => screen.getByRole("button", { name: /^Scan$/ })

function fillInvoice(date = "02.11.2026", supplier = "Elektra Gaiserwald", description = "Strom E-Mobility") {
  fireEvent.change(input("Datum"), { target: { value: date } })
  fireEvent.change(input("Lieferant"), { target: { value: supplier } })
  fireEvent.change(input("Beschreibung"), { target: { value: description } })
}

const filed = (location: string, extra: Partial<Extract<FilingResponse, { ok: true }>> = {}): FilingResponse => ({
  ok: true,
  status: "filed",
  location,
  renamed: false,
  undoToken: "tok-1",
  ...extra,
})

beforeEach(() => {
  // jsdom lacks layout and media queries (inbox list scrolling, toast theme)
  Element.prototype.scrollIntoView = vi.fn()
  window.matchMedia ??= ((q: string) =>
    ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), onchange: null, dispatchEvent: vi.fn() }) as unknown as MediaQueryList)
  names = ["a.pdf", "b.pdf", "c.pdf"]
  filingCalls = []
  filingAnswer = (req) => filed(`Rechnungen\\${req.year}\\${req.fileName}`)
  undoAnswer = () => ({ ok: true, name: "a.pdf", renamed: false })
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockClear()
})

describe("Dateiname-Feld (PROJ-5)", () => {
  it("is filled from the fields and follows them while not edited", () => {
    renderWorkspace()
    fillInvoice()
    expect(nameField().value).toBe("261102_Elektra-Gaiserwald_Strom-E-Mobility.pdf")
    fireEvent.change(input("Lieferant"), { target: { value: "EW" } })
    expect(nameField().value).toBe("261102_EW_Strom-E-Mobility.pdf")
  })

  it("keeps an own name, „Aus Feldern übernehmen“ restores the automatic one", () => {
    renderWorkspace()
    fillInvoice()
    fireEvent.change(nameField(), { target: { value: "Mein Name" } })
    fireEvent.change(input("Lieferant"), { target: { value: "Anders" } })
    expect(nameField().value).toBe("Mein Name")
    fireEvent.click(screen.getByRole("button", { name: "Aus Feldern übernehmen" }))
    expect(nameField().value).toBe("261102_Anders_Strom-E-Mobility.pdf")
    expect(screen.queryByRole("button", { name: "Aus Feldern übernehmen" })).toBeNull()
  })

  it("explains invalid names and disables „Rechnung“", () => {
    renderWorkspace()
    fillInvoice()
    fireEvent.change(nameField(), { target: { value: "a/b" } })
    expect(screen.getByTestId("file-name-hint")).toHaveTextContent("Unerlaubtes Zeichen: /")
    expect(invoiceButton()).toBeDisabled()
    expect(scanButton()).toBeEnabled()
  })

  it("disables „Rechnung“ without a valid date (no year folder), „Scan“ stays possible", () => {
    renderWorkspace()
    fillInvoice("")
    fireEvent.change(nameField(), { target: { value: "Eigener Name" } })
    expect(invoiceButton()).toBeDisabled()
    expect(scanButton()).toBeEnabled()
  })

  it("keeps the own name per scan when switching back and forth", () => {
    renderWorkspace()
    fireEvent.change(nameField(), { target: { value: "Name für a" } })
    fireEvent.click(screen.getByRole("option", { name: /b\.pdf/ }))
    expect(nameField().value).toBe("")
    fireEvent.click(screen.getByRole("option", { name: /a\.pdf/ }))
    expect(nameField().value).toBe("Name für a")
  })
})

describe("Ablegen (PROJ-5)", () => {
  it("„Rechnung“ sends name and year from the date field, then the next scan is selected", async () => {
    renderWorkspace()
    fillInvoice("02.11.2025")
    fireEvent.click(invoiceButton())
    await waitFor(() => expect(filingCalls).toHaveLength(1))
    expect(filingCalls[0]).toEqual({
      scan: "a.pdf",
      target: "rechnung",
      fileName: "251102_Elektra-Gaiserwald_Strom-E-Mobility.pdf",
      year: 2025,
    })
    expect(await screen.findByText(/Abgelegt: Rechnungen\\2025\\251102_Elektra-Gaiserwald_Strom-E-Mobility\.pdf/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("option", { name: /b\.pdf/ })).toHaveAttribute("aria-selected", "true"))
    expect(screen.queryByRole("option", { name: /a\.pdf/ })).toBeNull()
  })

  it("„Scan“ sends the valid name – or null to keep the original name", async () => {
    filingAnswer = (req) => filed(`Scanner\\Abgelegt\\${req.fileName ?? req.scan}`)
    renderWorkspace()
    fireEvent.click(scanButton())
    await waitFor(() => expect(filingCalls).toHaveLength(1))
    expect(filingCalls[0]).toEqual({ scan: "a.pdf", target: "scan", fileName: null })
    await screen.findByText(/Abgelegt: Scanner\\Abgelegt\\a\.pdf/)
    await waitFor(() => expect(scanButton()).toBeEnabled(), { timeout: 3000 }) // short lock after filing

    fireEvent.change(nameField(), { target: { value: "Brief Bootslager" } })
    fireEvent.click(scanButton())
    await waitFor(() => expect(filingCalls).toHaveLength(2))
    expect(filingCalls[1]).toEqual({ scan: "b.pdf", target: "scan", fileName: "Brief Bootslager.pdf" })
  })

  it("Strg + Enter files as invoice, Strg + Umschalt + Enter as scan – also from an input field", async () => {
    renderWorkspace()
    fillInvoice()
    fireEvent.keyDown(input("Beschreibung"), { key: "Enter", ctrlKey: true })
    await waitFor(() => expect(filingCalls[0]?.target).toBe("rechnung"))
    await waitFor(() => expect(screen.getByRole("option", { name: /b\.pdf/ })).toHaveAttribute("aria-selected", "true"))
    // short lock after filing (BUG-1) – then the next shortcut works
    await waitFor(() => expect(scanButton()).toBeEnabled(), { timeout: 3000 })
    fireEvent.keyDown(document.body, { key: "Enter", ctrlKey: true, shiftKey: true })
    await waitFor(() => expect(filingCalls[1]?.target).toBe("scan"))
  })

  it("a second click or shortcut right after filing does not file the next scan (QA BUG-1)", async () => {
    renderWorkspace()
    // next scan b.pdf would be fileable at once: give it a valid date and name
    fillInvoice()
    fireEvent.click(invoiceButton())
    await waitFor(() => expect(screen.getByRole("option", { name: /b\.pdf/ })).toHaveAttribute("aria-selected", "true"))
    fillInvoice()
    expect(invoiceButton()).toBeDisabled()
    expect(scanButton()).toBeDisabled()
    fireEvent.click(invoiceButton())
    fireEvent.keyDown(document.body, { key: "Enter", ctrlKey: true })
    fireEvent.keyDown(document.body, { key: "Enter", ctrlKey: true, shiftKey: true })
    expect(filingCalls).toHaveLength(1)
    // after the short lock the buttons work again
    await waitFor(() => expect(invoiceButton()).toBeEnabled(), { timeout: 3000 })
    expect(filingCalls).toHaveLength(1)
  })

  it("the shortcut does nothing but explain when „Rechnung“ is not possible", async () => {
    renderWorkspace()
    fireEvent.keyDown(document.body, { key: "Enter", ctrlKey: true })
    expect(await screen.findByText(/Ablegen als Rechnung nicht möglich/)).toBeInTheDocument()
    expect(filingCalls).toHaveLength(0)
  })

  it("files only once while a filing is running (fast clicks, repeated shortcut)", async () => {
    let release!: () => void
    filingAnswer = (req) => new Promise((r) => (release = () => r(filed(`Rechnungen\\2026\\${req.fileName}`))))
    renderWorkspace()
    fillInvoice()
    fireEvent.click(invoiceButton())
    fireEvent.click(invoiceButton())
    fireEvent.keyDown(document.body, { key: "Enter", ctrlKey: true })
    await waitFor(() => expect(filingCalls).toHaveLength(1))
    expect(invoiceButton()).toBeDisabled()
    expect(scanButton()).toBeDisabled()
    await act(async () => release())
    await waitFor(() => expect(scanButton()).toBeEnabled())
    expect(filingCalls).toHaveLength(1)
  })

  it("names a conflict and an already filed scan", async () => {
    filingAnswer = () => filed("Rechnungen\\2026\\x_2.pdf", { renamed: true })
    renderWorkspace()
    fillInvoice()
    fireEvent.click(invoiceButton())
    expect(await screen.findByText(/x_2\.pdf \(Name war schon vergeben\)/)).toBeInTheDocument()
    filingAnswer = () => filed("Rechnungen\\2026\\y.pdf", { status: "already_filed", undoToken: undefined })
    await waitFor(() => expect(scanButton()).toBeEnabled(), { timeout: 3000 }) // short lock after filing
    fillInvoice()
    fireEvent.click(invoiceButton())
    expect(await screen.findByText(/War bereits abgelegt – Eingang bereinigt/)).toBeInTheDocument()
  })

  it.each([
    ["archive_unreachable", /Ablage-Ordner nicht erreichbar/],
    ["inbox_unreachable", /Eingangsordner nicht erreichbar/],
    ["no_permission", /keine Schreibrechte/],
  ] as const)("shows %s, keeps the scan and the input", async (code, text) => {
    filingAnswer = () => ({ ok: false, code })
    renderWorkspace()
    fillInvoice()
    fireEvent.click(invoiceButton())
    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /a\.pdf/ })).toHaveAttribute("aria-selected", "true")
    expect(input("Lieferant").value).toBe("Elektra Gaiserwald")
  })

  it("marks a scan whose original could not be deleted", async () => {
    filingAnswer = () => filed("Rechnungen\\2026\\x.pdf", { status: "copied_not_deleted", undoToken: undefined })
    renderWorkspace()
    fillInvoice()
    fireEvent.click(invoiceButton())
    expect(await screen.findByText(/Original konnte nicht aus dem Eingang gelöscht werden/)).toBeInTheDocument()
    expect(screen.getByText(/Bereits abgelegt – Original noch im Eingang/)).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /a\.pdf/ })).toBeInTheDocument()
  })

  it("„Rückgängig“ brings the scan back, selects it and restores the input", async () => {
    renderWorkspace()
    fillInvoice()
    fireEvent.click(invoiceButton())
    fireEvent.click(await screen.findByRole("button", { name: "Rückgängig" }))
    expect(await screen.findByText("Zurück im Eingang: a.pdf")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("option", { name: /a\.pdf/ })).toHaveAttribute("aria-selected", "true"))
    expect(input("Lieferant").value).toBe("Elektra Gaiserwald")
  })

  it("explains when undo is no longer possible", async () => {
    undoAnswer = () => ({ ok: false, code: "gone" })
    renderWorkspace()
    fillInvoice()
    fireEvent.click(invoiceButton())
    fireEvent.click(await screen.findByRole("button", { name: "Rückgängig" }))
    expect(await screen.findByText(/Datei nicht mehr am Ablageort/)).toBeInTheDocument()
  })
})

describe("Löschen → Papierkorb (PROJ-5)", () => {
  const trashButton = () => screen.getByRole("button", { name: /^Löschen$/ })
  const trashed = (req: FilingRequest) => filed(`Scanner\\Papierkorb\\${req.scan}`)

  it("is always possible and sends the original name only (field ignored), then the next scan is selected", async () => {
    filingAnswer = trashed
    renderWorkspace()
    // no date, invalid name: „Rechnung“ blocked, „Löschen“ still possible
    fireEvent.change(nameField(), { target: { value: "a/b" } })
    expect(invoiceButton()).toBeDisabled()
    expect(trashButton()).toBeEnabled()
    fireEvent.click(trashButton())
    await waitFor(() => expect(filingCalls).toHaveLength(1))
    expect(filingCalls[0]).toEqual({ scan: "a.pdf", target: "papierkorb", fileName: null })
    expect(await screen.findByText(/In den Papierkorb verschoben: Scanner\\Papierkorb\\a\.pdf/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("option", { name: /b\.pdf/ })).toHaveAttribute("aria-selected", "true"))
    expect(screen.queryByRole("option", { name: /a\.pdf/ })).not.toBeInTheDocument()
  })

  it("Strg + Entf moves to the trash – also from an input field, without touching the field", async () => {
    filingAnswer = trashed
    renderWorkspace()
    fireEvent.change(input("Lieferant"), { target: { value: "Digitec" } })
    const ev = fireEvent.keyDown(input("Lieferant"), { key: "Delete", ctrlKey: true })
    expect(ev).toBe(false) // default (delete word) prevented
    await waitFor(() => expect(filingCalls[0]).toEqual({ scan: "a.pdf", target: "papierkorb", fileName: null }))
  })

  it("plain Entf and Strg + Umschalt + Entf do nothing", () => {
    renderWorkspace()
    fireEvent.keyDown(document.body, { key: "Delete" })
    fireEvent.keyDown(document.body, { key: "Delete", ctrlKey: true, shiftKey: true })
    expect(filingCalls).toHaveLength(0)
  })

  it("is locked while filing runs and right after (no double delete)", async () => {
    let release!: () => void
    filingAnswer = (req) => new Promise((r) => (release = () => r(trashed(req))))
    renderWorkspace()
    fireEvent.click(trashButton())
    fireEvent.click(trashButton())
    fireEvent.keyDown(document.body, { key: "Delete", ctrlKey: true })
    await waitFor(() => expect(filingCalls).toHaveLength(1))
    expect(trashButton()).toBeDisabled()
    expect(invoiceButton()).toBeDisabled()
    await act(async () => release())
    fireEvent.keyDown(document.body, { key: "Delete", ctrlKey: true })
    expect(filingCalls).toHaveLength(1)
    await waitFor(() => expect(trashButton()).toBeEnabled(), { timeout: 3000 })
  })

  it("names an already trashed duplicate and a taken name", async () => {
    filingAnswer = (req) => filed(`Scanner\\Papierkorb\\${req.scan}`, { status: "already_filed", undoToken: undefined })
    renderWorkspace()
    fireEvent.click(trashButton())
    expect(await screen.findByText(/War bereits im Papierkorb – Eingang bereinigt/)).toBeInTheDocument()
    await waitFor(() => expect(trashButton()).toBeEnabled(), { timeout: 3000 })
    filingAnswer = () => filed("Scanner\\Papierkorb\\b_2.pdf", { renamed: true })
    fireEvent.click(trashButton())
    expect(await screen.findByText(/In den Papierkorb verschoben: Scanner\\Papierkorb\\b_2\.pdf \(Name war schon vergeben\)/)).toBeInTheDocument()
  })

  it("„Rückgängig“ brings a trashed scan back", async () => {
    filingAnswer = trashed
    renderWorkspace()
    fireEvent.click(trashButton())
    fireEvent.click(await screen.findByRole("button", { name: "Rückgängig" }))
    expect(await screen.findByText("Zurück im Eingang: a.pdf")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("option", { name: /a\.pdf/ })).toHaveAttribute("aria-selected", "true"))
  })

  it("shows errors and leaves the scan in the inbox", async () => {
    filingAnswer = () => ({ ok: false, code: "inbox_unreachable" })
    renderWorkspace()
    fireEvent.click(trashButton())
    expect(await screen.findByText(/Eingangsordner nicht erreichbar/)).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /a\.pdf/ })).toBeInTheDocument()
  })

  it("speaks of the trash, not of filing, in errors and the „already copied“ note (QA BUG-5)", async () => {
    filingAnswer = () => ({ ok: false, code: "no_permission" })
    renderWorkspace()
    fireEvent.click(trashButton())
    expect(await screen.findByText(/Verschieben in den Papierkorb nicht möglich/)).toBeInTheDocument()
    expect(screen.queryByText(/Ablegen nicht möglich/)).not.toBeInTheDocument()

    filingAnswer = () => filed("Scanner\\Papierkorb\\a.pdf", { status: "copied_not_deleted", undoToken: undefined })
    await waitFor(() => expect(trashButton()).toBeEnabled())
    fireEvent.click(trashButton())
    expect(await screen.findByText(/Liegt bereits im Papierkorb als Scanner\\Papierkorb\\a\.pdf, aber das Original/)).toBeInTheDocument()
    expect(screen.getByText(/Liegt bereits im Papierkorb – Original noch im Eingang\. Erneut löschen/)).toBeInTheDocument()
    expect(screen.queryByText(/Bereits abgelegt – Original noch im Eingang/)).not.toBeInTheDocument()
  })
})

describe("Gehaltene Tasten (QA BUG-4)", () => {
  it("auto-repeated Strg + Entf / Strg + Enter / Strg + Umschalt + Enter do nothing – only the first press counts", async () => {
    filingAnswer = (req) => filed(`Scanner\\Papierkorb\\${req.scan}`)
    renderWorkspace()
    fireEvent.change(nameField(), { target: { value: "Brief" } })
    // repeats alone (key held since before) never act, and their default is prevented
    expect(fireEvent.keyDown(document.body, { key: "Delete", ctrlKey: true, repeat: true })).toBe(false)
    fireEvent.keyDown(document.body, { key: "Enter", ctrlKey: true, shiftKey: true, repeat: true })
    fireEvent.keyDown(document.body, { key: "Enter", ctrlKey: true, repeat: true })
    expect(filingCalls).toHaveLength(0)

    // first press acts, the held key's repeats after the lock do not delete the next scans
    fireEvent.keyDown(document.body, { key: "Delete", ctrlKey: true })
    await waitFor(() => expect(filingCalls).toHaveLength(1))
    await waitFor(() => expect(screen.getByRole("button", { name: /^Löschen$/ })).toBeEnabled(), { timeout: 3000 })
    for (let i = 0; i < 5; i++) fireEvent.keyDown(document.body, { key: "Delete", ctrlKey: true, repeat: true })
    await new Promise((r) => setTimeout(r, 50))
    expect(filingCalls).toHaveLength(1)
    expect(screen.getByRole("option", { name: /b\.pdf/ })).toBeInTheDocument()
  })
})
