# PROJ-2: Eingangsliste

## Status: Planned
**Created:** 2026-11-21
**Last Updated:** 2026-11-21

## Dependencies
- Requires: PROJ-1 (Einstellungen & Setup) – gespeicherter, gültiger Eingangsordner; Hauptansicht ist ohne gültige Ordner gesperrt

## User Stories
- Als Nutzer möchte ich beim Öffnen des Tools alle neuen Scans aus meinem Eingangsordner in einer Liste sehen, damit ich weiß, was noch abzulegen ist.
- Als Nutzer möchte ich die Scans vom ältesten zum neuesten sehen und lange liegende Scans erkennen, damit nichts im Eingang vergessen wird.
- Als Nutzer möchte ich, dass der älteste Scan automatisch ausgewählt ist und ich per Klick oder Pfeiltasten wechseln kann, damit ich zügig durch den Stapel arbeite.
- Als Nutzer möchte ich, dass neu gescannte Dokumente automatisch in der Liste erscheinen, damit ich nicht ständig neu laden muss.
- Als Nutzer möchte ich nur fertig geschriebene PDFs sehen, damit ich kein halbes Dokument öffne.
- Als Nutzer möchte ich bei einem Verbindungsabbruch zum NAS weiterhin den letzten Stand sehen und informiert werden, damit ich nicht im Unklaren bin.

