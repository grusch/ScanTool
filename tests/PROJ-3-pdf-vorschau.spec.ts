import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { expect, test, type Page } from '@playwright/test'
import { A4, A4_LANDSCAPE, BON, makePdf, type TestPage } from './helpers/make-pdf'

// Must match playwright.config.ts → isolated settings of the QA server
const QA_DATA_DIR = path.join(__dirname, '.qa-data')
const SETTINGS_FILE = path.join(QA_DATA_DIR, 'settings.json')
const MIN = 60_000

let tmp: string
let inbox: string
let archive: string

async function writeSettings(inboxPath: string, archivePath: string) {
  await fs.mkdir(QA_DATA_DIR, { recursive: true })
  await fs.writeFile(SETTINGS_FILE, JSON.stringify({ inboxPath, archivePath, updatedAt: new Date().toISOString() }))
}

/** Writes a finished scan; older scans come first in the list */
async function scan(name: string, content: Buffer | TestPage[], ageMin: number) {
  const p = path.join(inbox, name)
  await fs.writeFile(p, Buffer.isBuffer(content) ? content : makePdf(content))
  const t = new Date(Date.now() - ageMin * MIN)
  await fs.utimes(p, t, t)
  return p
}

const toolbar = (page: Page) => page.getByRole('toolbar', { name: 'Vorschau-Werkzeuge' })
const scroller = (page: Page) => page.getByTestId('preview-scroll')
const pages = (page: Page) => page.getByTestId('preview-page')
const canvasOf = (page: Page, n: number) => page.locator(`[data-testid="preview-page"][data-page="${n}"] canvas`)
const zoomValue = (page: Page) => toolbar(page).getByLabel('Zoom')
const btn = (page: Page, name: string) => toolbar(page).getByRole('button', { name, exact: true })
const option = (page: Page, name: string) => page.getByRole('option').filter({ hasText: name })

async function openAndWait(page: Page) {
  await page.goto('/')
  await expect(canvasOf(page, 1)).toBeVisible({ timeout: 15_000 })
}

/** Where the dark pixels of a drawn page are (0..1) – the black bar marks the page's top edge */
async function darkCentroid(page: Page, n: number) {
  await expect(canvasOf(page, n)).toBeVisible()
  // Give the canvas a moment to finish drawing after a re-render
  await page.waitForTimeout(400)
  return canvasOf(page, n).evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height)
    let sx = 0
    let sy = 0
    let count = 0
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4
        if (data[i] < 80 && data[i + 1] < 80 && data[i + 2] < 80 && data[i + 3] > 200) {
          sx += x
          sy += y
          count++
        }
      }
    }
    return { x: sx / count / width, y: sy / count / height, w: width, h: height }
  })
}

async function pageBox(page: Page, n: number) {
  return (await page.locator(`[data-testid="preview-page"][data-page="${n}"]`).boundingBox())!
}

test.beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'scantool-e2e3-'))
  inbox = path.join(tmp, 'Eingang')
  archive = path.join(tmp, 'Ablage')
  await fs.mkdir(inbox)
  await fs.mkdir(archive)
  await writeSettings(inbox, archive)
})

test.afterEach(async () => {
  await fs.rm(SETTINGS_FILE, { force: true })
  await fs.rm(tmp, { recursive: true, force: true })
})

