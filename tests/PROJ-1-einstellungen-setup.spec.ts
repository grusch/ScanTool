import { execFileSync } from 'child_process'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { expect, test, type Page } from '@playwright/test'

// Must match playwright.config.ts → isolated settings of the QA server
const QA_DATA_DIR = path.join(__dirname, '.qa-data')
const SETTINGS_FILE = path.join(QA_DATA_DIR, 'settings.json')

let tmp: string
let inbox: string
let archive: string

test.beforeEach(async () => {
  await fs.rm(SETTINGS_FILE, { force: true })
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'scantool-e2e-'))
  inbox = path.join(tmp, 'Eingang')
  archive = path.join(tmp, 'Ablage')
  await fs.mkdir(inbox)
  await fs.mkdir(archive)
  await fs.writeFile(path.join(inbox, 'scan1.pdf'), 'x')
  await fs.writeFile(path.join(inbox, 'scan2.PDF'), 'x')
})

test.afterEach(async () => {
  await fs.rm(SETTINGS_FILE, { force: true })
  await fs.rm(tmp, { recursive: true, force: true })
})

async function writeSettings(inboxPath: string, archivePath: string) {
  await fs.mkdir(QA_DATA_DIR, { recursive: true })
  await fs.writeFile(
    SETTINGS_FILE,
    JSON.stringify({ inboxPath, archivePath, updatedAt: new Date().toISOString() })
  )
}

const inboxField = (page: Page) => page.getByLabel('Eingangsordner')
const archiveField = (page: Page) => page.getByLabel('Ablage-Stammordner')

async function fillFolders(page: Page, inboxPath: string, archivePath: string) {
  await inboxField(page).fill(inboxPath)
  await archiveField(page).fill(archivePath)
}

test.describe('PROJ-1 Erster Start & Sperre', () => {
  test('AC1: Ersteinrichtung öffnet die Einstellungsseite mit Willkommens-Hinweis', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/einstellungen$/)
    await expect(page.getByText('Willkommen')).toBeVisible()
    await expect(page.getByText('Bitte richte zuerst Eingangs- und Ablageordner ein.')).toBeVisible()
  })

  test('AC2: Ungültiger Ordner sperrt die Hauptansicht', async ({ page }) => {
    await writeSettings(inbox, path.join(tmp, 'gibt-es-nicht'))
    await page.goto('/')
    await expect(page).toHaveURL(/\/einstellungen$/)
  })

  test('AC3: Gültige Ordner ohne API-Schlüssel → Hauptansicht mit Hinweis', async ({ page }) => {
    await writeSettings(inbox, archive)
    await page.goto('/')
    await expect(page).toHaveURL(/127\.0\.0\.1:3100\/$/)
    await expect(page.getByText('API-Schlüssel fehlt – die KI-Analyse ist deaktiviert.')).toBeVisible()
  })

  test('AC4: Zahnrad öffnet Einstellungen mit gespeicherten Werten', async ({ page }) => {
    await writeSettings(inbox, archive)
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Einstellungen' }).click()
    await expect(page).toHaveURL(/\/einstellungen$/)
    await expect(inboxField(page)).toHaveValue(inbox)
    await expect(archiveField(page)).toHaveValue(archive)
    await expect(page.getByText('Willkommen')).toHaveCount(0)
  })
})