## Out of Scope
- Anzeige des PDF-Inhalts – PROJ-3 (PDF-Vorschau)
- KI-Analyse, Vorschläge, Umbenennen, Ablegen – PROJ-4 / PROJ-5
- Löschen / Verwerfen von Fehlscans – späteres eigenes Feature (noch ohne ID); vorerst im Explorer löschen
- Mehrfachauswahl und Stapelaktionen
- Andere Dateitypen als PDF (JPG, PNG, TIFF …)
- Unterordner im Eingangsordner
- Suche, Filter oder andere Sortierungen in der Liste
- Benachrichtigungen (Ton, Desktop-Notification) bei neuen Scans
- Mehrere Eingangsordner / FTP-Eingang (laut PRD Nicht-Ziel)
- Bedienung vom Handy (Tool läuft nur lokal auf 127.0.0.1)

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Liste & Inhalt
- [ ] Angenommen im Eingangsordner liegen PDF-Dateien, wenn der Nutzer die Hauptansicht öffnet, dann werden sie links in einer Liste angezeigt – je Eintrag mit Dateiname, Scan-Datum mit Uhrzeit (Änderungszeitpunkt) und Dateigrösse
- [ ] Angenommen mehrere Scans liegen im Eingang, wenn die Liste angezeigt wird, dann ist sie nach Scan-Datum sortiert, der älteste zuerst
- [ ] Angenommen ein Scan liegt länger als 7 Tage im Eingang, wenn die Liste angezeigt wird, dann ist er mit seiner Liegedauer markiert (z. B. „seit 9 Tagen")
- [ ] Angenommen Scans liegen im Eingang, wenn die Liste angezeigt wird, dann steht oben die Anzahl (z. B. „Eingang (3)")
- [ ] Angenommen im Eingangsordner liegen Unterordner, Nicht-PDF-Dateien, versteckte oder temporäre Dateien (z. B. `~$…`, `.tmp`), wenn die Liste angezeigt wird, dann erscheinen diese nicht
- [ ] Angenommen eine Datei hat die Endung `.PDF` (Grossbuchstaben), wenn die Liste angezeigt wird, dann erscheint sie wie jede andere PDF

### Leerer Eingang
- [ ] Angenommen im Eingangsordner liegen keine PDFs, wenn die Hauptansicht geöffnet wird, dann zeigt die Liste „Keine neuen Scans – alles abgelegt 🎉" und darunter den Pfad des Eingangsordners

### Auswahl
- [ ] Angenommen Scans liegen im Eingang, wenn die Hauptansicht geöffnet wird, dann ist der älteste Scan automatisch ausgewählt und deutlich hervorgehoben
- [ ] Angenommen ein Scan ist ausgewählt, wenn der Nutzer auf einen anderen Eintrag klickt, dann wird dieser ausgewählt
- [ ] Angenommen die Liste hat den Fokus, wenn der Nutzer ↓ bzw. ↑ drückt, dann wird der nächste bzw. vorherige Scan ausgewählt (am Listenende/-anfang bleibt die Auswahl stehen)
- [ ] Angenommen ein Scan ist ausgewählt, wenn dieser Scan aus dem Eingang verschwindet (abgelegt oder ausserhalb des Tools gelöscht), dann wird automatisch der nächste Scan ausgewählt – bzw. der vorherige, falls es der letzte war
- [ ] Angenommen ein Scan ist ausgewählt, wenn die Liste aktualisiert wird und der Scan noch existiert, dann bleibt er ausgewählt (auch wenn neue Scans hinzukommen)

### Aktualisierung
- [ ] Angenommen das Tool ist im Vordergrund geöffnet, wenn 30 Sekunden vergangen sind, dann wird die Liste automatisch aktualisiert
- [ ] Angenommen ein neuer Scan ist hinzugekommen, wenn die Liste aktualisiert wird, dann erscheint er an der richtigen Position und ist kurzzeitig als „neu" markiert
- [ ] Angenommen der Nutzer klickt auf „Aktualisieren", wenn die Liste neu geladen wird, dann zeigt der Knopf einen Ladezustand und die Liste ist danach aktuell
- [ ] Angenommen das Browserfenster bzw. der Tab ist im Hintergrund, wenn 30 Sekunden vergangen sind, dann wird keine Aktualisierung ausgelöst; beim Zurückkehren wird sofort aktualisiert

### Dateien im Schreibvorgang
- [ ] Angenommen der Scanner schreibt gerade eine Datei, wenn die Liste aktualisiert wird, dann erscheint die Datei erst, wenn sich ihre Grösse einige Sekunden lang nicht mehr verändert hat

### Fehlerfälle
- [ ] Angenommen die Liste wurde bereits geladen, wenn der Eingangsordner bei einer Aktualisierung nicht erreichbar ist, dann bleibt der letzte Stand ausgegraut sichtbar mit dem Hinweis „Eingangsordner nicht erreichbar – letzter Stand von [HH:MM]. Neuer Versuch läuft automatisch."
- [ ] Angenommen der Hinweis „nicht erreichbar" wird angezeigt, wenn der Ordner bei einer späteren Aktualisierung wieder erreichbar ist, dann verschwindet der Hinweis und die Liste ist wieder aktuell und bedienbar
- [ ] Angenommen der Eingangsordner wird während der Arbeit unerreichbar, wenn die Liste aktualisiert wird, dann erfolgt keine Umleitung auf die Einstellungsseite (die Sperre aus PROJ-1 greift nur beim Öffnen)
- [ ] Angenommen der lokale Server antwortet nicht, wenn die Liste geladen werden soll, dann wird eine verständliche Fehlermeldung mit Knopf „Erneut versuchen" angezeigt

## Edge Cases
- **Sehr viele Scans (z. B. 200+):** Liste bleibt bedienbar und scrollbar; Auswahl per Pfeiltaste scrollt den ausgewählten Eintrag in den sichtbaren Bereich.
- **Gleicher Zeitstempel bei mehreren Dateien:** stabile Reihenfolge (zusätzlich nach Dateiname sortiert), damit Einträge beim Aktualisieren nicht springen.
- **Datei wird umbenannt, während das Tool offen ist:** erscheint als neuer Eintrag; war die alte ausgewählt, greift die Regel „nächster Scan wird ausgewählt".
- **Sehr lange Dateinamen:** werden gekürzt mit „…" angezeigt; voller Name per Tooltip.
- **Datei mit Endung .pdf, aber 0 Byte:** wird nach der Stabilitätswartezeit angezeigt (Fehler beim Öffnen behandelt PROJ-3).
- **Scan-Datum in der Zukunft** (falsche Uhr am Scanner/NAS): wird normal angezeigt und einsortiert, keine „seit X Tagen"-Markierung.
- **Langsames NAS:** Aktualisierung darf die Bedienung (Auswahl, Pfeiltasten) nicht blockieren; Abbruch nach der Obergrenze aus PROJ-1 (10 s) → Hinweis „nicht erreichbar".
- **Eingangsordner in den Einstellungen geändert, während die Hauptansicht offen ist:** beim nächsten Aufruf der Hauptansicht wird der neue Ordner gelistet.

## Technical Requirements (optional)
- Läuft nur lokal (localhost), kein Login – Zugriffsschutz aus PROJ-1 gilt
- Erste Anzeige der Liste bei erreichbarem Ordner mit < 100 Dateien in < 1 s
- Automatische Aktualisierung darf die Oberfläche nicht einfrieren oder die Auswahl zurücksetzen
- Tastaturbedienbar (Pfeiltasten, Fokus sichtbar), Liste für Screenreader als Auswahlliste erkennbar

## Open Questions
- [ ] Wie lange soll „einige Sekunden" Stabilitätswartezeit konkret sein? (Vorschlag: 5 s – in /architecture festlegen; abhängig davon, wie schnell der Scanner aufs NAS schreibt)
- [ ] Wie lange bleibt die „neu"-Markierung sichtbar? (Vorschlag: bis zur Auswahl oder max. 1 Minute)

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Anzeige: Dateiname, Scan-Datum + Uhrzeit, Grösse | Reicht zum Unterscheiden; Inhalt zeigt PROJ-3 | 2026-11-21 |
| Sortierung älteste zuerst | Stapel wird der Reihe nach abgearbeitet; passt zum Erfolgskriterium „kein Scan > 1 Woche im Eingang" | 2026-11-21 |
| Markierung „seit X Tagen" ab 7 Tagen | Macht lange liegende Scans sichtbar (Erfolgskriterium) | 2026-11-21 |
| Automatische Aktualisierung alle 30 s + Knopf „Aktualisieren", Pause im Hintergrund | Neue Scans erscheinen ohne Zutun; NAS wird nicht unnötig abgefragt | 2026-11-21 |
| Ältester Scan automatisch ausgewählt, Wechsel per Klick und ↑/↓ | Sofort loslegen; Tastatur beschleunigt das Abarbeiten (< 30 s pro Dokument) | 2026-11-21 |
| Keine Mehrfachauswahl | Es wird immer genau ein Dokument geprüft und abgelegt | 2026-11-21 |
| Verschwindet der ausgewählte Scan → nächster wird ausgewählt | Nahtloser Ablauf nach dem Ablegen (PROJ-5) | 2026-11-21 |
| Nur PDFs direkt im Eingangsordner; Unterordner, andere Typen, versteckte/temporäre Dateien ignoriert | Scanner liefert PDFs; vermeidet Störungen durch Systemdateien | 2026-11-21 |
| Dateien im Schreibvorgang zurückhalten, bis Grösse stabil | Verhindert das Öffnen halb geschriebener PDFs (Scanner schreibt übers Netz aufs NAS) | 2026-11-21 |
| Bei Verbindungsabbruch letzten Stand ausgegraut zeigen statt umzuleiten | Kurze NAS-Aussetzer (z. B. Fritz!Box-Neustart) sollen die Arbeit nicht unterbrechen | 2026-11-21 |
| Leerer Eingang: „Keine neuen Scans – alles abgelegt 🎉" + Pfad | Positive Rückmeldung; Pfad zeigt, wo gesucht wird | 2026-11-21 |
| Kein Löschen/Verwerfen in PROJ-2 | Liste nur zum Anzeigen/Auswählen; Löschen auf dem NAS ist endgültig (kein Papierkorb) und braucht eigenes Konzept | 2026-11-21 |
| Anzahl der Scans im Listenkopf | Schneller Überblick über den Rückstand | 2026-11-21 |

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