test.describe('PROJ-3 Anzeige', () => {
  test('AC1: Der ausgewählte Scan erscheint in der mittleren Spalte', async ({ page }) => {
    await scan('rechnung.pdf', [A4], 10)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await openAndWait(page)
    await expect(page.getByLabel('Vorschau: rechnung.pdf')).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 1')
    expect(errors).toEqual([])
  })

  test('AC2: Auswahlwechsel (Klick und ↓) zeigt den neuen Scan', async ({ page }) => {
    await scan('eins.pdf', [A4], 30)
    await scan('drei.pdf', [A4, A4, A4], 20)
    await scan('zwei.pdf', [A4, A4], 10)
    await openAndWait(page)
    await expect(toolbar(page)).toContainText('Seite 1 von 1')
    await option(page, 'zwei.pdf').click()
    await expect(page.getByLabel('Vorschau: zwei.pdf')).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 2')
    await option(page, 'eins.pdf').click()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByLabel('Vorschau: drei.pdf')).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 3')
  })

  test('AC3: Mehrseitige Scans stehen untereinander', async ({ page }) => {
    await scan('mehr.pdf', [A4, A4, A4], 10)
    await openAndWait(page)
    await expect(pages(page)).toHaveCount(3)
    const [a, b, c] = [await pageBox(page, 1), await pageBox(page, 2), await pageBox(page, 3)]
    expect(b.y).toBeGreaterThan(a.y + a.height - 1)
    expect(c.y).toBeGreaterThan(b.y + b.height - 1)
    expect(Math.abs(a.x - b.x)).toBeLessThan(2)
  })

  test('AC4: Beim Scrollen zeigt der Zähler die aktuelle Seite', async ({ page }) => {
    await scan('mehr.pdf', [A4, A4, A4], 10)
    await openAndWait(page)
    await expect(toolbar(page)).toContainText('Seite 1 von 3')
    await scroller(page).evaluate((el) => (el.scrollTop = el.scrollHeight))
    await expect(toolbar(page)).toContainText('Seite 3 von 3')
    await scroller(page).evaluate((el) => {
      const p2 = el.querySelector('[data-page="2"]') as HTMLElement
      el.scrollTop = p2.offsetTop
    })
    await expect(toolbar(page)).toContainText('Seite 2 von 3')
  })

  test('AC5: Nächste/vorherige Seite springt, an den Enden deaktiviert', async ({ page }) => {
    await scan('mehr.pdf', [A4, A4, A4], 10)
    await openAndWait(page)
    await expect(btn(page, 'Vorherige Seite')).toBeDisabled()
    await btn(page, 'Nächste Seite').click()
    await expect(toolbar(page)).toContainText('Seite 2 von 3')
    await btn(page, 'Nächste Seite').click()
    await expect(toolbar(page)).toContainText('Seite 3 von 3')
    await expect(btn(page, 'Nächste Seite')).toBeDisabled()
    await btn(page, 'Vorherige Seite').click()
    await expect(toolbar(page)).toContainText('Seite 2 von 3')
  })

  test('AC6: Leerer Eingang → „Kein Scan ausgewählt"', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Kein Scan ausgewählt')).toBeVisible()
    await expect(page.getByTestId('preview-scroll')).toHaveCount(0)
  })
})

