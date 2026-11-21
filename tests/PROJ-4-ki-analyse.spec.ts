import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { expect, test, type Page } from '@playwright/test'
import { A4, makePdf } from './helpers/make-pdf'

// The E2E server runs WITHOUT API key (playwright.config.ts) – no real Claude calls, no costs.
// Flows with AI suggestions are covered by src/components/suggestions/suggestions-panel.test.tsx
// (UI) and src/app/api/analysis/analysis.test.ts (server, Claude mocked).
const QA_DATA_DIR = path.join(__dirname, '.qa-data')
const SETTINGS_FILE = path.join(QA_DATA_DIR, 'settings.json')

let tmp: string
let inbox: string

async function scan(name: string, ageMin: number) {
  const p = path.join(inbox, name)
  await fs.writeFile(p, makePdf([A4]))
  const t = new Date(Date.now() - ageMin * 60_000)
  await fs.utimes(p, t, t)
}

const panel = (page: Page, name: string) => page.getByLabel(`Vorschläge: ${name}`)
const fileName = (page: Page) => page.getByTestId('file-name-preview')

/** Load and wait until the page is interactive (WebKit hydrates later – typing before that is reset) */
async function open(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}

test.beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'scantool-e2e4-'))
  inbox = path.join(tmp, 'Eingang')
  await fs.mkdir(inbox)
  await fs.mkdir(path.join(tmp, 'Ablage'))
  await fs.mkdir(QA_DATA_DIR, { recursive: true })
  await fs.writeFile(
    SETTINGS_FILE,
    JSON.stringify({ inboxPath: inbox, archivePath: path.join(tmp, 'Ablage'), updatedAt: new Date().toISOString() })
  )
})

test.afterEach(async () => {
  await fs.rm(SETTINGS_FILE, { force: true })
  await fs.rm(path.join(QA_DATA_DIR, 'analyses.json'), { force: true })
  await fs.rm(tmp, { recursive: true, force: true })
})

test.describe('PROJ-4 ohne API-Schlüssel', () => {
  test('Keine Analyse, verständlicher Hinweis mit Link, Felder selbst ausfüllbar', async ({ page }) => {
    await scan('rechnung.pdf', 10)
    let analysisRequests = 0
    page.on('request', (r) => r.url().includes('/api/analysis') && analysisRequests++)
    await open(page)
    const p = panel(page, 'rechnung.pdf')
    await expect(p.getByText('KI-Analyse nicht verfügbar – API-Schlüssel in den Einstellungen hinterlegen.')).toBeVisible()
    await expect(p.getByRole('link', { name: 'Zu den Einstellungen' })).toHaveAttribute('href', '/einstellungen')
    await expect(p.getByRole('button', { name: 'Neu analysieren' })).toBeDisabled()
    for (const label of ['Datum', 'Rechnungsnummer', 'Lieferant', 'Beschreibung', 'Betrag', 'Währung', 'Garantie (Monate)']) {
      await expect(p.getByLabel(label, { exact: true })).toHaveValue('')
      await expect(p.getByLabel(label, { exact: true })).toBeEditable()
    }
    await page.waitForTimeout(500)
    expect(analysisRequests).toBe(0)
  })
})

test.describe('PROJ-4 Dateiname-Vorschau', () => {
  test('Bildet den Namen live aus den Feldern, inkl. _Garantie, Umlauten und Bereinigung', async ({ page }) => {
    await scan('rechnung.pdf', 10)
    await open(page)
    const p = panel(page, 'rechnung.pdf')
    await expect(fileName(page)).toHaveText('Datum fehlt · Lieferant fehlt · Beschreibung fehlt')
    await p.getByLabel('Datum', { exact: true }).fill('21.11.2026')
    await p.getByLabel('Lieferant', { exact: true }).fill('Müller & Söhne')
    await p.getByLabel('Beschreibung', { exact: true }).fill('Kühlschrank A/B_C')
    await expect(fileName(page)).toHaveText('261121_Müller-&-Söhne_Kühlschrank-A-B-C.pdf')

    await p.getByLabel('Dokumenttyp').click()
    await page.getByRole('option', { name: 'Garantieschein' }).click()
    await expect(fileName(page)).toHaveText('261121_Müller-&-Söhne_Kühlschrank-A-B-C_Garantie.pdf')

    await p.getByLabel('Datum', { exact: true }).fill('31.02.2026')
    await expect(fileName(page)).toHaveText('Datum ungültig')
  })

  test('Kürzt auf höchstens 100 Zeichen', async ({ page }) => {
    await scan('rechnung.pdf', 10)
    await open(page)
    const p = panel(page, 'rechnung.pdf')
    await p.getByLabel('Datum', { exact: true }).fill('01.02.2026')
    await p.getByLabel('Lieferant', { exact: true }).fill('Digitec')
    await p.getByLabel('Beschreibung', { exact: true }).fill('Sehr lange Beschreibung '.repeat(8))
    const name = (await fileName(page).innerText()).trim()
    expect(name.length).toBeLessThanOrEqual(100)
    expect(name).toMatch(/^260201_Digitec_Sehr-lange-Beschreibung.*\.pdf$/)
  })

  test('Eigene Eingaben bleiben beim Scan-Wechsel erhalten', async ({ page }) => {
    await scan('eins.pdf', 20)
    await scan('zwei.pdf', 10)
    await open(page)
    await panel(page, 'eins.pdf').getByLabel('Lieferant', { exact: true }).fill('Digitec')
    await page.getByRole('option').filter({ hasText: 'zwei.pdf' }).click()
    await expect(panel(page, 'zwei.pdf').getByLabel('Lieferant', { exact: true })).toHaveValue('')
    await page.getByRole('option').filter({ hasText: 'eins.pdf' }).click()
    await expect(panel(page, 'eins.pdf').getByLabel('Lieferant', { exact: true })).toHaveValue('Digitec')
  })
})

