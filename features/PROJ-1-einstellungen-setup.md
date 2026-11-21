# PROJ-1: Einstellungen & Setup

## Status: Planned
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
- [ ] Soll die Einstellungsseite eine Kurzanleitung enthalten, wie man einen API-Schlüssel in der Anthropic Console anlegt?

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

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
