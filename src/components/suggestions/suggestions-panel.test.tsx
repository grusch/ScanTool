import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InboxWorkspace } from "@/components/inbox/inbox-workspace"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { AnalyzeResponse, Suggestion } from "@/lib/analysis-types"
import type { InboxResponse } from "@/lib/inbox-types"

// The PDF preview (PROJ-3) needs a real browser – not part of these tests
vi.mock("@/components/preview/pdf-preview", () => ({ PdfPreview: () => null }))

const SUGGESTION: Suggestion = {
  docType: "rechnung",
  isInvoiceDocument: true,
  date: "2026-11-02",
  supplier: "Elektra Gaiserwald",
  description: "Strom E-Mobility",
  amount: 694.05,
  currency: "CHF",
  invoiceNumber: "745170",
  articles: ["Energie", "Netznutzung"],
  warrantyMonths: null,
}

function ok(suggestion: Partial<Suggestion> = {}, extra: Partial<AnalyzeResponse> = {}): AnalyzeResponse {
  return {
    ok: true,
    cached: false,
    suggestion: { ...SUGGESTION, ...suggestion },
    pagesAnalyzed: 2,
    totalPages: 2,
    analyzedAt: "2026-11-21T10:00:00.000Z",
    model: "claude-haiku-5-5",
    ...extra,
  } as AnalyzeResponse
}

const inbox = (...names: string[]): InboxResponse => ({
  folder: "C:\\Eingang",
  status: "ok",
  checkedAt: "2026-11-21T10:00:00.000Z",
  files: names.map((name, i) => ({ name, size: 1000 + i, modifiedAt: `2026-11-0${i + 1}T10:00:00.000Z` })),
})

/** Pending analysis responses per scan name, resolved by the test */
let pending: Record<string, ((r: AnalyzeResponse) => void)[]>
let analysisCalls: { name: string; force: boolean }[]
const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  if (url === "/api/analysis") {
    const body = JSON.parse(String(init?.body)) as { name: string; force: boolean }
    analysisCalls.push(body)
    const res = await new Promise<AnalyzeResponse>((resolve) => (pending[body.name] ??= []).push(resolve))
    return { ok: res.ok, status: 200, json: async () => res } as Response
  }
  return { ok: true, status: 200, json: async () => inbox("a.pdf", "b.pdf") } as Response
})

async function answer(name: string, res: AnalyzeResponse) {
  await waitFor(() => expect(pending[name]?.length).toBeGreaterThan(0))
  await act(async () => {
    pending[name].shift()!(res)
  })
}