test.describe('PROJ-3 Zoom', () => {
  test('AC7: Start mit „Breite anpassen" – Seitenbreite = Spaltenbreite, kein seitliches Scrollen', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    await expect(btn(page, 'Breite anpassen')).toHaveAttribute('aria-pressed', 'true')
    const inner = await scroller(page).evaluate((el) => ({ cw: el.clientWidth, sw: el.scrollWidth }))
    const box = await pageBox(page, 1)
    expect(Math.abs(box.width - (inner.cw - 32))).toBeLessThan(3)
    expect(inner.sw).toBeLessThanOrEqual(inner.cw)
  })

  test('AC8: „+"/„−" zoomen stufenweise 50–300 % und sind an den Grenzen deaktiviert', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    const start = parseInt(await zoomValue(page).innerText())
    await btn(page, 'Vergrössern').click()
    const next = parseInt(await zoomValue(page).innerText())
    expect([50, 75, 100, 125, 150, 200, 250, 300]).toContain(next)
    expect(next).toBeGreaterThan(start)
    for (let i = 0; i < 10 && (await btn(page, 'Vergrössern').isEnabled()); i++) await btn(page, 'Vergrössern').click()
    await expect(zoomValue(page)).toHaveText('300 %')
    await expect(btn(page, 'Vergrössern')).toBeDisabled()
    for (let i = 0; i < 10 && (await btn(page, 'Verkleinern').isEnabled()); i++) await btn(page, 'Verkleinern').click()
    await expect(zoomValue(page)).toHaveText('50 %')
    await expect(btn(page, 'Verkleinern')).toBeDisabled()
  })

  test('AC9: „Ganze Seite" passt die Seite vollständig ein', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    await btn(page, 'Ganze Seite').click()
    await expect(btn(page, 'Ganze Seite')).toHaveAttribute('aria-pressed', 'true')
    const view = await scroller(page).evaluate((el) => ({ w: el.clientWidth, h: el.clientHeight }))
    const box = await pageBox(page, 1)
    expect(box.height).toBeLessThanOrEqual(view.h - 32 + 1)
    expect(box.width).toBeLessThanOrEqual(view.w - 32 + 1)
  })

  test('AC10: „Breite anpassen" stellt nach dem Zoomen wieder auf Spaltenbreite', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    const fit = (await pageBox(page, 1)).width
    await btn(page, 'Vergrössern').click()
    await btn(page, 'Vergrössern').click()
    expect((await pageBox(page, 1)).width).toBeGreaterThan(fit + 10)
    await btn(page, 'Breite anpassen').click()
    expect(Math.abs((await pageBox(page, 1)).width - fit)).toBeLessThan(2)
  })

  test('AC11: Strg + Mausrad über der Vorschau zoomt die Vorschau', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Kein Mausrad auf dem Handy')
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    const before = parseInt(await zoomValue(page).innerText())
    const box = (await scroller(page).boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -120)
    await page.keyboard.up('Control')
    await expect.poll(async () => parseInt(await zoomValue(page).innerText())).toBeGreaterThan(before)
    // Only the preview zoomed – the rest of the page keeps its size
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1)
  })

  test('AC12: Zoom und Drehung starten beim Scan-Wechsel neu', async ({ page }) => {
    await scan('eins.pdf', [A4], 20)
    await scan('zwei.pdf', [A4], 10)
    await openAndWait(page)
    const fitPercent = await zoomValue(page).innerText()
    await btn(page, 'Vergrössern').click()
    await btn(page, '90° rechts drehen').click()
    await option(page, 'zwei.pdf').click()
    await expect(page.getByLabel('Vorschau: zwei.pdf')).toBeVisible()
    await expect(canvasOf(page, 1)).toBeVisible()
    await expect(btn(page, 'Breite anpassen')).toHaveAttribute('aria-pressed', 'true')
    await expect(zoomValue(page)).toHaveText(fitPercent)
    const box = await pageBox(page, 1)
    expect(box.height).toBeGreaterThan(box.width) // portrait again = not rotated
  })
})

test.describe('PROJ-3 Drehen', () => {
  test('AC13: „90° links" dreht gegen den Uhrzeigersinn', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    expect((await darkCentroid(page, 1)).y).toBeLessThan(0.3) // bar at the top
    await btn(page, '90° links drehen').click()
    const c = await darkCentroid(page, 1)
    expect(c.w).toBeGreaterThan(c.h) // landscape now
    expect(c.x).toBeLessThan(0.3) // former top edge is now on the left
  })

  test('AC14: „90° rechts" dreht im Uhrzeigersinn', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    await btn(page, '90° rechts drehen').click()
    const c = await darkCentroid(page, 1)
    expect(c.w).toBeGreaterThan(c.h)
    expect(c.x).toBeGreaterThan(0.7) // former top edge is now on the right
  })

  test('AC15: „180°" stellt die Seite auf den Kopf', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    await btn(page, '180° drehen').click()
    const c = await darkCentroid(page, 1)
    expect(c.h).toBeGreaterThan(c.w)
    expect(c.y).toBeGreaterThan(0.7) // bar now at the bottom
  })

  test('AC16: Drehungen addieren sich (rechts + links = Ausgangslage, 180° zweimal = Ausgangslage)', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    await btn(page, '90° rechts drehen').click()
    await btn(page, '90° links drehen').click()
    expect((await darkCentroid(page, 1)).y).toBeLessThan(0.3)
    await btn(page, '180° drehen').click()
    await btn(page, '180° drehen').click()
    expect((await darkCentroid(page, 1)).y).toBeLessThan(0.3)
    await btn(page, '90° rechts drehen').click()
    await btn(page, '180° drehen').click()
    expect((await darkCentroid(page, 1)).x).toBeLessThan(0.3) // = 270° = 90° links
  })

  test('AC17: Drehen verändert die Datei nicht', async ({ page }) => {
    const p = await scan('a4.pdf', [A4, A4], 10)
    const hash = async () => createHash('sha256').update(await fs.readFile(p)).digest('hex')
    const before = await hash()
    const mtime = (await fs.stat(p)).mtimeMs
    await openAndWait(page)
    await btn(page, '90° rechts drehen').click()
    await btn(page, '180° drehen').click()
    await btn(page, 'Vergrössern').click()
    expect(await hash()).toBe(before)
    expect((await fs.stat(p)).mtimeMs).toBe(mtime)
  })
})