test.describe('PROJ-1 Ordnerpfade', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/einstellungen')
    await expect(inboxField(page)).toBeVisible()
  })

  test('AC5: Eingangsordner zeigt Prüfergebnis mit Anzahl PDFs', async ({ page }) => {
    await inboxField(page).fill(inbox)
    await expect(page.getByText('Ordner gefunden, 2 PDFs')).toBeVisible()
  })

  test('AC6: Ablage-Stammordner zeigt Prüfergebnis', async ({ page }) => {
    await archiveField(page).fill(archive)
    await expect(page.getByText('Ordner gefunden', { exact: true })).toBeVisible()
    await expect(page.getByText(`${archive}\\Rechnungen\\${new Date().getFullYear()}\\`)).toBeVisible()
  })

  test('AC7: Nicht existierender Ordner → Meldung und Knopf „Ordner anlegen"', async ({ page }) => {
    await inboxField(page).fill(path.join(tmp, 'Neu'))
    await expect(page.getByText('Ordner nicht gefunden')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ordner anlegen' })).toBeVisible()
  })

  test('AC8: „Ordner anlegen" erstellt Ordner inkl. übergeordneter Ordner', async ({ page }) => {
    const target = path.join(tmp, 'Neu', 'Scans', 'Eingang')
    await inboxField(page).fill(target)
    await page.getByRole('button', { name: 'Ordner anlegen' }).click()
    await expect(page.getByText('Ordner gefunden, 0 PDFs')).toBeVisible()
    expect((await fs.stat(target)).isDirectory()).toBe(true)
  })

  test('AC9: Ordner ohne Schreibrecht (NTFS) → „Kein Lese-/Schreibzugriff"', async ({ page }) => {
    test.skip(process.platform !== 'win32', 'uses Windows ACLs')
    const locked = path.join(tmp, 'Gesperrt')
    await fs.mkdir(locked)
    // Note: the read-only *attribute* does not block writing into folders on
    // Windows – a real permission denial needs an ACL entry.
    const user = process.env.USERNAME!
    execFileSync('icacls', [locked, '/deny', `${user}:(W,AD,WD)`], { stdio: 'ignore' })
    try {
      await archiveField(page).fill(locked)
      await expect(page.getByText('Kein Lese-/Schreibzugriff auf diesen Ordner')).toBeVisible()
    } finally {
      execFileSync('icacls', [locked, '/remove:d', user], { stdio: 'ignore' })
    }
  })

  test('AC10: Identische Ordner können nicht gespeichert werden', async ({ page }) => {
    await fillFolders(page, inbox, inbox.toUpperCase() + '\\')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Eingangs- und Ablageordner müssen verschieden sein')).toBeVisible()
    await expect(fs.stat(SETTINGS_FILE)).rejects.toThrow()
  })

  test('AC11: Ineinanderliegende Ordner können nicht gespeichert werden', async ({ page }) => {
    const nested = path.join(archive, 'Eingang')
    await fs.mkdir(nested)
    await fillFolders(page, nested, archive)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Eingangs- und Ablageordner dürfen nicht ineinander liegen')).toBeVisible()
    await expect(fs.stat(SETTINGS_FILE)).rejects.toThrow()
  })

  test('AC12: Leere Felder werden als Pflichtfeld markiert', async ({ page }) => {
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Pflichtfeld')).toHaveCount(2)
    await expect(fs.stat(SETTINGS_FILE)).rejects.toThrow()
  })

  test('AC13: Gültige Pfade werden gespeichert und bleiben nach Neuladen erhalten', async ({ page }) => {
    await fillFolders(page, inbox, archive)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Einstellungen gespeichert')).toBeVisible()
    await page.reload()
    await expect(inboxField(page)).toHaveValue(inbox)
    await expect(archiveField(page)).toHaveValue(archive)
    await expect(page.getByRole('link', { name: 'Zur Hauptansicht' })).toBeVisible()
  })
})

test.describe('PROJ-1 Erneute Prüfung beim Start', () => {
  test('AC14+15: Gelöschter Ordner wird beim Aufruf erkannt und gemeldet', async ({ page }) => {
    await writeSettings(inbox, archive)
    await fs.rm(archive, { recursive: true })
    await page.goto('/')
    await expect(page).toHaveURL(/\/einstellungen$/)
    await expect(page.getByText('Ordner nicht mehr gefunden')).toBeVisible()
    await expect(page.getByRole('alert').filter({ hasText: archive })).toBeVisible()
  })
})