function renderWorkspace(apiKeyPresent = true, list = inbox("a.pdf", "b.pdf")) {
  return render(
    <TooltipProvider>
      <InboxWorkspace initialInbox={list} apiKeyPresent={apiKeyPresent} />
    </TooltipProvider>
  )
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement
const fileName = () => screen.getByTestId("file-name-preview").textContent

beforeEach(() => {
  // jsdom has no layout: the inbox list scrolls the selected entry into view
  Element.prototype.scrollIntoView = vi.fn()
  pending = {}
  analysisCalls = []
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockClear()
})

describe("Vorschläge (PROJ-4)", () => {
  it("analyses the selected scan automatically and fills the fields", async () => {
    renderWorkspace()
    expect(await screen.findByText("KI analysiert …")).toBeInTheDocument()
    await answer("a.pdf", ok())
    expect(await screen.findByText("Von KI vorgeschlagen")).toBeInTheDocument()
    expect(field("Datum").value).toBe("02.11.2026")
    expect(field("Lieferant").value).toBe("Elektra Gaiserwald")
    expect(field("Betrag").value).toBe("694.05")
    expect(field("Währung").value).toBe("CHF")
    expect(field("Rechnungsnummer").value).toBe("745170")
    expect((screen.getByLabelText("Artikel (eine Position pro Zeile)") as HTMLTextAreaElement).value).toBe("Energie\nNetznutzung")
    expect(fileName()).toBe("261102_Elektra-Gaiserwald_Strom-E-Mobility.pdf")
    expect(analysisCalls).toEqual([{ name: "a.pdf", force: false }])
  })

  it("never overwrites what the user typed while the analysis was running", async () => {
    renderWorkspace()
    await screen.findByText("KI analysiert …")
    fireEvent.change(field("Lieferant"), { target: { value: "EW Gaiserwald" } })
    await answer("a.pdf", ok())
    await screen.findByText("Von KI vorgeschlagen")
    expect(field("Lieferant").value).toBe("EW Gaiserwald")
    expect(field("Datum").value).toBe("02.11.2026")
    expect(fileName()).toBe("261102_EW-Gaiserwald_Strom-E-Mobility.pdf")
  })

  it("keeps own input and suggestions when switching scans and back – without a new request", async () => {
    renderWorkspace()
    await answer("a.pdf", ok())
    await screen.findByText("Von KI vorgeschlagen")
    fireEvent.change(field("Beschreibung"), { target: { value: "Strom Garage" } })

    fireEvent.click(screen.getByRole("option", { name: /b\.pdf/ }))
    await answer("b.pdf", ok({ supplier: "Digitec", description: "Monitor" }))
    await waitFor(() => expect(field("Lieferant").value).toBe("Digitec"))

    fireEvent.click(screen.getByRole("option", { name: /a\.pdf/ }))
    await waitFor(() => expect(field("Lieferant").value).toBe("Elektra Gaiserwald"))
    expect(field("Beschreibung").value).toBe("Strom Garage")
    expect(analysisCalls.filter((c) => c.name === "a.pdf")).toHaveLength(1)
  })

  it("„Neu analysieren“ asks again (force) and keeps own input", async () => {
    renderWorkspace()
    await answer("a.pdf", ok())
    await screen.findByText("Von KI vorgeschlagen")
    fireEvent.change(field("Lieferant"), { target: { value: "Eigener Wert" } })
    fireEvent.click(screen.getByRole("button", { name: "Neu analysieren" }))
    expect(screen.getByRole("button", { name: "Neu analysieren" })).toBeDisabled()
    await answer("a.pdf", ok({ supplier: "Anders", description: "Neue Beschreibung" }))
    await waitFor(() => expect(field("Beschreibung").value).toBe("Neue Beschreibung"))
    expect(field("Lieferant").value).toBe("Eigener Wert")
    expect(analysisCalls).toEqual([
      { name: "a.pdf", force: false },
      { name: "a.pdf", force: true },
    ])
  })

  it("shows the 5-page hint and the not-an-invoice hint", async () => {
    renderWorkspace()
    await answer("a.pdf", ok({ isInvoiceDocument: false, docType: null }, { pagesAnalyzed: 5, totalPages: 9 }))
    expect(await screen.findByText("Kein Rechnungsdokument erkannt.")).toBeInTheDocument()
    expect(screen.getByText(/Nur die ersten 5 Seiten analysiert \(9 Seiten insgesamt\)/)).toBeInTheDocument()
  })

  it("leaves unsure fields empty and names what is missing for the file name", async () => {
    renderWorkspace()
    await answer("a.pdf", ok({ date: null, description: null, amount: null }))
    await screen.findByText("Von KI vorgeschlagen")
    expect(field("Datum").value).toBe("")
    expect(field("Betrag").value).toBe("")
    expect(fileName()).toBe("Datum fehlt · Beschreibung fehlt")
  })

  it.each([
    ["no_credit", /Kein Guthaben/, true],
    ["unreachable", /Claude ist nicht erreichbar/, true],
    ["timeout", /dauert zu lange/, true],
    ["inbox_unreachable", /Eingangsordner nicht erreichbar/, true],
    ["bad_response", /KI-Antwort war unbrauchbar/, true],
    ["unreadable", /Scan kann nicht analysiert werden/, false],
    ["too_large", /Scan zu gross/, false],
  ] as const)("shows %s with a clear message, fields stay usable", async (code, text, retry) => {
    renderWorkspace()
    await answer("a.pdf", { ok: false, code })
    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.queryAllByRole("button", { name: "Erneut versuchen" })).toHaveLength(retry ? 1 : 0)
    fireEvent.change(field("Lieferant"), { target: { value: "Selbst" } })
    expect(field("Lieferant").value).toBe("Selbst")
  })

  it("„Erneut versuchen“ after an error asks again and shows the result", async () => {
    renderWorkspace()
    await answer("a.pdf", { ok: false, code: "unreachable" })
    fireEvent.click(await screen.findByRole("button", { name: "Erneut versuchen" }))
    await answer("a.pdf", ok())
    await waitFor(() => expect(field("Lieferant").value).toBe("Elektra Gaiserwald"))
  })

  it("does not call the analysis without API key and links to the settings", async () => {
    renderWorkspace(false)
    expect(await screen.findByText(/API-Schlüssel in den Einstellungen hinterlegen/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Zu den Einstellungen" })).toHaveAttribute("href", "/einstellungen")
    expect(screen.getByRole("button", { name: "Neu analysieren" })).toBeDisabled()
    expect(analysisCalls).toHaveLength(0)
    fireEvent.change(field("Lieferant"), { target: { value: "Selbst" } })
    expect(field("Lieferant").value).toBe("Selbst")
  })

  it("refreshes the list when the scan is gone", async () => {
    renderWorkspace()
    await answer("a.pdf", { ok: false, code: "not_found" })
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => u === "/api/inbox")).toBe(true))
  })

  it("shows texts from the scan as plain text (no HTML)", async () => {
    renderWorkspace()
    await answer("a.pdf", ok({ supplier: '<img src=x onerror="alert(1)">' }))
    await screen.findByText("Von KI vorgeschlagen")
    expect(field("Lieferant").value).toBe('<img src=x onerror="alert(1)">')
    expect(document.querySelector("img[src='x']")).toBeNull()
  })

  it("shows „Kein Scan ausgewählt“ for an empty inbox", () => {
    renderWorkspace(true, inbox())
    expect(screen.getAllByText("Kein Scan ausgewählt").length).toBeGreaterThan(0)
    expect(analysisCalls).toHaveLength(0)
  })
})
