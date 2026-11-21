import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { expect, test, type Page } from '@playwright/test'
import { A4, makePdf } from './helpers/make-pdf'

// Real filing with real files – in isolated temp folders of the QA server (never the user's folders).
const QA_DATA_DIR = path.join(__dirname, '.qa-data')
const SETTINGS_FILE = path.join(QA_DATA_DIR, 'settings.json')
const SCAN_DATE = new Date(2026, 10, 13, 23, 44) // 13.11.2026 local time

let tmp: string
let inbox: string
let archive: string

async function scan(name: string, ageMin: number, pages = 1) {
  const p = path.join(inbox, name)
  await fs.writeFile(p, makePdf(Array(pages).fill(A4)))
  const t = new Date(SCAN_DATE.getTime() - ageMin * 60_000)
  await fs.utimes(p, t, t)
  return p
}
const exists = (p: string) => fs.stat(p).then(() => true, () => false)
const ls = async (dir: string) => (await fs.readdir(dir).catch(() => [] as string[])).sort()
const invoiceDir = (year = 2026) => path.join(archive, 'Rechnungen', String(year))

async function open(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}
const panel = (page: Page) => page.getByLabel(/^Vorschläge:/)
const field = (page: Page, label: string) => panel(page).getByLabel(label, { exact: true })
const nameField = (page: Page) => page.getByTestId('file-name-input')
const invoiceBtn = (page: Page) => page.getByRole('button', { name: /^Rechnung$/ })
const scanBtn = (page: Page) => page.getByRole('button', { name: /^Scan$/ })
const selected = (page: Page) => page.locator('[role="option"][aria-selected="true"]')

async function fillInvoice(page: Page, date = '02.11.2026', supplier = 'Elektra Gaiserwald', description = 'Strom E-Mobility') {
  await field(page, 'Datum').fill(date)
  await field(page, 'Lieferant').fill(supplier)
  await field(page, 'Beschreibung').fill(description)
}

test.beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'scantool-e2e5-'))
  inbox = path.join(tmp, 'Scanner')
  archive = path.join(tmp, 'Finanzen')
  await fs.mkdir(inbox)
  await fs.mkdir(archive)
  await fs.mkdir(QA_DATA_DIR, { recursive: true })
  await fs.writeFile(SETTINGS_FILE, JSON.stringify({ inboxPath: inbox, archivePath: archive, updatedAt: new Date().toISOString() }))
})

test.afterEach(async () => {
  await fs.rm(SETTINGS_FILE, { force: true })
  await fs.rm(path.join(QA_DATA_DIR, 'analyses.json'), { force: true })
  await fs.rm(tmp, { recursive: true, force: true })
})

test.describe('PROJ-5 Dateiname-Feld', () => {
  test('Vorbelegt mit Datum aus der Datei, folgt den Feldern; eigener Name bleibt; „Aus Feldern übernehmen"', async ({ page }) => {
    await scan('a.pdf', 10)
    await open(page)
    await expect(nameField(page)).toHaveValue('261113_.pdf')
    await expect(page.getByTestId('file-name-hint')).toHaveText('Lieferant fehlt · Beschreibung fehlt')
    await fillInvoice(page)
    await expect(nameField(page)).toHaveValue('261102_Elektra-Gaiserwald_Strom-E-Mobility.pdf')
    await nameField(page).fill('Eigener Name')
    await field(page, 'Lieferant').fill('EW')
    await expect(nameField(page)).toHaveValue('Eigener Name')
    await page.getByRole('button', { name: 'Aus Feldern übernehmen' }).click()
    await expect(nameField(page)).toHaveValue('261102_EW_Strom-E-Mobility.pdf')
  })

  test('Ungültiger Name → rote Meldung, „Rechnung" gesperrt, „Scan" möglich', async ({ page }) => {
    await scan('a.pdf', 10)
    await open(page)
    await nameField(page).fill('Rechnungen/2026/x')
    await expect(page.getByTestId('file-name-hint')).toHaveText('Unerlaubtes Zeichen: /')
    await expect(invoiceBtn(page)).toBeDisabled()
    await expect(scanBtn(page)).toBeEnabled()
    await nameField(page).fill('CON')
    await expect(page.getByTestId('file-name-hint')).toContainText('reserviert')
  })

  test('Ohne gültiges Datum ist „Rechnung" gesperrt', async ({ page }) => {
    await scan('a.pdf', 10)
    await open(page)
    await field(page, 'Datum').fill('31.02.2026')
    await nameField(page).fill('Name ohne Datum')
    await expect(invoiceBtn(page)).toBeDisabled()
    await expect(scanBtn(page)).toBeEnabled()
  })
})

