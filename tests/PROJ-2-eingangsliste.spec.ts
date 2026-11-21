import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { expect, test, type Page } from '@playwright/test'

// Must match playwright.config.ts → isolated settings of the QA server
const QA_DATA_DIR = path.join(__dirname, '.qa-data')
const SETTINGS_FILE = path.join(QA_DATA_DIR, 'settings.json')
const MIN = 60_000
const DAY = 24 * 60 * MIN

let tmp: string
let inbox: string
let archive: string

async function writeSettings(inboxPath: string, archivePath: string) {
  await fs.mkdir(QA_DATA_DIR, { recursive: true })
  await fs.writeFile(SETTINGS_FILE, JSON.stringify({ inboxPath, archivePath, updatedAt: new Date().toISOString() }))
}

/** Creates a finished scan whose modification time lies `ageMs` in the past */
async function scan(name: string, ageMs: number, bytes = 2048) {
  const p = path.join(inbox, name)
  await fs.writeFile(p, Buffer.alloc(bytes))
  const t = new Date(Date.now() - ageMs)
  await fs.utimes(p, t, t)
}

const list = (page: Page) => page.getByRole('listbox', { name: 'Scans im Eingang' })
const options = (page: Page) => page.getByRole('option')
const selectedOption = (page: Page) => page.locator('[role="option"][aria-selected="true"]')
const names = (page: Page) => options(page).locator('p.truncate').allInnerTexts()
const refreshButton = (page: Page) => page.getByRole('button', { name: 'Liste aktualisieren' })

test.beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'scantool-e2e2-'))
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

test.describe('PROJ-2 Liste & Inhalt', () => {
  test('AC1: Scans werden mit Name, Datum/Uhrzeit und Grösse angezeigt', async ({ page }) => {
    await scan('Scan_001.pdf', 10 * MIN, 250 * 1024)
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await page.goto('/')
    await expect(options(page)).toHaveCount(1)
    await expect(options(page).first()).toContainText('Scan_001.pdf')
    await expect(options(page).first()).toContainText('250 KB')
    await expect(options(page).first()).toContainText(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/)
    expect(errors, 'no hydration or console errors').toEqual([])
  })

  test('AC2: Sortierung – ältester Scan zuerst', async ({ page }) => {
    await scan('mitte.pdf', 2 * DAY)
    await scan('neuester.pdf', 1 * MIN)
    await scan('aeltester.pdf', 3 * DAY)
    await page.goto('/')
    expect(await names(page)).toEqual(['aeltester.pdf', 'mitte.pdf', 'neuester.pdf'])
  })

  test('AC3: Scans älter als 7 Tage zeigen „seit X Tagen"', async ({ page }) => {
    await scan('alt.pdf', 9 * DAY + MIN)
    await scan('frisch.pdf', 6 * DAY)
    await page.goto('/')
    await expect(options(page).filter({ hasText: 'alt.pdf' })).toContainText('seit 9 Tagen')
    await expect(options(page).filter({ hasText: 'frisch.pdf' })).not.toContainText('seit')
  })

  test('AC4: Anzahl im Listenkopf', async ({ page }) => {
    await scan('a.pdf', 3 * MIN)
    await scan('b.pdf', 2 * MIN)
    await scan('c.pdf', 1 * MIN)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Eingang (3)' })).toBeVisible()
  })

  test('AC5+AC6: Unterordner, andere Typen, versteckte/temporäre Dateien werden ignoriert; .PDF zählt', async ({ page }) => {
    await scan('ok.pdf', 2 * MIN)
    await scan('GROSS.PDF', MIN)
    await scan('foto.jpg', MIN)
    await scan('~$lock.pdf', MIN)
    await scan('.versteckt.pdf', MIN)
    await scan('upload.pdf.part', MIN)
    await fs.mkdir(path.join(inbox, 'Ordner.pdf'))
    await page.goto('/')
    expect(await names(page)).toEqual(['ok.pdf', 'GROSS.PDF'])
  })
})