test.describe('PROJ-3 In neuem Tab öffnen', () => {
  test('AC18: Link öffnet den Scan als PDF in einem neuen Tab', async ({ page }) => {
    await scan('Rechnung Müller & Co #3.pdf', [A4], 10)
    await openAndWait(page)
    const link = toolbar(page).getByRole('link', { name: 'In neuem Tab öffnen' })
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    const href = (await link.getAttribute('href'))!
    const res = await page.request.get(href, { headers: { 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'navigate' } })
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toBe('application/pdf')
    expect(res.headers()['content-disposition']).toMatch(/^inline;/)
    expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-')
  })
})

test.describe('PROJ-3 Laden & Leistung', () => {
  test('AC19: Während des Ladens erscheint ein Platzhalter in Seitenform', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await page.route('**/api/inbox/file?**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.continue()
    })
    await page.goto('/')
    await expect(page.getByRole('status', { name: 'Scan wird geladen' })).toBeVisible()
    await expect(canvasOf(page, 1)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('status', { name: 'Scan wird geladen' })).toHaveCount(0)
  })

  test('AC20: Üblicher Scan (3 Seiten) – erste Seite ≤ 2 s nach Auswahl', async ({ page }) => {
    await scan('eins.pdf', [A4], 20)
    await scan('drei.pdf', [A4, A4, A4], 10)
    await openAndWait(page)
    const t0 = Date.now()
    await option(page, 'drei.pdf').click()
    await expect(page.getByLabel('Vorschau: drei.pdf')).toBeVisible()
    await expect(canvasOf(page, 1)).toBeVisible()
    expect(Date.now() - t0).toBeLessThan(2_000)
  })

  test('AC21: Grosser Scan (30 Seiten) – erste Seiten zuerst, Rest beim Scrollen', async ({ page }) => {
    await scan('gross.pdf', Array(30).fill(A4), 10)
    await openAndWait(page)
    await expect(pages(page)).toHaveCount(30)
    await expect(toolbar(page)).toContainText('Seite 1 von 30')
    expect(await page.locator('[data-testid="preview-page"] canvas').count()).toBeLessThan(8)
    await expect(canvasOf(page, 30)).toHaveCount(0)
    await scroller(page).evaluate((el) => (el.scrollTop = el.scrollHeight))
    await expect(canvasOf(page, 30)).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 30 von 30')
  })

  test('AC22: Schneller Wechsel – nur der zuletzt gewählte Scan wird angezeigt', async ({ page }) => {
    await scan('eins.pdf', [A4], 40)
    await scan('langsam.pdf', [A4, A4, A4, A4, A4], 30)
    await scan('ziel.pdf', [A4, A4], 20)
    await page.route('**/api/inbox/file?name=langsam.pdf', async (route) => {
      await new Promise((r) => setTimeout(r, 2000))
      await route.continue()
    })
    await openAndWait(page)
    await page.getByRole('listbox', { name: 'Scans im Eingang' }).focus()
    await page.keyboard.press('ArrowDown') // langsam.pdf (slow)
    await page.keyboard.press('ArrowDown') // ziel.pdf
    await expect(page.getByLabel('Vorschau: ziel.pdf')).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 2')
    await page.waitForTimeout(2500) // slow response arrives meanwhile
    await expect(page.getByLabel('Vorschau: ziel.pdf')).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 2')
  })
})