test.describe('PROJ-5 Ablegen', () => {
  test('„Rechnung": verschiebt nach Rechnungen\\<Jahr aus Datumsfeld>\\, legt Ordner an, nächster Scan ausgewählt', async ({ page }) => {
    const a = await scan('a.pdf', 20)
    await scan('b.pdf', 10)
    await open(page)
    await fillInvoice(page, '02.11.2025')
    await invoiceBtn(page).click()
    await expect(page.getByText('Abgelegt: Rechnungen\\2025\\251102_Elektra-Gaiserwald_Strom-E-Mobility.pdf')).toBeVisible()
    expect(await ls(invoiceDir(2025))).toEqual(['251102_Elektra-Gaiserwald_Strom-E-Mobility.pdf'])
    expect(await exists(a)).toBe(false)
    await expect(page.getByRole('option')).toHaveCount(1)
    await expect(selected(page)).toContainText('b.pdf')
  })

  test('„Scan": nach Abgelegt mit Namen – ohne gültigen Namen unter dem Originalnamen; nicht mehr in der Liste', async ({ page }) => {
    await scan('brief.pdf', 20)
    await scan('zettel.pdf', 10)
    await open(page)
    await nameField(page).fill('Brief Bootslager')
    await scanBtn(page).click()
    await expect(page.getByText(/Abgelegt: Scanner\\Abgelegt\\Brief Bootslager\.pdf/)).toBeVisible()
    await expect(selected(page)).toContainText('zettel.pdf')
    await nameField(page).fill('ungültig|')
    await scanBtn(page).click()
    await expect(page.getByText(/Abgelegt: Scanner\\Abgelegt\\zettel\.pdf/)).toBeVisible()
    expect(await ls(path.join(inbox, 'Abgelegt'))).toEqual(['Brief Bootslager.pdf', 'zettel.pdf'])
    await expect(page.getByRole('option')).toHaveCount(0)
    await expect(page.getByText('Keine neuen Scans – alles abgelegt 🎉')).toBeVisible()
  })

  test('„Rückgängig": Scan zurück im Eingang, wieder ausgewählt, Eingaben wieder da', async ({ page }) => {
    const a = await scan('a.pdf', 20)
    await scan('b.pdf', 10)
    await open(page)
    await fillInvoice(page)
    await invoiceBtn(page).click()
    await page.getByRole('button', { name: 'Rückgängig' }).click()
    await expect(page.getByText('Zurück im Eingang: a.pdf')).toBeVisible()
    expect(await exists(a)).toBe(true)
    expect(await ls(invoiceDir())).toEqual([])
    await expect(selected(page)).toContainText('a.pdf')
    await expect(field(page, 'Lieferant')).toHaveValue('Elektra Gaiserwald')
    await expect(page.getByRole('option').filter({ hasText: 'a.pdf' })).toContainText('13.11.2026')
  })

  test('Namenskonflikt → _2, nichts überschrieben', async ({ page }) => {
    await fs.mkdir(invoiceDir(), { recursive: true })
    await fs.writeFile(path.join(invoiceDir(), '261102_Elektra-Gaiserwald_Strom-E-Mobility.pdf'), 'andere Rechnung')
    await scan('a.pdf', 10)
    await open(page)
    await fillInvoice(page)
    await invoiceBtn(page).click()
    await expect(page.getByText(/_2\.pdf \(Name war schon vergeben\)/)).toBeVisible()
    expect(await fs.readFile(path.join(invoiceDir(), '261102_Elektra-Gaiserwald_Strom-E-Mobility.pdf'), 'utf8')).toBe('andere Rechnung')
    expect(await ls(invoiceDir())).toHaveLength(2)
  })

  test('Identische Datei schon abgelegt → nur Eingang bereinigt', async ({ page }) => {
    const a = await scan('a.pdf', 10)
    await fs.mkdir(invoiceDir(), { recursive: true })
    await fs.copyFile(a, path.join(invoiceDir(), '261102_Elektra-Gaiserwald_Strom-E-Mobility.pdf'))
    await open(page)
    await fillInvoice(page)
    await invoiceBtn(page).click()
    await expect(page.getByText(/War bereits abgelegt – Eingang bereinigt/)).toBeVisible()
    expect(await exists(a)).toBe(false)
    expect(await ls(invoiceDir())).toHaveLength(1)
  })

  test('Ablage-Ordner weg → Meldung, Scan und Eingaben bleiben', async ({ page }) => {
    const a = await scan('a.pdf', 10)
    await open(page)
    await fillInvoice(page)
    await fs.rm(archive, { recursive: true })
    await invoiceBtn(page).click()
    await expect(page.getByText('Ablage-Ordner nicht erreichbar – der Scan bleibt im Eingang.')).toBeVisible()
    expect(await exists(a)).toBe(true)
    await expect(field(page, 'Lieferant')).toHaveValue('Elektra Gaiserwald')
    await expect(selected(page)).toContainText('a.pdf')
  })

  test('Doppelklick + Kürzel während des Ablegens → genau ein Scan abgelegt', async ({ page }) => {
    await scan('a.pdf', 30)
    await scan('b.pdf', 20)
    await scan('c.pdf', 10)
    await open(page)
    await fillInvoice(page)
    await invoiceBtn(page).dblclick()
    await page.keyboard.press('Control+Enter')
    await expect(page.getByText(/Abgelegt: Rechnungen/)).toBeVisible()
    await page.keyboard.press('Control+Enter') // right after filing – must not hit the next scan
    await page.waitForTimeout(1500)
    expect(await ls(invoiceDir())).toHaveLength(1)
    expect(await ls(inbox)).toEqual(['b.pdf', 'c.pdf'])
  })
})