test.describe('PROJ-1 API-Schlüssel', () => {
  test('AC16: Vorhandener Schlüssel wird nur als Status angezeigt', async ({ page }) => {
    // QA server runs without key → simulate the "key present" server answer
    await page.route('**/api/settings', async (route) => {
      if (route.request().method() !== 'GET') return route.continue()
      const res = await route.fetch()
      await route.fulfill({ response: res, json: { ...(await res.json()), apiKeyPresent: true } })
    })
    await page.goto('/einstellungen')
    await expect(page.getByText('API-Schlüssel gefunden')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('sk-ant-')
  })

  test('AC17: Fehlender Schlüssel → Hinweis mit Anleitung', async ({ page }) => {
    await page.goto('/einstellungen')
    await expect(page.getByText('Kein API-Schlüssel gefunden', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Kein API-Schlüssel gefunden. Trage ANTHROPIC_API_KEY in .env.local ein und starte das Tool neu.')
    ).toBeVisible()
    await expect(page.getByText('So legst du einen API-Schlüssel an')).toBeVisible()
  })

  const cases = [
    ['AC18: Erfolg', { ok: true }, 'Verbindung erfolgreich'],
    ['AC19: Schlüssel ungültig', { ok: false, code: 'invalid_key' }, 'API-Schlüssel wurde abgelehnt. Prüfe ihn in der Anthropic Console.'],
    ['AC20: Kein Guthaben', { ok: false, code: 'no_credit' }, 'Kein Guthaben auf dem API-Konto. Lade es in der Anthropic Console auf.'],
    ['AC21: Nicht erreichbar', { ok: false, code: 'unreachable' }, 'Claude ist nicht erreichbar. Prüfe die Internetverbindung.'],
  ] as const

  for (const [name, response, message] of cases) {
    test(`${name} → verständliche Meldung`, async ({ page }) => {
      await page.route('**/api/settings/test-connection', (route) => route.fulfill({ json: response }))
      await page.goto('/einstellungen')
      await page.getByRole('button', { name: 'Verbindung testen' }).click()
      await expect(page.getByText(message)).toBeVisible()
    })
  }

  test('AC17b: Verbindungstest ohne Schlüssel (echter Server) → fehlender Schlüssel', async ({ page }) => {
    await page.goto('/einstellungen')
    await page.getByRole('button', { name: 'Verbindung testen' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Kein API-Schlüssel gefunden.' })).toBeVisible()
  })

  test('AC22: Während des Tests Ladezustand, Knopf nicht erneut klickbar', async ({ page }) => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    await page.route('**/api/settings/test-connection', async (route) => {
      await gate
      await route.fulfill({ json: { ok: true } })
    })
    await page.goto('/einstellungen')
    await page.getByRole('button', { name: 'Verbindung testen' }).click()
    const busy = page.getByRole('button', { name: 'Teste Verbindung …' })
    await expect(busy).toBeDisabled()
    release()
    await expect(page.getByText('Verbindung erfolgreich')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Verbindung testen' })).toBeEnabled()
  })

  test('AC23: Beim Öffnen wird kein Verbindungstest ausgelöst', async ({ page }) => {
    const calls: string[] = []
    page.on('request', (r) => r.url().includes('test-connection') && calls.push(r.url()))
    await writeSettings(inbox, archive)
    await page.goto('/')
    await page.goto('/einstellungen')
    await expect(inboxField(page)).toHaveValue(inbox)
    expect(calls).toHaveLength(0)
  })
})

test.describe('PROJ-1 Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/einstellungen')
  })

  test('EC1: Pfad mit Anführungszeichen (Explorer „Als Pfad kopieren") wird akzeptiert', async ({ page }) => {
    await fillFolders(page, `"${inbox}"`, ` ${archive}\\ `)
    await expect(page.getByText('Ordner gefunden, 2 PDFs')).toBeVisible()
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Einstellungen gespeichert')).toBeVisible()
    await expect(inboxField(page)).toHaveValue(inbox)
    await expect(archiveField(page)).toHaveValue(archive)
  })

  test('EC2: Pfad auf eine Datei → „Pfad ist kein Ordner"', async ({ page }) => {
    await inboxField(page).fill(path.join(inbox, 'scan1.pdf'))
    await expect(page.getByText('Pfad ist kein Ordner')).toBeVisible()
  })

  test('EC4: Leerer Eingangsordner ist gültig', async ({ page }) => {
    const empty = path.join(tmp, 'Leer')
    await fs.mkdir(empty)
    await inboxField(page).fill(empty)
    await expect(page.getByText('Ordner gefunden, 0 PDFs')).toBeVisible()
  })

  test('EC7 / BUG-1: Nicht erreichbarer Netzwerkpfad wird schnell gemeldet, ohne „Ordner anlegen"', async ({ page }) => {
    // 192.0.2.1 = TEST-NET-1 (RFC 5737), never reachable
    await inboxField(page).fill('\\\\192.0.2.1\\share\\Scans')
    await expect(page.getByText('Netzwerkpfad nicht erreichbar', { exact: false })).toBeVisible({ timeout: 6000 })
    await expect(page.getByRole('button', { name: 'Ordner anlegen' })).toHaveCount(0)
  })

  test('EC7 / BUG-1: Gespeicherter, nicht erreichbarer Netzwerkpfad sperrt die Hauptansicht ohne Hänger', async ({ page }) => {
    await writeSettings('\\\\192.0.2.1\\share\\Scans', archive)
    const start = Date.now()
    await page.goto('/')
    await expect(page).toHaveURL(/\/einstellungen$/)
    await expect(page.getByRole('alert').filter({ hasText: 'Netzwerkpfad nicht erreichbar' }).first()).toBeVisible()
    expect(Date.now() - start).toBeLessThan(10_000)
  })

  test('EC-extra: Relativer Pfad wird abgewiesen', async ({ page }) => {
    await fillFolders(page, 'Scans\\Eingang', archive)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Bitte einen vollständigen Pfad angeben', { exact: false })).toBeVisible()
  })
})

test.describe('PROJ-1 Responsive', () => {
  for (const [name, width, height] of [
    ['Mobile', 375, 812],
    ['Tablet', 768, 1024],
    ['Desktop', 1440, 900],
  ] as const) {
    test(`${name} (${width}px): kein horizontales Scrollen, alle Bedienelemente sichtbar`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/einstellungen')
      await inboxField(page).fill(inbox)
      await expect(page.getByText('Ordner gefunden, 2 PDFs')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await expect(page.getByRole('button', { name: 'Speichern' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Verbindung testen' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Einstellungen' })).toBeVisible()
    })
  }
})
