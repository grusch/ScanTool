# PROJ-1: Einstellungen & Setup

## Status: In Progress
**Created:** 2026-11-21
**Last Updated:** 2026-11-21

## Dependencies
- None

## User Stories
- Als Nutzer möchte ich beim ersten Start direkt zur Einrichtung geführt werden, damit ich weiß, was vor der Nutzung zu tun ist.
- Als Nutzer möchte ich den Eingangsordner und den Ablage-Stammordner per eingefügtem Pfad festlegen, damit das Tool weiß, woher Scans kommen und wohin sie abgelegt werden.
- Als Nutzer möchte ich sofort sehen, ob ein eingegebener Pfad gültig ist (inkl. Anzahl gefundener PDFs im Eingang), damit ich Tippfehler direkt bemerke.
- Als Nutzer möchte ich einen fehlenden Ordner direkt aus dem Tool anlegen können, damit ich nicht in den Explorer wechseln muss.
- Als Nutzer möchte ich sehen, ob ein Claude-API-Schlüssel hinterlegt ist, und die Verbindung per Knopfdruck testen, damit ich vor der ersten Analyse weiß, dass die KI funktioniert.
- Als Nutzer möchte ich die Einstellungen jederzeit wieder öffnen und ändern können, damit ich auf geänderte Ordnerstrukturen reagieren kann.

## Out of Scope
- Eingabe des API-Schlüssels in der Oberfläche – er wird ausschliesslich in `.env.local` hinterlegt
- Eingebauter Ordner-Browser / Ordnerauswahl-Dialog – nur Textfeld
- Einstellbare Unterordnernamen, Jahresordner oder Namensschema – fest vorgegeben (evtl. später)
- KI/OCR-Umschalter – kommt mit PROJ-6
- Supabase-Konfiguration – PROJ-7
- Login / Mehrbenutzer – laut PRD Nicht-Ziel
- Automatischer API-Verbindungstest bei jedem Start – nur auf Knopfdruck
- Bilden des Dateinamens und Verschieben der Dateien – PROJ-5
- Auflisten der Scans im Eingang – PROJ-2

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Erster Start & Sperre
- [ ] Angenommen es sind noch keine Ordner eingerichtet, wenn der Nutzer das Tool öffnet, dann wird automatisch die Einstellungsseite mit dem Hinweis „Willkommen – bitte richte zuerst Eingangs- und Ablageordner ein" angezeigt
- [ ] Angenommen mindestens ein Ordner ist nicht eingerichtet oder ungültig, wenn der Nutzer die Hauptansicht aufrufen will, dann wird er zur Einstellungsseite geleitet
- [ ] Angenommen beide Ordner sind gültig, aber kein API-Schlüssel vorhanden, wenn der Nutzer die Hauptansicht öffnet, dann ist sie erreichbar und die KI-Analyse ist deaktiviert mit dem Hinweis „API-Schlüssel fehlt – siehe Einstellungen"
- [ ] Angenommen das Tool ist eingerichtet, wenn der Nutzer auf das Einstellungs-Symbol klickt, dann öffnet sich die Einstellungsseite mit den aktuell gespeicherten Werten