test.describe('PROJ-5 Tastatur', () => {
  test('Strg + Enter aus einem Feld = Rechnung, Strg + Umschalt + Enter = Scan', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keine Hardware-Tastatur')
    await scan('a.pdf', 20)
    await scan('b.pdf', 10)
    await open(page)
    await fillInvoice(page)
    await field(page, 'Beschreibung').press('Control+Enter')
    await expect(page.getByText(/Abgelegt: Rechnungen\\2026\\/)).toBeVisible()
    await expect(selected(page)).toContainText('b.pdf')
    await expect(scanBtn(page)).toBeEnabled() // short lock after filing (BUG-1)
    await page.keyboard.press('Control+Shift+Enter')
    await expect(page.getByText(/Abgelegt: Scanner\\Abgelegt\\/)).toBeVisible()
    expect(await ls(path.join(inbox, 'Abgelegt'))).toHaveLength(1)
  })

  test('Kürzel bei gesperrter „Rechnung" legt nicht ab, sondern erklärt', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keine Hardware-Tastatur')
    const a = await scan('a.pdf', 10)
    await open(page)
    await field(page, 'Datum').fill('')
    await page.keyboard.press('Control+Enter')
    await expect(page.getByText(/Ablegen als Rechnung nicht möglich/)).toBeVisible()
    expect(await exists(a)).toBe(true)
  })
})

test.describe('PROJ-5 Darstellung & Schutz', () => {
  for (const vp of [
    { name: 'Mobile (375px)', width: 375, height: 800 },
    { name: 'Tablet (768px)', width: 768, height: 1000 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
  ]) {
    test(`${vp.name}: Dateiname und beide Knöpfe sichtbar und bedienbar, kein seitliches Scrollen`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await scan('a.pdf', 10)
      await open(page)
      for (const loc of [nameField(page), invoiceBtn(page), scanBtn(page)]) {
        await loc.scrollIntoViewIfNeeded()
        await expect(loc).toBeVisible()
        const b = (await loc.boundingBox())!
        expect(b.x + b.width).toBeLessThanOrEqual(vp.width)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width)
    })
  }

  test('Die Meldung nach dem Ablegen verdeckt die Knöpfe nicht (QA BUG-2)', async ({ page }) => {
    await scan('a.pdf', 20)
    await scan('b.pdf', 10)
    await open(page)
    await nameField(page).fill('Brief')
    await scanBtn(page).click()
    const toast = page.getByText(/Abgelegt: /)
    await expect(toast).toBeVisible()
    await expect(selected(page)).toContainText('b.pdf')
    const t = (await toast.boundingBox())!
    for (const btn of [invoiceBtn(page), scanBtn(page)]) {
      await btn.scrollIntoViewIfNeeded()
      const b = (await btn.boundingBox())!
      const overlap = t.x < b.x + b.width && b.x < t.x + t.width && t.y < b.y + b.height && b.y < t.y + t.height
      expect(overlap).toBe(false)
    }
    // "Scan" is clickable while the message is still shown
    await expect(scanBtn(page)).toBeEnabled()
    await scanBtn(page).click({ timeout: 3000 })
    // b.pdf was filed too (under its proposed date name) → inbox empty
    await expect(page.getByRole('option')).toHaveCount(0)
    expect(await ls(path.join(inbox, 'Abgelegt'))).toHaveLength(2)
  })

  test('Desktop: Ablage-Bereich bleibt sichtbar, auch wenn die Felder scrollen', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-Layout')
    await page.setViewportSize({ width: 1440, height: 700 })
    await scan('a.pdf', 10)
    await open(page)
    const vh = 700
    const b = (await invoiceBtn(page).boundingBox())!
    expect(b.y + b.height).toBeLessThanOrEqual(vh)
  })

  test('Schnittstelle: Pfade, fremde Ziele und fremde Webseiten werden abgewiesen', async ({ page }) => {
    const a = await scan('a.pdf', 10)
    const post = (data: unknown, headers: Record<string, string> = {}) =>
      page.request.post('/api/filing', { data, headers: { origin: 'http://127.0.0.1:3100', ...headers } })
    for (const data of [
      { scan: 'a.pdf', target: 'rechnung', fileName: '..\\..\\x.pdf', year: 2026 },
      { scan: '..\\Finanzen\\a.pdf', target: 'scan', fileName: null },
      { scan: 'a.pdf', target: 'C:\\Windows', fileName: 'x.pdf', year: 2026 },
      { scan: 'a.pdf', target: 'rechnung', fileName: 'x.pdf', year: 99999 },
    ]) {
      expect((await post(data)).status(), JSON.stringify(data)).toBe(400)
    }
    expect((await post({ scan: 'a.pdf', target: 'scan', fileName: null }, { origin: 'https://evil.example' })).status()).toBe(403)
    expect((await page.request.post('/api/filing/undo', { data: { token: 'x' }, headers: { origin: 'http://127.0.0.1:3100' } })).status()).toBe(400)
    expect(await exists(a)).toBe(true)
  })
})