test.describe('PROJ-4 Darstellung', () => {
  test('Leerer Eingang → „Kein Scan ausgewählt" auch rechts', async ({ page }) => {
    await open(page)
    await expect(page.getByText('Kein Scan ausgewählt')).toHaveCount(2)
    await expect(page.getByLabel(/^Vorschläge:/)).toHaveCount(0)
  })

  test('Desktop: Vorschläge in der rechten Spalte', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-Layout')
    await page.setViewportSize({ width: 1440, height: 900 })
    await scan('rechnung.pdf', 10)
    await open(page)
    const preview = (await page.getByLabel('Vorschau: rechnung.pdf').boundingBox())!
    const right = (await panel(page, 'rechnung.pdf').boundingBox())!
    expect(right.x).toBeGreaterThan(preview.x + preview.width)
  })

  for (const vp of [
    { name: 'Mobile (375px)', width: 375, height: 800 },
    { name: 'Tablet (768px)', width: 768, height: 1000 },
  ]) {
    test(`${vp.name}: Felder unter der Vorschau, bedienbar, kein seitliches Scrollen`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await scan('rechnung.pdf', 10)
      await open(page)
      const preview = (await page.getByLabel('Vorschau: rechnung.pdf').boundingBox())!
      const right = (await panel(page, 'rechnung.pdf').boundingBox())!
      expect(right.y).toBeGreaterThan(preview.y + preview.height - 1)
      const lieferant = panel(page, 'rechnung.pdf').getByLabel('Lieferant', { exact: true })
      await lieferant.scrollIntoViewIfNeeded()
      await lieferant.fill('Digitec')
      await expect(lieferant).toHaveValue('Digitec')
      const box = (await lieferant.boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width)
    })
  }
})

test.describe('PROJ-4 Schnittstelle', () => {
  const post = (page: Page, data: unknown, headers: Record<string, string> = {}) =>
    page.request.post('/api/analysis', { data, headers: { origin: 'http://127.0.0.1:3100', ...headers } })

  test('Ohne Schlüssel 412 missing_key, ohne Kosten', async ({ page }) => {
    await scan('rechnung.pdf', 10)
    const res = await post(page, { name: 'rechnung.pdf' })
    expect(res.status()).toBe(412)
    expect(await res.json()).toEqual({ ok: false, code: 'missing_key' })
  })

  test('Pfade und fremde Dateien werden abgelehnt', async ({ page }) => {
    for (const name of ['..\\Ablage\\x.pdf', '../settings.json', 'C:\\Windows\\win.ini.pdf', '\\\\server\\x.pdf', 'a.pdf:ads.pdf', 'notiz.txt']) {
      expect((await post(page, { name })).status(), name).toBe(400)
    }
    expect((await post(page, 'kein json')).status()).toBe(400)
  })

  test('Fremde Webseiten werden abgewiesen', async ({ page }) => {
    await scan('rechnung.pdf', 10)
    expect((await post(page, { name: 'rechnung.pdf' }, { origin: 'https://evil.example' })).status()).toBe(403)
    expect((await post(page, { name: 'rechnung.pdf' }, { 'sec-fetch-site': 'cross-site' })).status()).toBe(403)
  })
})