test.describe('PROJ-3 Fehlerfälle', () => {
  test('AC23: Beschädigte Datei → Meldung + „In neuem Tab öffnen", Auswahl bleibt', async ({ page }) => {
    await scan('kaputt.pdf', Buffer.from('das ist kein pdf'), 10)
    await page.goto('/')
    await expect(page.getByText('Dieser Scan lässt sich nicht anzeigen – die Datei ist beschädigt oder kein gültiges PDF.')).toBeVisible()
    await expect(page.getByRole('alert').getByRole('link', { name: 'In neuem Tab öffnen' })).toBeVisible()
    await expect(option(page, 'kaputt.pdf')).toHaveAttribute('aria-selected', 'true')
  })

  test('AC24: Passwortgeschütztes PDF → Meldung, keine Passwortabfrage', async ({ page }) => {
    await scan('geschuetzt.pdf', makePdf([A4], { passwordProtected: true }), 10)
    let dialog = false
    page.on('dialog', async (d) => {
      dialog = true
      await d.dismiss()
    })
    await page.goto('/')
    await expect(page.getByText('Dieser Scan ist passwortgeschützt und kann nicht angezeigt werden.')).toBeVisible()
    expect(dialog).toBe(false)
  })

  test('AC25: Gelöschter Scan → Liste aktualisiert, Auswahl springt weiter', async ({ page }) => {
    await scan('eins.pdf', [A4], 30)
    await scan('weg.pdf', [A4, A4], 20)
    await scan('drei.pdf', [A4, A4, A4], 10)
    await openAndWait(page)
    await fs.rm(path.join(inbox, 'weg.pdf'))
    await option(page, 'weg.pdf').click()
    // List refreshes at once (no 30-s wait) and the selection moves to the next scan
    await expect(page.getByRole('option')).toHaveCount(2, { timeout: 5_000 })
    await expect(page.getByLabel('Vorschau: drei.pdf')).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 3')
  })

  test('AC26: NAS nicht erreichbar → Meldung + „Erneut versuchen" lädt neu', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    let fail = true
    await page.route('**/api/inbox/file?**', (route) =>
      fail
        ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'unreachable' }) })
        : route.continue()
    )
    await page.goto('/')
    await expect(page.getByText('Eingangsordner nicht erreichbar – ist die NAS eingeschaltet?')).toBeVisible()
    fail = false
    await page.getByRole('button', { name: 'Erneut versuchen' }).click()
    await expect(canvasOf(page, 1)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('PROJ-3 Darstellung', () => {
  test('AC27: Breites Fenster – Vorschau in der mittleren von drei Spalten', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-Layout')
    await page.setViewportSize({ width: 1440, height: 900 })
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    const list = (await page.getByRole('listbox', { name: 'Scans im Eingang' }).boundingBox())!
    const preview = (await page.getByLabel('Vorschau: a4.pdf').boundingBox())!
    const right = (await page.getByText('Vorschläge', { exact: true }).boundingBox())!
    expect(preview.x).toBeGreaterThan(list.x + list.width)
    expect(right.x).toBeGreaterThan(preview.x + preview.width)
    expect(Math.abs(preview.y - list.y)).toBeLessThan(80)
  })

  for (const vp of [
    { name: 'Mobile (375px)', width: 375, height: 800 },
    { name: 'Tablet (768px)', width: 768, height: 1000 },
  ]) {
    test(`AC28: ${vp.name} – Vorschau unter der Liste, ~70 % hoch, Bedienleiste erreichbar, kein seitliches Scrollen`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await scan('a4.pdf', [A4, A4], 10)
      await openAndWait(page)
      const list = (await page.getByRole('listbox', { name: 'Scans im Eingang' }).boundingBox())!
      const preview = (await page.getByLabel('Vorschau: a4.pdf').boundingBox())!
      expect(preview.y).toBeGreaterThan(list.y + list.height - 1)
      expect(preview.height).toBeGreaterThan(vp.height * 0.6)
      expect(preview.height).toBeLessThan(vp.height * 0.8)
      for (const name of ['Nächste Seite', 'Vergrössern', 'Ganze Seite', '90° rechts drehen', '180° drehen']) {
        const b = (await btn(page, name).boundingBox())!
        expect(b.x + b.width, name).toBeLessThanOrEqual(vp.width)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vp.width)
    })
  }
})