### Ordnerpfade
- [ ] Angenommen der Nutzer ist auf der Einstellungsseite, wenn er einen Pfad in das Feld „Eingangsordner" einfügt, dann wird darunter das Prüfergebnis angezeigt (z. B. „✓ Ordner gefunden, 12 PDFs")
- [ ] Angenommen der Nutzer ist auf der Einstellungsseite, wenn er einen Pfad in das Feld „Ablage-Stammordner" einfügt, dann wird darunter das Prüfergebnis angezeigt (z. B. „✓ Ordner gefunden")
- [ ] Angenommen der eingegebene Ordner existiert nicht, wenn das Prüfergebnis angezeigt wird, dann erscheint „✗ Ordner nicht gefunden" und ein Knopf „Ordner anlegen"
- [ ] Angenommen der Ordner existiert nicht, wenn der Nutzer auf „Ordner anlegen" klickt, dann wird der Ordner (inkl. fehlender übergeordneter Ordner) angelegt und das Prüfergebnis zeigt „✓ Ordner gefunden"
- [ ] Angenommen das Tool hat keine Lese- oder Schreibrechte auf den Ordner, wenn das Prüfergebnis angezeigt wird, dann erscheint „✗ Kein Lese-/Schreibzugriff auf diesen Ordner"
- [ ] Angenommen Eingangs- und Ablageordner sind identisch, wenn der Nutzer speichert, dann wird das Speichern verhindert mit der Meldung „Eingangs- und Ablageordner müssen verschieden sein"
- [ ] Angenommen ein Ordner liegt innerhalb des anderen, wenn der Nutzer speichert, dann wird das Speichern verhindert mit der Meldung „Eingangs- und Ablageordner dürfen nicht ineinander liegen"
- [ ] Angenommen ein Pfadfeld ist leer, wenn der Nutzer speichert, dann wird das Speichern verhindert und das leere Feld als Pflichtfeld markiert
- [ ] Angenommen beide Pfade sind gültig, wenn der Nutzer auf „Speichern" klickt, dann werden die Pfade dauerhaft gespeichert, eine Bestätigung angezeigt und sie bleiben nach Neustart des Tools erhalten
- [ ] Angenommen gespeicherte Pfade sind vorhanden, wenn das Tool gestartet wird, dann werden beide Ordner erneut geprüft
- [ ] Angenommen ein gespeicherter Ordner existiert beim Start nicht mehr, wenn das Tool gestartet wird, dann wird die Einstellungsseite mit dem Hinweis „Ordner nicht mehr gefunden: [Pfad]" angezeigt

### API-Schlüssel
- [ ] Angenommen `ANTHROPIC_API_KEY` ist in `.env.local` gesetzt, wenn die Einstellungsseite geöffnet wird, dann wird „API-Schlüssel gefunden ✓" angezeigt – der Schlüssel selbst wird nie angezeigt
- [ ] Angenommen kein API-Schlüssel ist gesetzt, wenn die Einstellungsseite geöffnet wird, dann wird „✗ Kein API-Schlüssel gefunden. Trage `ANTHROPIC_API_KEY` in `.env.local` ein und starte das Tool neu." angezeigt
- [ ] Angenommen ein gültiger Schlüssel mit Guthaben ist gesetzt, wenn der Nutzer auf „Verbindung testen" klickt, dann wird „✓ Verbindung erfolgreich" angezeigt
- [ ] Angenommen der Schlüssel ist ungültig, wenn der Nutzer auf „Verbindung testen" klickt, dann wird „API-Schlüssel wurde abgelehnt. Prüfe ihn in der Anthropic Console." angezeigt
- [ ] Angenommen das API-Konto hat kein Guthaben, wenn der Nutzer auf „Verbindung testen" klickt, dann wird „Kein Guthaben auf dem API-Konto. Lade es in der Anthropic Console auf." angezeigt
- [ ] Angenommen keine Internetverbindung oder Zeitüberschreitung, wenn der Nutzer auf „Verbindung testen" klickt, dann wird „Claude ist nicht erreichbar. Prüfe die Internetverbindung." angezeigt
- [ ] Angenommen ein Verbindungstest läuft, wenn der Nutzer wartet, dann zeigt der Knopf einen Ladezustand und kann nicht erneut geklickt werden
- [ ] Angenommen das Tool startet, wenn ein API-Schlüssel vorhanden ist, dann wird beim Start kein API-Aufruf gemacht (nur Vorhandensein geprüft)