test.describe('PROJ-2 Leerer Eingang', () => {
  test('AC7: Leerer Eingang zeigt Erfolgsmeldung und Pfad', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Keine neuen Scans – alles abgelegt 🎉')).toBeVisible()
    await expect(page.getByText(inbox, { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Eingang (0)' })).toBeVisible()
  })
})

test.describe('PROJ-2 Auswahl', () => {
  test.beforeEach(async () => {
    await scan('1.pdf', 3 * MIN)
    await scan('2.pdf', 2 * MIN)
    await scan('3.pdf', 1 * MIN)
  })

  test('AC8: Ältester Scan ist beim Öffnen ausgewählt', async ({ page }) => {
    await page.goto('/')
    await expect(selectedOption(page)).toContainText('1.pdf')
  })

  test('AC9: Klick wählt einen anderen Scan', async ({ page }) => {
    await page.goto('/')
    await options(page).filter({ hasText: '3.pdf' }).click()
    await expect(selectedOption(page)).toContainText('3.pdf')
  })

  test('AC10: Pfeiltasten wechseln die Auswahl, an den Enden bleibt sie stehen', async ({ page }) => {
    await page.goto('/')
    await options(page).filter({ hasText: '1.pdf' }).click() // click also focuses the list
    await page.keyboard.press('ArrowUp')
    await expect(selectedOption(page)).toContainText('1.pdf')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(selectedOption(page)).toContainText('3.pdf')
    await page.keyboard.press('ArrowDown')
    await expect(selectedOption(page)).toContainText('3.pdf')
    await page.keyboard.press('ArrowUp')
    await expect(selectedOption(page)).toContainText('2.pdf')
  })

  test('AC11: Verschwindet der ausgewählte Scan, wird der nächste gewählt – beim letzten der vorherige', async ({ page }) => {
    await page.goto('/')
    await options(page).filter({ hasText: '2.pdf' }).click()
    await fs.rm(path.join(inbox, '2.pdf'))
    await refreshButton(page).click()
    await expect(selectedOption(page)).toContainText('3.pdf')

    await fs.rm(path.join(inbox, '3.pdf'))
    await refreshButton(page).click()
    await expect(selectedOption(page)).toContainText('1.pdf')

    await fs.rm(path.join(inbox, '1.pdf'))
    await refreshButton(page).click()
    await expect(page.getByText('Keine neuen Scans – alles abgelegt 🎉')).toBeVisible()
  })

  test('AC12: Auswahl bleibt bei Aktualisierung mit neuen Scans erhalten', async ({ page }) => {
    await page.goto('/')
    await options(page).filter({ hasText: '2.pdf' }).click()
    await scan('0-alt-aber-neu-im-ordner.pdf', 10 * DAY)
    await scan('4.pdf', 10_000)
    await refreshButton(page).click()
    await expect(options(page)).toHaveCount(5)
    await expect(selectedOption(page)).toContainText('2.pdf')
  })
})

test.describe('PROJ-2 Aktualisierung', () => {
  test('AC13+AC14: Automatische Aktualisierung nach 30 s, neuer Scan mit „neu"', async ({ page }) => {
    await scan('alt.pdf', 10 * MIN)
    await page.clock.install()
    await page.goto('/')
    await expect(options(page)).toHaveCount(1)
    // The list is server-rendered – wait until the client code (and its timer) is active
    await page.waitForLoadState('networkidle')
    await scan('neu-gescannt.pdf', 10_000)
    const req = page.waitForRequest('**/api/inbox')
    await page.clock.runFor(30_000)
    await req
    const fresh = options(page).filter({ hasText: 'neu-gescannt.pdf' })
    await expect(fresh).toBeVisible()
    await expect(fresh.getByText('neu', { exact: true })).toBeVisible()
    // Selecting it removes the marker
    await fresh.click()
    await expect(fresh.getByText('neu', { exact: true })).toHaveCount(0)
  })

  test('AC15: „Aktualisieren" zeigt Ladezustand', async ({ page }) => {
    await scan('a.pdf', 10 * MIN)
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    await page.goto('/')
    await page.route('**/api/inbox', async (route) => {
      await gate
      await route.continue()
    })
    await refreshButton(page).click()
    await expect(refreshButton(page)).toBeDisabled()
    release()
    await expect(refreshButton(page)).toBeEnabled()
  })

  test('AC16: Im Hintergrund keine Aktualisierung, beim Zurückkehren sofort', async ({ page }) => {
    await scan('a.pdf', 10 * MIN)
    await page.clock.install()
    await page.goto('/')
    await expect(options(page)).toHaveCount(1)
    await page.waitForLoadState('networkidle')
    let calls = 0
    page.on('request', (r) => r.url().endsWith('/api/inbox') && calls++)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.clock.runFor(90_000)
    expect(calls).toBe(0)
    const req = page.waitForRequest('**/api/inbox')
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await req
    expect(calls).toBe(1)
  })
})

test.describe('PROJ-2 Dateien im Schreibvorgang', () => {
  test('AC17: Datei erscheint erst, wenn sie 5 s unverändert ist', async ({ page }) => {
    await scan('fertig.pdf', 10 * MIN)
    await page.goto('/')
    await fs.writeFile(path.join(inbox, 'laeuft.pdf'), Buffer.alloc(1024))
    await refreshButton(page).click()
    await expect(refreshButton(page)).toBeEnabled()
    expect(await names(page)).toEqual(['fertig.pdf'])
    await page.waitForTimeout(5_500)
    await refreshButton(page).click()
    await expect(options(page).filter({ hasText: 'laeuft.pdf' })).toBeVisible()
  })
})

test.describe('PROJ-2 Fehlerfälle', () => {
  test('AC18–AC20: Ordner weg → letzter Stand ausgegraut mit Hinweis, keine Umleitung; danach Erholung', async ({ page }) => {
    await scan('a.pdf', 10 * MIN)
    await page.goto('/')
    await expect(options(page)).toHaveCount(1)
    const moved = inbox + '-weg'
    await fs.rename(inbox, moved)
    await refreshButton(page).click()
    await expect(page.getByText(/Ordner nicht gefunden – letzter Stand von \d{2}:\d{2}\. Neuer Versuch läuft automatisch\./)).toBeVisible()
    await expect(options(page)).toHaveCount(1)
    await expect(list(page)).toHaveClass(/opacity-60/)
    await expect(page).toHaveURL(/127\.0\.0\.1:3100\/$/)

    await fs.rename(moved, inbox)
    await refreshButton(page).click()
    await expect(page.getByText(/letzter Stand von/)).toHaveCount(0)
    await expect(list(page)).not.toHaveClass(/opacity-60/)
  })

  test('AC18: NAS nicht erreichbar → Hinweis „Eingangsordner nicht erreichbar"', async ({ page }) => {
    await scan('a.pdf', 10 * MIN)
    await page.goto('/')
    await page.route('**/api/inbox', (route) =>
      route.fulfill({ json: { folder: inbox, status: 'unreachable', checkedAt: new Date().toISOString(), files: [] } })
    )
    await refreshButton(page).click()
    await expect(page.getByText(/Eingangsordner nicht erreichbar – letzter Stand von \d{2}:\d{2}/)).toBeVisible()
    await expect(options(page)).toHaveCount(1)
  })

  test('AC21: Lokaler Server antwortet nicht → verständlicher Hinweis, letzter Stand bleibt', async ({ page }) => {
    await scan('a.pdf', 10 * MIN)
    await page.goto('/')
    await page.route('**/api/inbox', (route) => route.abort('connectionrefused'))
    await refreshButton(page).click()
    await expect(page.getByText(/Liste konnte nicht aktualisiert werden – letzter Stand von/)).toBeVisible()
    await expect(options(page)).toHaveCount(1)
  })
})

test.describe('PROJ-2 Edge Cases', () => {
  test('EC: 200+ Scans – Liste scrollbar, Pfeiltaste hält Auswahl sichtbar', async ({ page }) => {
    for (let i = 0; i < 210; i++) await scan(`scan-${String(i).padStart(3, '0')}.pdf`, (300 - i) * MIN, 10)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Eingang (210)' })).toBeVisible()
    await options(page).first().click()
    for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowDown')
    await expect(selectedOption(page)).toContainText('scan-040.pdf')
    await expect(selectedOption(page)).toBeInViewport()
  })

  test('EC: Gleicher Zeitstempel → stabile Reihenfolge nach Name', async ({ page }) => {
    const t = new Date(Date.now() - 10 * MIN)
    for (const n of ['c.pdf', 'a.pdf', 'b.pdf']) {
      await fs.writeFile(path.join(inbox, n), 'x')
      await fs.utimes(path.join(inbox, n), t, t)
    }
    await page.goto('/')
    expect(await names(page)).toEqual(['a.pdf', 'b.pdf', 'c.pdf'])
    await refreshButton(page).click()
    await expect(refreshButton(page)).toBeEnabled()
    expect(await names(page)).toEqual(['a.pdf', 'b.pdf', 'c.pdf'])
  })

  test('EC: Umbenannte Datei erscheint als neuer Eintrag, Auswahl rückt nach', async ({ page }) => {
    await scan('a.pdf', 3 * MIN)
    await scan('b.pdf', 2 * MIN)
    await page.goto('/')
    await expect(selectedOption(page)).toContainText('a.pdf')
    await fs.rename(path.join(inbox, 'a.pdf'), path.join(inbox, 'a-umbenannt.pdf'))
    await refreshButton(page).click()
    await expect(options(page).filter({ hasText: 'a-umbenannt.pdf' })).toBeVisible()
    await expect(selectedOption(page)).toContainText('b.pdf')
  })

  test('EC: Sehr langer Dateiname wird gekürzt, ohne horizontales Scrollen', async ({ page }) => {
    await scan(`Scan_${'x'.repeat(120)}.pdf`, 10 * MIN)
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('EC: Datum in der Zukunft (falsche NAS-Uhr) – angezeigt, keine Tage-Markierung', async ({ page }) => {
    await scan('zukunft.pdf', 10 * MIN)
    const future = new Date(Date.now() + 5 * DAY)
    await fs.utimes(path.join(inbox, 'zukunft.pdf'), future, future)
    await page.goto('/')
    await refreshButton(page).click() // first observation was the page render
    await page.waitForTimeout(5_500)
    await refreshButton(page).click()
    await expect(options(page).filter({ hasText: 'zukunft.pdf' })).toBeVisible()
    await expect(options(page).filter({ hasText: 'zukunft.pdf' })).not.toContainText('seit')
  })

  test('EC: Dateiname mit HTML wird als Text dargestellt', async ({ page }) => {
    // Windows forbids < > in file names, but an NAS (Samba) could deliver them –
    // simulate such a server answer to check the UI escapes it.
    await scan('a.pdf', 10 * MIN)
    await page.route('**/api/inbox', (route) =>
      route.fulfill({
        json: {
          folder: inbox,
          status: 'ok',
          checkedAt: new Date().toISOString(),
          files: [{ name: '<img src=x onerror=alert(1)>.pdf', size: 1, modifiedAt: new Date().toISOString() }],
        },
      })
    )
    let dialog = false
    page.on('dialog', async (d) => {
      dialog = true
      await d.dismiss()
    })
    await page.goto('/')
    await refreshButton(page).click()
    await expect(options(page).first()).toContainText('<img src=x onerror=alert(1)>.pdf')
    expect(dialog).toBe(false)
  })
})

test.describe('PROJ-2 Responsive', () => {
  for (const [name, width, height] of [
    ['Mobile', 375, 812],
    ['Tablet', 768, 1024],
    ['Desktop', 1440, 900],
  ] as const) {
    test(`${name} (${width}px): Liste bedienbar, kein horizontales Scrollen`, async ({ page }) => {
      await scan('a.pdf', 10 * MIN)
      await scan('b.pdf', 5 * MIN)
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await expect(options(page)).toHaveCount(2)
      await expect(refreshButton(page)).toBeVisible()
      await options(page).filter({ hasText: 'b.pdf' }).click()
      await expect(selectedOption(page)).toContainText('b.pdf')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
})