test.describe('PROJ-3 Edge Cases', () => {
  test('EC: Querformat-Seite wird bei „Breite anpassen" auf Spaltenbreite eingepasst', async ({ page }) => {
    await scan('quer.pdf', [A4_LANDSCAPE], 10)
    await openAndWait(page)
    const cw = await scroller(page).evaluate((el) => el.clientWidth)
    const box = await pageBox(page, 1)
    expect(box.width).toBeGreaterThan(box.height)
    expect(Math.abs(box.width - (cw - 32))).toBeLessThan(3)
  })

  test('EC: Gemischte Seitengrössen behalten ihre Proportion, Zähler stimmt', async ({ page }) => {
    await scan('mix.pdf', [A4, BON], 10)
    await openAndWait(page)
    await expect(toolbar(page)).toContainText('Seite 1 von 2')
    const a = await pageBox(page, 1)
    const b = await pageBox(page, 2)
    expect(a.height / a.width).toBeCloseTo(842 / 595, 1)
    expect(b.height / b.width).toBeCloseTo(600 / 226, 1)
  })

  test('EC: Einseitiger Scan – „Seite 1 von 1", Blätterknöpfe deaktiviert', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    await openAndWait(page)
    await expect(toolbar(page)).toContainText('Seite 1 von 1')
    await expect(btn(page, 'Vorherige Seite')).toBeDisabled()
    await expect(btn(page, 'Nächste Seite')).toBeDisabled()
  })

  test('EC: Umbenanntes JPG mit Endung .pdf → „beschädigt oder kein gültiges PDF"', async ({ page }) => {
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, ...Array(200).fill(0)])
    await scan('foto.pdf', jpg, 10)
    await page.goto('/')
    await expect(page.getByText(/beschädigt oder kein gültiges PDF/)).toBeVisible()
  })

  test('EC: Dateiname mit Sonderzeichen wird angezeigt und geladen', async ({ page }) => {
    const name = 'Rechnung Müller & Söhne #12 50%.pdf'
    await scan(name, [A4, A4], 10)
    await openAndWait(page)
    await expect(page.getByLabel(`Vorschau: ${name}`)).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 2')
  })

  test('EC: Gleichen Scan erneut wählen lädt nicht neu, Zoom bleibt', async ({ page }) => {
    await scan('a4.pdf', [A4], 10)
    let requests = 0
    page.on('request', (r) => r.url().includes('/api/inbox/file') && requests++)
    await openAndWait(page)
    await btn(page, 'Vergrössern').click()
    const zoom = await zoomValue(page).innerText()
    await option(page, 'a4.pdf').click()
    await page.getByRole('button', { name: 'Liste aktualisieren' }).click()
    await page.waitForTimeout(800)
    expect(requests).toBe(1)
    await expect(zoomValue(page)).toHaveText(zoom)
  })

  test('EC: Im Hintergrund ersetzte Datei zeigt beim nächsten Auswählen den neuen Inhalt', async ({ page }) => {
    const p = await scan('ersetzt.pdf', [A4], 20)
    await scan('anderer.pdf', [A4], 10)
    await openAndWait(page)
    await expect(toolbar(page)).toContainText('Seite 1 von 1')
    await fs.writeFile(p, makePdf([A4, A4, A4]))
    const t = new Date(Date.now() - 20 * MIN)
    await fs.utimes(p, t, t)
    await option(page, 'anderer.pdf').click()
    await expect(page.getByLabel('Vorschau: anderer.pdf')).toBeVisible()
    await option(page, 'ersetzt.pdf').click()
    await expect(page.getByLabel('Vorschau: ersetzt.pdf')).toBeVisible()
    await expect(toolbar(page)).toContainText('Seite 1 von 3')
  })

  test('EC: Server meldet „nicht mehr da", Scan bleibt aber in der Liste → Vorschau lädt bei Aktualisierung neu', async ({ page }) => {
    // Situation of the user report: tab was open before the backend existed / short hiccup
    await scan('a4.pdf', [A4], 10)
    let missing = true
    await page.route('**/api/inbox/file?**', (route) =>
      missing
        ? route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'not_found' }) })
        : route.continue()
    )
    await page.goto('/')
    await expect(page.getByText('Der Scan ist nicht mehr im Eingang.')).toBeVisible()
    missing = false
    await page.getByRole('button', { name: 'Liste aktualisieren' }).click()
    await expect(canvasOf(page, 1)).toBeVisible({ timeout: 10_000 })
  })
})