## Edge Cases
- **Pfad mit Anführungszeichen:** Aus dem Explorer kopierte Pfade („Als Pfad kopieren") enthalten `"…"` – diese werden automatisch entfernt, ebenso führende/abschliessende Leerzeichen.
- **Pfad zeigt auf eine Datei statt Ordner:** Meldung „✗ Pfad ist kein Ordner".
- **Abschliessender Backslash / Gross-Kleinschreibung:** `C:\Scans\` und `c:\scans` gelten als derselbe Ordner (Windows) – relevant für die Prüfung „identisch / ineinander".
- **Eingangsordner leer:** gültig – Anzeige „✓ Ordner gefunden, 0 PDFs".
- **OneDrive pausiert oder Ordner nur online („Dateien bei Bedarf"):** Ordner gilt als gültig, sofern er lokal existiert; Verfügbarkeit der Dateien wird erst in PROJ-2/PROJ-3 behandelt.
- **Ordner wird während der Nutzung umbenannt/gelöscht:** wird spätestens beim nächsten Start oder bei der nächsten Aktion in PROJ-2/PROJ-5 erkannt.
- **Netzlaufwerk / UNC-Pfad (`\\NAS\…`):** erlaubt, sofern erreichbar und beschreibbar.
- **API-Schlüssel in `.env.local` geändert, Tool nicht neu gestartet:** Status zeigt weiterhin alten Zustand – Hinweis „Nach Änderung Tool neu starten" auf der Seite.

## Technical Requirements (optional)
- Läuft nur lokal (localhost), kein Login
- Der API-Schlüssel darf nie an den Browser übertragen, angezeigt oder geloggt werden
- `.env.local` darf nicht committet werden
- Pfadprüfung reagiert spürbar sofort (< 1 s)

## Open Questions
- [x] Soll die Einstellungsseite eine Kurzanleitung enthalten, wie man einen API-Schlüssel in der Anthropic Console anlegt? → Ja, aufklappbar (siehe Tech Design)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Ordnerpfade in der Oberfläche, API-Schlüssel nur in `.env.local` | Pfade ändern sich gelegentlich und sollen bequem anpassbar sein; der Schlüssel soll nie sichtbar werden (Screenshots, Bildschirmfreigabe) | 2026-11-21 |
| Ohne gültige Ordner ist die Hauptansicht gesperrt, ohne API-Schlüssel nur die KI-Analyse | Ohne Ordner ist das Tool nutzlos; ohne Schlüssel können Scans trotzdem angesehen werden | 2026-11-21 |
| Pfadeingabe nur per Textfeld (kein Ordner-Browser) | Browser liefert keine vollen Pfade; Pfade werden nur einmal eingestellt – Aufwand für Ordner-Browser lohnt nicht | 2026-11-21 |
| Fehlender Ordner kann per Knopf angelegt werden | Erspart den Wechsel in den Explorer bei der Ersteinrichtung | 2026-11-21 |
| Eingang und Ablage müssen verschieden sein und dürfen nicht ineinander liegen | Sonst würden abgelegte Dateien erneut im Eingang erscheinen | 2026-11-21 |
| Ordnerprüfung bei Speichern und bei jedem Start | Ordner können ausserhalb des Tools umbenannt oder gelöscht werden | 2026-11-21 |
| Nur die beiden Pfade sind einstellbar; Unterordner und Namensschema fest | Schlanke Einstellungsseite im MVP | 2026-11-21 |
| Garantiescheine werden ebenfalls in `Rechnungen\JJJJ\` abgelegt, mit Zusatz `_Garantie` im Dateinamen (Umsetzung in PROJ-5) | Rechnung und Garantieschein zum selben Kauf liegen nebeneinander; Suche nach „Garantie" findet alle Garantiescheine | 2026-11-21 |
| API-Verbindungstest nur auf Knopfdruck, mit verständlichen Fehlermeldungen | Keine unnötigen API-Aufrufe/Kosten bei jedem Start; Fehler sollen ohne technisches Wissen lösbar sein | 2026-11-21 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Einstellungen in Datei `data/settings.json` (serverseitig, gitignored) statt localStorage | Server braucht die Pfade für Dateioperationen; überlebt Browser-Wechsel/Cache-Löschen | 2026-11-21 |
| Keine Datenbank für Einstellungen | Nur zwei Werte; Supabase erst mit PROJ-7 | 2026-11-21 |
| Next.js-Server nur an 127.0.0.1 binden | Server kann Ordner anlegen/Dateien verschieben – darf nicht aus dem Heimnetz erreichbar sein; ersetzt fehlenden Login | 2026-11-21 |
| Pfade normalisieren und case-insensitiv vergleichen | Windows-Pfade; zuverlässige Erkennung „identisch / ineinander" | 2026-11-21 |
| Verbindungstest = minimaler Aufruf mit kleinstem Claude-Modell | Erkennt ungültigen Schlüssel, fehlendes Guthaben und Netzfehler; Kosten vernachlässigbar. „Modelle auflisten" erkennt fehlendes Guthaben nicht | 2026-11-21 |
| `@anthropic-ai/sdk` als einzige neue Abhängigkeit | Offizielles SDK mit eindeutigen Fehlertypen; wird in PROJ-4 wiederverwendet | 2026-11-21 |
| Zugangsprüfung serverseitig beim Seitenaufruf | Gesperrte Hauptansicht blitzt nicht kurz auf | 2026-11-21 |
| API-Schlüssel nur serverseitig lesen, an Oberfläche nur „vorhanden ja/nein" | Schlüssel darf nie im Browser landen | 2026-11-21 |
| Host-/Origin-Prüfung auf allen API-Routen (`local-guard.ts`) | 127.0.0.1 allein schützt nicht vor anderen Websites im selben Browser (CSRF, DNS-Rebinding); ersetzt Authentifizierung | 2026-11-21 |
| Verbindungstest mit `claude-haiku-5-5`, `max_tokens: 1`, Thinking aus, keine Retries | Günstigstes Modell, Ergebnis in < 15 s; Fehler über SDK-Fehlerklassen statt Textvergleich | 2026-11-21 |
| Schreibrecht per `fs.access` statt Test-Datei | Keine Fremddateien im OneDrive-Eingang erzeugen | 2026-11-21 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick
Das Tool ist eine Next.js-App, die nur auf dem eigenen PC läuft. Sie besteht aus zwei Teilen:
- **Oberfläche (Browser):** zeigt die Einstellungsseite, schickt Eingaben an den lokalen Server.
- **Lokaler Server (Node.js, Teil von Next.js):** darf als einziger auf Ordner und Dateien zugreifen und den API-Schlüssel lesen. Der Browser sieht weder Dateisystem noch Schlüssel.

Dieses Grundgerüst (Einstellungsdatei, Server-Schnittstellen, Seitenrahmen mit Kopfzeile) wird von allen folgenden Features (PROJ-2 bis PROJ-5) wiederverwendet.

### A) Komponenten-Struktur

```
App-Rahmen (für alle Seiten)
+-- Kopfzeile
|   +-- App-Name „ScanTool"
|   +-- Hell/Dunkel-Umschalter
|   +-- Zahnrad-Symbol → Einstellungen
+-- Benachrichtigungen (Bestätigung „Gespeichert" etc.)

Hauptseite „/" (Inhalt folgt mit PROJ-2 bis PROJ-5)
+-- Zugangsprüfung: Ordner fehlen/ungültig → Weiterleitung zu /einstellungen
+-- Hinweisleiste „API-Schlüssel fehlt – siehe Einstellungen" (falls kein Schlüssel)
+-- Platzhalter für Eingangsliste / Vorschau / Vorschläge

Einstellungsseite „/einstellungen"
+-- Willkommens-Hinweis (nur bei Ersteinrichtung)
+-- Hinweis „Ordner nicht mehr gefunden: [Pfad]" (falls beim Start fehlend)
+-- Karte „Ordner"
|   +-- Feld „Eingangsordner" + Prüfergebnis darunter
|   |   (✓ gefunden, 12 PDFs / ✗ nicht gefunden + Knopf „Ordner anlegen" / ✗ kein Zugriff / ✗ kein Ordner)
|   +-- Feld „Ablage-Stammordner" + Prüfergebnis darunter
|   +-- Vorschau der Ablagestruktur: „<Ablage>\Rechnungen\2026\…"
|   +-- Fehlermeldung „identisch / ineinander"
|   +-- Knopf „Speichern"
+-- Karte „Claude-API"
    +-- Status: „API-Schlüssel gefunden ✓" oder „✗ Kein API-Schlüssel gefunden …"
    +-- Knopf „Verbindung testen" (mit Ladezustand) + Ergebnis-Meldung
    +-- Hinweis „Nach Änderung an .env.local Tool neu starten"
    +-- Aufklappbare Kurzanleitung „So legst du einen API-Schlüssel an"
```

Verwendete vorhandene shadcn/ui-Bausteine: Card, Input, Label, Button, Alert, Badge, Collapsible, Separator, Sonner (Benachrichtigungen). Es müssen keine neuen UI-Bausteine installiert werden.

### B) Datenmodell

```
Einstellungen:
- Eingangsordner (vollständiger Pfad, Pflicht)
- Ablage-Stammordner (vollständiger Pfad, Pflicht)
- Zuletzt gespeichert (Zeitpunkt)

Gespeichert in: einer kleinen Einstellungsdatei im Projektordner
(z. B. data/settings.json), vom Server gelesen und geschrieben,
nicht im Git-Repository.

API-Schlüssel:
- ANTHROPIC_API_KEY in .env.local
- Wird nur vom Server gelesen; die Oberfläche erfährt nur „vorhanden ja/nein"
  und das Ergebnis des Verbindungstests.

Prüfergebnis eines Ordners (wird nicht gespeichert, nur angezeigt):
- Status: gültig / nicht gefunden / kein Ordner / kein Zugriff
- Anzahl PDFs (nur beim Eingangsordner)
```

### C) Server-Schnittstellen (in Worten)

| Schnittstelle | Zweck |
|---------------|-------|
| Einstellungen lesen | Liefert gespeicherte Pfade, deren aktuellen Prüfstatus und ob ein API-Schlüssel vorhanden ist |
| Ordner prüfen | Prüft einen einzelnen Pfad (existiert? Ordner? Lese-/Schreibrecht? Anzahl PDFs) – wird beim Eintippen/Einfügen verzögert aufgerufen |
| Ordner anlegen | Legt einen fehlenden Ordner inkl. übergeordneter Ordner an |
| Einstellungen speichern | Prüft beide Pfade erneut + „verschieden / nicht ineinander", speichert nur wenn alles gültig |
| Verbindung testen | Macht einen minimalen Testaufruf an Claude und übersetzt das Ergebnis in eine der vier verständlichen Meldungen |

Alle Eingaben werden auf dem Server mit Zod geprüft (die Oberfläche prüft zusätzlich für schnelles Feedback).

### D) Technische Entscheidungen (Begründung)

- **Einstellungen als Datei auf dem Server statt im Browser-Speicher:** Die Ordnerpfade braucht der Server (er liest/verschiebt die Dateien). Im Browser gespeichert, müsste er sie bei jeder Aktion mitgeschickt bekommen. Eine Datei überlebt auch Browser-Wechsel und Cache-Löschen.
- **Keine Datenbank:** Zwei Pfade rechtfertigen keine Datenbank; Supabase kommt erst mit PROJ-7.
- **Server nur auf diesem PC erreichbar (127.0.0.1):** Standardmäßig ist der Next.js-Server auch im Heimnetz erreichbar. Da er Ordner anlegen und später Dateien verschieben kann, wird er auf den eigenen PC beschränkt – andere Geräte im Netz kommen nicht heran. Ersetzt zugleich den fehlenden Login.
- **Pfadvergleich nach Windows-Regeln:** Pfade werden vor dem Vergleich bereinigt (Anführungszeichen, Leerzeichen, abschliessender Backslash entfernt) und ohne Gross-/Kleinschreibung verglichen, damit „identisch / ineinander" zuverlässig erkannt wird.
- **Verbindungstest mit dem kleinsten Claude-Modell und minimaler Antwortlänge:** Kostet praktisch nichts (Bruchteil eines Rappens), erkennt aber zuverlässig ungültigen Schlüssel, fehlendes Guthaben und fehlende Verbindung. Ein reines „Modelle auflisten" wäre gratis, erkennt fehlendes Guthaben aber nicht.
- **Offizielles Anthropic-SDK:** Liefert eindeutige Fehlertypen (abgelehnt, kein Guthaben, nicht erreichbar), die sich direkt den Meldungen aus der Spec zuordnen lassen.
- **Zugangsprüfung serverseitig beim Seitenaufruf:** Die Hauptseite prüft vor dem Anzeigen, ob gültige Ordner gespeichert sind, und leitet sonst um – kein kurzes Aufblitzen der gesperrten Ansicht.
- **Kurzanleitung zum API-Schlüssel aufklappbar:** Beantwortet die offene Frage der Spec – hilft bei der Ersteinrichtung, stört danach nicht.

### E) Abhängigkeiten (zu installieren)

| Paket | Zweck |
|-------|-------|
| `@anthropic-ai/sdk` | Verbindungstest zu Claude (und später die KI-Analyse in PROJ-4) |

Bereits vorhanden und genutzt: `zod`, `react-hook-form`, `next-themes`, `sonner`, `lucide-react`.

### F) Sonstige Anpassungen
- Start-Befehl so anpassen, dass der Server nur lokal lauscht
- `data/` in `.gitignore` aufnehmen
- `.env.local.example` mit Platzhalter `ANTHROPIC_API_KEY=` anlegen (ohne echten Schlüssel)
- App-Titel und Sprache (`de`) im Seitenrahmen setzen

## Implementation Notes (Frontend)
_Stand 2026-11-21 – /frontend_

**Gebaut:**
- App-Rahmen: `src/app/layout.tsx` (Sprache `de`, Titel ScanTool, ThemeProvider, TooltipProvider, Toaster), `src/components/app-header.tsx` (Logo, Hell/Dunkel-Umschalter, Zahnrad → `/einstellungen`), `theme-provider.tsx`, `theme-toggle.tsx`
- Einstellungsseite `src/app/einstellungen/page.tsx` → `src/components/settings/`:
  - `settings-view.tsx` – lädt Status, Lade-/Fehlerzustand, Willkommens-Hinweis, „Ordner nicht mehr gefunden"-Hinweise, Knopf „Zur Hauptansicht" sobald alles gültig
  - `folder-settings-card.tsx` – Formular (react-hook-form + Zod), Prüfung Pflichtfeld / absoluter Pfad / identisch / ineinander, Vorschau `<Ablage>\Rechnungen\JJJJ\`, Speichern mit Toast
  - `folder-path-field.tsx` – Pfadfeld mit verzögerter Live-Prüfung (400 ms) und Knopf „Ordner anlegen"
  - `api-settings-card.tsx` – Schlüssel-Status, „Verbindung testen" mit Ladezustand und den vier Fehlermeldungen
  - `api-key-guide.tsx` – aufklappbare Kurzanleitung (bei fehlendem Schlüssel automatisch offen)
- `src/components/api-key-notice.tsx` – Hinweisleiste für die Hauptansicht (Einbindung im Backend)
- Hauptseite `src/app/page.tsx` – Platzhalter „Eingang" (Inhalt folgt mit PROJ-2 bis PROJ-5)
- Gemeinsame Grundlagen (auch vom Backend genutzt):
  - `src/lib/settings-types.ts` – API-Vertrag (Request/Response-Typen, Status- und Fehlercodes)
  - `src/lib/paths.ts` + `paths.test.ts` – Pfad-Bereinigung und Vergleich nach Windows-Regeln (13 Tests grün)
  - `src/lib/settings-messages.ts` – alle deutschen Meldungstexte aus der Spec
  - `src/lib/settings-api.ts` – Browser-Client für die API
  - `src/hooks/use-folder-check.ts` – verzögerte Ordnerprüfung

**Erwartete API-Routen (Backend):** `GET /api/settings`, `PUT /api/settings`, `POST /api/settings/check-folder`, `POST /api/settings/create-folder`, `POST /api/settings/test-connection` – Formate siehe `settings-types.ts`.

**Noch offen fürs Backend:** serverseitige Zugangsprüfung auf `/` (Umleitung + `ApiKeyNotice`), Start-Befehl auf 127.0.0.1, `data/` in `.gitignore`, `.env.local.example`.

**Abweichungen / Hinweise:**
- Fehlermeldung „identisch / ineinander" erscheint direkt am Feld „Ablage-Stammordner" (statt allgemein), damit klar ist, welches Feld zu ändern ist.
- Zusätzliche Prüfung „vollständiger Pfad" (Laufwerk oder `\\Server\…`) – relative Pfade werden gar nicht erst an den Server geschickt.
- `npm run lint` ist im Template defekt (`next lint` existiert in Next 16 nicht mehr, `.eslintrc.json` inkompatibel mit ESLint 9) – vorbestehend, nicht Teil von PROJ-1. `npm run build` (inkl. TypeScript) läuft fehlerfrei.

## Implementation Notes (Backend)
_Stand 2026-11-21 – /backend_

**Keine Datenbank** (laut Tech Design) – Einstellungen in `data/settings.json` (gitignored, Pfad per `SCANTOOL_DATA_DIR` überschreibbar).

**API-Routen** (`src/app/api/settings/`):
| Route | Zweck | Fehlerfälle |
|-------|-------|-------------|
| `GET /api/settings` | gespeicherte Pfade + aktueller Prüfstatus + `apiKeyPresent` | 500 bei Lesefehler |
| `PUT /api/settings` | Zod-Validierung, Bereinigung, „identisch/ineinander", beide Ordner prüfen, atomar speichern | 400 `validation` / `same_folder` / `nested` / `invalid_folder` (mit `field`) |
| `POST /api/settings/check-folder` | einzelnen Pfad prüfen, PDFs zählen (Eingang) | 400 bei ungültiger Eingabe/relativem Pfad |
| `POST /api/settings/create-folder` | Ordner inkl. übergeordneter anlegen | `no_access` bei fehlenden Rechten |
| `POST /api/settings/test-connection` | 1-Token-Anfrage an `claude-haiku-5-5` (Thinking aus, 15 s Timeout, keine Retries) | `missing_key` / `invalid_key` (401/403) / `no_credit` (402 bzw. 400 „credit balance") / `unreachable` / `unknown` |

**Server-Logik** (`src/lib/server/`): `settings-store.ts` (Datei lesen/schreiben, Temp-Datei + Rename), `folders.ts` (stat/access/readdir), `settings-service.ts` (Status, Speichern, `isConfigured`), `anthropic.ts` (Schlüssel-Check, Verbindungstest, Fehler-Mapping über SDK-Fehlerklassen), `local-guard.ts`, `folder-request.ts`.

**Sicherheit:**
- Server lauscht nur auf 127.0.0.1 (`npm run dev` / `npm start` mit `-H 127.0.0.1`) – live geprüft: über LAN-IP nicht erreichbar.
- `local-guard.ts`: jede API-Route akzeptiert nur Host `127.0.0.1`/`localhost`/`[::1]` und Origin von localhost (bzw. keinen Origin); `Sec-Fetch-Site: cross-site` wird abgelehnt → schützt vor CSRF durch andere Websites und DNS-Rebinding (403).
- API-Schlüssel wird nur serverseitig gelesen; Antworten und Logs enthalten ihn nie (per Test geprüft).
- Security-Header in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. HSTS bewusst weggelassen (nur http://127.0.0.1).

**Zugangsprüfung:** `src/app/page.tsx` ist dynamisch, prüft serverseitig bei jedem Aufruf und leitet ohne gültige Ordner auf `/einstellungen` um (307, live geprüft); ohne API-Schlüssel erscheint `ApiKeyNotice`.

**Tests:** 42 grün (`npm test`) – 13 Pfad-Unit-Tests, 18 Integrationstests für Einstellungen/Ordner/Guard mit echten Temp-Ordnern, 11 für den Verbindungstest mit gemocktem SDK (keine echten API-Aufrufe). `npm run build` fehlerfrei.

**Abweichungen / offen:**
- Schreibrecht wird per `fs.access(W_OK)` geprüft – unter Windows erkennt das nur das Schreibschutz-Attribut, nicht alle NTFS-Rechte. Bewusst kein Test-Schreibvorgang, um keine Dateien in den OneDrive-Eingang zu schreiben. Ein echter Rechtefehler würde spätestens beim Ablegen (PROJ-5) gemeldet.
- `.env.local.example` konnte nicht angelegt werden (Zugriffssperre für `.env*`-Dateien) – muss manuell angelegt werden.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
