# PROJ-2: Eingangsliste

## Status: Deployed
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
- [x] Wie lange soll „einige Sekunden" Stabilitätswartezeit konkret sein? → 5 s (siehe Tech Design D); in QA mit echtem Scanner prüfen
- [x] Wie lange bleibt die „neu"-Markierung sichtbar? → bis zur Auswahl, längstens 60 s
- [ ] Setzt der Scanner/die Fritz!Box beim Schreiben auf das NAS die Änderungszeit laufend? (Annahme der Stabilitätsprüfung – in QA mit einem mehrseitigen Scan verifizieren; Rückfall über zweite Beobachtung greift sonst nach spätestens 30 s)

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
| Eingangsordner aus gespeicherten Einstellungen, kein Pfad in der Anfrage | Schnittstelle kann keine beliebigen Ordner auflisten | 2026-11-21 |
| Intervall-Abfrage (30 s) statt Dateisystem-Überwachung | Überwachung auf Netzlaufwerken unter Windows unzuverlässig; Intervall einfach und robust | 2026-11-21 |
| Stabilität: Änderungszeit ≥ 5 s alt ODER gleiche Grösse/Änderungszeit bei früherer Beobachtung ≥ 5 s zuvor | Keine Zusatzwartezeit; robust gegen abweichende NAS-Uhr | 2026-11-21 |
| Kennung eines Scans = Dateiname | Im Ordner eindeutig; Umbenennen erscheint korrekt als neuer Scan | 2026-11-21 |
| Erste Liste serverseitig mit der Seite ausliefern | Anzeige < 1 s, kein Ladeflackern | 2026-11-21 |
| Auswahlzustand zentral in der Arbeitsfläche, Auswahl-Regeln als reine Funktion | Wird von PROJ-3–5 genutzt; Regeln ohne Browser testbar | 2026-11-21 |
| Parallele, begrenzte Dateiabfragen + 10-s-Obergrenze, NAS-Vorprüfung aus PROJ-1 | Schnell bei vielen Dateien, ohne NAS zu überlasten; kein Hänger | 2026-11-21 |
| Ignorieren per Namensmuster (`.`, `~$`, `.tmp`, `.part`) statt Windows-Attribut „versteckt" | Attribut ist ohne Zusatzpaket nicht lesbar; Muster deckt Scanner-/Office-Temporärdateien ab | 2026-11-21 |
| Keine neuen Pakete | Vorhandene Bausteine reichen | 2026-11-21 |
| Ordnerprobleme als `status` mit HTTP 200 statt Fehlercode | Oberfläche unterscheidet „nicht erreichbar" (letzten Stand zeigen) von echten Serverfehlern | 2026-11-21 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick
Die Hauptseite wird zur **Arbeitsfläche mit drei Spalten**. PROJ-2 baut die linke Spalte (Eingangsliste) und das Gerüst der Arbeitsfläche; die mittlere (PDF-Vorschau, PROJ-3) und rechte Spalte (Vorschläge, PROJ-4/5) bleiben vorerst Platzhalter. Die **Auswahl** („welcher Scan ist gerade dran") wird zentral in der Arbeitsfläche gehalten, damit PROJ-3 bis PROJ-5 sie direkt nutzen können.

Wiederverwendet aus PROJ-1: Zugangsprüfung der Hauptseite, Einstellungen (Eingangsordner), schnelle NAS-Erreichbarkeitsprüfung + 10-s-Obergrenze, Zugriffsschutz für lokale Anfragen.

### A) Komponenten-Struktur

```
Hauptseite „/" (Zugangsprüfung aus PROJ-1 bleibt)
+-- Hinweis „API-Schlüssel fehlt" (aus PROJ-1, falls nötig)
+-- Arbeitsfläche (3 Spalten; auf schmalen Bildschirmen untereinander)
    +-- Linke Spalte: Eingangsliste
    |   +-- Kopf: „Eingang (3)" + Knopf „Aktualisieren" (mit Ladezustand)
    |   +-- Hinweisleiste „Eingangsordner nicht erreichbar – letzter Stand von 14:32 …"
    |   |   (nur bei Verbindungsabbruch; Liste darunter ausgegraut)
    |   +-- Scrollbare Auswahlliste (per Pfeiltasten bedienbar)
    |   |   +-- Eintrag je Scan
    |   |       +-- Dateiname (gekürzt, voller Name als Tooltip)
    |   |       +-- Scan-Datum + Uhrzeit · Grösse
    |   |       +-- Markierung „neu" (kurzzeitig) / „seit 9 Tagen" (ab 7 Tagen)
    |   +-- Leerer Zustand: „Keine neuen Scans – alles abgelegt 🎉" + Pfad
    |   +-- Fehlerzustand: „Liste konnte nicht geladen werden" + „Erneut versuchen"
    +-- Mittlere Spalte: Platzhalter „PDF-Vorschau" (PROJ-3) – zeigt vorerst Name des ausgewählten Scans
    +-- Rechte Spalte: Platzhalter „Vorschläge" (PROJ-4/5)
```

Verwendete vorhandene shadcn/ui-Bausteine: ScrollArea, Button, Badge, Alert, Tooltip, Skeleton, Card, Separator. Keine neuen Bausteine nötig.

### B) Datenmodell

```
Eingangsliste (vom Server geliefert, nicht gespeichert):
- Eingangsordner (Pfad)
- Zustand: erreichbar / nicht erreichbar / nicht gefunden / kein Zugriff
- Zeitpunkt der Abfrage
- Scans (nur fertig geschriebene PDFs), je Scan:
  - Kennung = Dateiname (im Ordner eindeutig)
  - Dateiname
  - Grösse in Bytes
  - Scan-Datum = letzter Änderungszeitpunkt der Datei

Nur im Browser (flüchtig, nicht gespeichert):
- Ausgewählter Scan (Kennung)
- Letzter erfolgreich geladener Stand + Uhrzeit (für die ausgegraute Anzeige)
- Welche Scans als „neu" markiert sind und seit wann

Nur im Server-Arbeitsspeicher (flüchtig):
- Zuletzt beobachtete Grösse/Änderungszeit je Datei (für die Erkennung „noch im Schreibvorgang")
```

Keine Datenbank, keine neue Datei auf der Festplatte.

### C) Server-Schnittstelle (in Worten)

| Schnittstelle | Zweck |
|---------------|-------|
| Eingang auflisten | Liest den **gespeicherten** Eingangsordner (kein Pfad aus der Anfrage!), filtert und sortiert die PDFs, liefert Liste + Zustand. Bei unerreichbarem NAS: Zustand „nicht erreichbar" in ~2 s statt Fehler |

Die Hauptseite liefert beim ersten Aufruf die Liste bereits mit (serverseitig geladen) → kein Ladeflackern, Anzeige sofort. Danach aktualisiert der Browser über die Schnittstelle.

### D) Abläufe

**Filtern:** nur Dateien direkt im Ordner, Endung `.pdf` (gross/klein egal); ignoriert werden Unterordner, Dateien beginnend mit `.` oder `~$`, Endungen `.tmp`/`.part`.

**„Noch im Schreibvorgang" (Stabilitätsprüfung, 5 s):** Eine Datei erscheint, sobald ihre letzte Änderung mindestens 5 s zurückliegt. Weil die Uhr des NAS von der des PCs abweichen kann (Edge Case „Datum in der Zukunft"), gilt zusätzlich: Hat der Server die Datei bei einer früheren Abfrage vor ≥ 5 s mit gleicher Grösse und Änderungszeit gesehen, gilt sie ebenfalls als fertig.

**Sortierung:** nach Scan-Datum aufsteigend, bei Gleichstand nach Dateiname → stabile Reihenfolge.

**Aktualisierung im Browser:**
- alle 30 s, nur wenn der Tab sichtbar ist; beim Zurückkehren in den Tab sofort
- Knopf „Aktualisieren" löst sofort aus; parallele Abfragen werden vermieden
- bei Fehler/„nicht erreichbar": letzter Stand bleibt, ausgegraut, mit Uhrzeit; keine Umleitung

**Auswahl-Regeln** (als eigene, separat testbare Logik):
- Start: ältester Scan
- Ausgewählter Scan existiert nach Aktualisierung noch → bleibt ausgewählt
- Ausgewählter Scan verschwunden → der Scan, der jetzt an seiner Position steht (= nächster); war es der letzte → der neue letzte (= vorheriger); Liste leer → keine Auswahl
- ↑/↓ bewegen die Auswahl, am Anfang/Ende bleibt sie stehen; ausgewählter Eintrag wird in den sichtbaren Bereich gescrollt

**„Neu"-Markierung:** Scans, die nach dem ersten Laden hinzukommen, sind „neu", bis sie ausgewählt werden, längstens 60 s.

**„Seit X Tagen":** im Browser aus Scan-Datum und heutigem Datum berechnet; ab 7 Tagen angezeigt; bei Datum in der Zukunft keine Markierung.

### E) Technische Entscheidungen (Begründung)

- **Ordner kommt aus den gespeicherten Einstellungen, nicht aus der Anfrage:** Die Schnittstelle kann so nur den eingestellten Eingang auflisten – kein „Ordner-Durchsuchen" beliebiger Pfade, auch nicht bei einer manipulierten Anfrage.
- **Abfrage per Intervall (30 s) statt Ordner-Überwachung:** Dateisystem-Überwachung ist auf Netzlaufwerken (NAS) unter Windows unzuverlässig und hält eine Dauerverbindung offen. Ein Intervall ist einfach, robust und deckt die Anforderung ab.
- **Stabilitätsprüfung über Änderungszeit + Beobachtung:** Ohne zusätzliche Wartezeit beim Laden (keine doppelte Abfrage nötig) und trotzdem robust gegen abweichende NAS-Uhren.
- **Erste Liste serverseitig mitliefern:** erfüllt „< 1 s bis zur Anzeige" und vermeidet einen leeren Zwischenzustand.
- **Auswahl zentral in der Arbeitsfläche:** PROJ-3 (Vorschau) und PROJ-4/5 (Vorschläge, Ablegen) hängen alle am ausgewählten Scan.
- **Auswahl-Regeln als reine, separat getestete Logik:** die Regeln (nächster/vorheriger/bleibt) sind fehleranfällig und sollen ohne Browser testbar sein.
- **Dateien parallel, aber begrenzt abfragen:** Grösse/Datum jeder Datei werden mit begrenzter Parallelität gelesen – schnell bei vielen Scans, ohne das NAS zu überlasten. Gesamte Abfrage nutzt die 10-s-Obergrenze aus PROJ-1.
- **Datum/Zeit im Schweizer Format** (`21.11.2026, 09:35`), Grösse in KB/MB.

### F) Abhängigkeiten (zu installieren)
Keine. Alles mit vorhandenen Paketen (Next.js, shadcn/ui, lucide-react, Zod) umsetzbar.

## Implementation Notes (Frontend)
_Stand 2026-11-21 – /frontend_

**Gebaut:**
- `src/components/inbox/inbox-workspace.tsx` – Arbeitsfläche (3 Spalten ab `lg`, darunter untereinander), hält die Auswahl zentral, wendet die Auswahl-Regeln bei jeder Listenänderung an, entfernt „neu" bei Auswahl; Platzhalter für PROJ-3 und PROJ-4/5
- `src/components/inbox/inbox-list.tsx` – Kopf „Eingang (n)" + „Aktualisieren", Hinweis bei veraltetem Stand (ausgegraut, Uhrzeit), Ladeskelett, Fehlerzustand mit „Erneut versuchen", leerer Zustand mit Pfad, Auswahlliste (`role="listbox"`, ↑/↓, ausgewählter Eintrag wird in den sichtbaren Bereich gescrollt)
- `src/components/inbox/inbox-list-item.tsx` – Eintrag: Name (gekürzt + Tooltip), Datum/Uhrzeit · Grösse, Badges „neu" / „seit X Tagen"
- `src/hooks/use-inbox.ts` – Laden, 30-s-Intervall nur bei sichtbarem Tab, sofortige Aktualisierung beim Zurückkehren, keine parallelen Abfragen, letzter guter Stand bleibt bei Fehler/„nicht erreichbar", „neu"-Markierung (bis Auswahl, max. 60 s)
- `src/lib/inbox-types.ts` – API-Vertrag (`InboxResponse`, `InboxFile`)
- `src/lib/inbox-selection.ts` + Test – Auswahl-Regeln (13 Tests)
- `src/lib/inbox-format.ts` + Test – Schweizer Datum/Uhrzeit, Grösse, „seit X Tagen" ab 7 Tagen, keine Markierung bei Zukunftsdatum (5 Tests)
- `src/lib/inbox-api.ts` – Browser-Client für `GET /api/inbox`
- `src/app/page.tsx` – zeigt die Arbeitsfläche (Zugangsprüfung aus PROJ-1 unverändert); `initialInbox` vorerst `null` → Liste lädt im Browser

**Erwartete API (Backend):** `GET /api/inbox` → `InboxResponse` (siehe `inbox-types.ts`); bei nicht erreichbarem Ordner HTTP 200 mit `status: "unreachable"` und leerer Liste. Zusätzlich serverseitige Funktion für die Erstauslieferung der Liste mit der Seite.

**Visuell geprüft** (Screenshots mit simulierten Daten, 1440 px und 375 px): Auswahl, ↓-Taste, „neu", „seit 13 Tagen", Kürzung langer Namen, kein horizontales Scrollen.

**Abweichungen / Hinweise:**
- Zwei Layout-Fallen behoben: shadcn-ScrollArea (Radix) rendert ihren Inhalt als Tabelle → lange Namen verbreiterten die Liste (per Klasse auf `block` gezwungen, Komponente selbst unverändert); einspaltiges Raster auf Mobile wuchs mit dem Inhalt (`grid-cols-1`).
- Nebenbei: Typfehler in einem PROJ-1-Test (`test-connection.test.ts`, Mock-Rückgabewert) behoben – `next build` prüft Testdateien nicht, `tsc` schon.

## Implementation Notes (Backend)
_Stand 2026-11-21 – /backend_

**Keine Datenbank.** Nur eine Server-Funktion und eine Route.

**API:** `GET /api/inbox` (`src/app/api/inbox/route.ts`) → `InboxResponse`. Ordnerprobleme kommen als `status` mit HTTP 200 (`unreachable` / `not_found` / `no_access` / `not_a_directory`), damit die Oberfläche den letzten Stand weiter zeigen kann; nur unerwartete Fehler → 500. Zugriffsschutz aus PROJ-1 (`local-guard`).

**Server-Logik** `src/lib/server/inbox.ts` → `listInbox()`:
- Ordner ausschliesslich aus den gespeicherten Einstellungen (Query-Parameter werden ignoriert – per Test geprüft)
- NAS-Vorprüfung (`networkGuard`, ~2 s) + 10-s-Obergrenze aus PROJ-1
- Filter: nur Dateien, Endung `.pdf` (gross/klein egal), nicht beginnend mit `.` oder `~$`
- Grösse/Änderungszeit per `stat`, max. 16 parallel; zwischenzeitlich verschwundene Dateien werden übersprungen
- Stabilität (5 s): Änderungszeit ≥ 5 s alt **oder** gleiche Grösse/Änderungszeit seit ≥ 5 s beobachtet (In-Memory-Map, verschwundene Dateien werden daraus entfernt)
- Sortierung: Änderungszeit aufsteigend, bei Gleichstand Dateiname
- `src/lib/server/folders.ts`: `networkGuard` exportiert (wiederverwendet)

**Hauptseite:** `src/app/page.tsx` liefert die erste Liste serverseitig mit (`initialInbox={await listInbox()}`) → keine Ladeanzeige beim Öffnen.

**Tests:** 13 Integrationstests (`src/app/api/inbox/inbox.test.ts`, echte Temp-Ordner, simulierte Uhr): Sortierung, Filter, gleiche Zeitstempel, leerer Eingang, Datei im Schreibvorgang, Freigabe nach 5 s, Zukunftsdatum (zweite Beobachtung), wachsende Datei bleibt verborgen, gelöschter Ordner, nicht konfiguriert, NAS nicht erreichbar < 5 s, Query-Parameter ignoriert, fremde Website → 403. Gesamt: Vitest 82/82, `tsc` sauber, PROJ-1-E2E (Chromium) 32/32 als Regression.

**Live geprüft** (echtes NAS `\\fritz.box\FRITZ.NAS\FRITZ\Scanner`): `GET /api/inbox` in 0,08 s, liefert `CHENGPR006_004617.pdf` (2,5 MB, 13.11.2026); Hauptseite in 0,45 s; fremder Origin → 403.

## QA Test Results

**Tested:** 2026-11-21
**App URL:** http://127.0.0.1:3000 (live mit NAS) · http://127.0.0.1:3100 (isolierter E2E-Server)
**Tester:** QA Engineer (AI)
**Browser:** Chromium 145, Firefox 146, WebKit 26 (Desktop Safari), WebKit iPhone 13

### Automatisierte Tests
- **Vitest:** 91/91 grün – neu: 9 Hook-Tests für `useInbox` (`src/hooks/use-inbox.test.ts`: Intervall, Pause im Hintergrund, Sofort-Aktualisierung bei Rückkehr, „neu"-Markierung inkl. 60 s, letzter Stand bei „nicht erreichbar"/Serverfehler, keine parallelen Abfragen)
- **Playwright:** `tests/PROJ-2-eingangsliste.spec.ts` – 27 Tests × 4 Browser-Profile = 108 Läufe: **100 grün, 8 rot** (= 2 Tests × 4 Browser, beide BUG-1); PROJ-1-Suite als Regression: 128/128 grün
- Timer-Tests (AC13/AC16) zusätzlich 3× wiederholt in allen Browsern: 24/24 grün

### Acceptance Criteria Status

#### Liste & Inhalt
- [x] AC1 Name, Datum/Uhrzeit (`21.11.2026, 09:35`), Grösse; keine Konsolen-/Hydration-Fehler
- [x] AC2 Älteste zuerst
- [x] AC3 „seit X Tagen" ab 7 Tagen, darunter keine Markierung
- [x] AC4 Anzahl im Kopf „Eingang (3)"
- [x] AC5 Unterordner, JPG, `~$…`, `.versteckt.pdf`, `.pdf.part` ignoriert
- [x] AC6 `.PDF` wird angezeigt

#### Leerer Eingang
- [x] AC7 „Keine neuen Scans – alles abgelegt 🎉" + Pfad, „Eingang (0)"

#### Auswahl
- [x] AC8 Ältester Scan beim Öffnen ausgewählt
- [x] AC9 Klick wählt aus
- [x] AC10 ↑/↓ wechseln, an den Enden bleibt die Auswahl stehen (Klick fokussiert die Liste, Tastatur funktioniert danach direkt)
- [x] **AC11 (BUG-1 behoben):** Verschwindet der ausgewählte Scan, springt die Auswahl auf den **ältesten** statt auf den nächsten (bzw. vorherigen)
- [x] AC12 Auswahl bleibt bei Aktualisierung mit neuen Scans erhalten

#### Aktualisierung
- [x] AC13 Automatische Aktualisierung nach 30 s
- [x] AC14 Neuer Scan erscheint an richtiger Stelle mit „neu"; Auswahl entfernt die Markierung
- [x] AC15 „Aktualisieren" mit Ladezustand (deaktiviert, Spinner)
- [x] AC16 Im Hintergrund keine Abfrage (90 s geprüft), beim Zurückkehren sofort

#### Dateien im Schreibvorgang
- [x] AC17 Frisch geschriebene Datei erscheint erst nach ≥ 5 s Stillstand

#### Fehlerfälle
- [x] AC18 Ordner weg / NAS nicht erreichbar → letzter Stand ausgegraut, Hinweis mit Uhrzeit „… – letzter Stand von HH:MM. Neuer Versuch läuft automatisch."
- [x] AC19 Ordner wieder da → Hinweis verschwindet, Liste wieder normal
- [x] AC20 Keine Umleitung auf Einstellungen während der Arbeit
- [x] AC21 Server antwortet nicht → „Liste konnte nicht aktualisiert werden – letzter Stand von …", Liste bleibt. *Hinweis:* Da die erste Liste mit der Seite kommt, erscheint der Zustand „Liste konnte nicht geladen werden" + „Erneut versuchen" praktisch nur, wenn schon die Seite nicht lädt; der Knopf „Aktualisieren" übernimmt die Rolle von „Erneut versuchen".

### Edge Cases Status
- [x] 210 Scans: Liste scrollt, ↓ hält Auswahl im sichtbaren Bereich
- [x] Gleicher Zeitstempel → stabile Reihenfolge nach Name (auch nach Aktualisierung)
- [x] Umbenannte Datei: erscheint korrekt als neuer Eintrag, Auswahl rückt nach (nach Fix BUG-1)
- [x] Sehr lange Namen gekürzt, kein horizontales Scrollen (375 px)
- [x] 0-Byte-Datei: wird angezeigt (Öffnen → PROJ-3)
- [x] Datum in der Zukunft: erscheint nach zweiter Beobachtung, keine „seit"-Markierung
- [x] Langsames/fehlendes NAS: keine Blockade (Fix aus PROJ-1 greift, ~2 s)
- [x] Eingangsordner geändert → neuer Ordner beim nächsten Aufruf (Ordner wird bei jeder Abfrage aus den Einstellungen gelesen)
- [ ] Nicht testbar ohne echten Scan: setzt die Fritz!Box die Änderungszeit während des Schreibens laufend? (offene Frage bleibt offen – bitte einmal mehrseitig scannen und beobachten, ob ein halbes PDF auftaucht)

### Responsive
- [x] 375 / 768 / 1440 px in allen 4 Browser-Profilen: Liste bedienbar, kein horizontales Scrollen

### Security Audit Results
- [x] Nur lokal: fremder Host (DNS-Rebinding), fremder Origin, `Sec-Fetch-Site: cross-site` → 403; POST → 405
- [x] Kein Ordner-Durchsuchen: Query-Parameter `?path=…` wird ignoriert, es wird nur der gespeicherte Eingang gelistet (Integrationstest + live)
- [x] XSS: Dateiname `<img src=x onerror=alert(1)>.pdf` (simulierte NAS-Antwort) wird als Text angezeigt, kein Skript ausgeführt
- [x] Keine sensiblen Daten: Antwort enthält nur Ordnerpfad, Dateinamen, Grösse, Datum
- [x] Last: 20 Abfragen direkt hintereinander je 0,07–0,12 s gegen das echte NAS, keine Fehler; Oberfläche verhindert parallele Abfragen

### Bugs Found

#### BUG-1: Auswahl springt auf den ältesten statt auf den nächsten Scan
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Drei Scans im Eingang (1, 2, 3), Scan 2 anklicken
  2. Scan 2 im Explorer löschen (oder später: mit PROJ-5 ablegen), „Aktualisieren"
  3. Expected: Scan 3 ist ausgewählt (beim letzten Scan: der vorherige)
  4. Actual: Scan 1 (der älteste) ist ausgewählt – in allen 4 Browsern
- **Ursache (Hinweis für Entwicklung):** `inbox-workspace.tsx` ruft die Auswahl-Regel in einem React-Updater auf (`setSelected(current => reconcileSelection(prevIds.current, …))`) und überschreibt `prevIds.current` direkt danach. Der Updater läuft erst beim nächsten Rendern und sieht dann bereits die *neue* Liste als „vorherige" → Regel fällt auf „ältester" zurück. Die Regel selbst (`inbox-selection.ts`) ist korrekt (Unit-Tests grün).
- **Auswirkung:** Gering beim Abarbeiten von oben nach unten (ältester = nächster); spürbar, sobald man einen Scan aus der Mitte bearbeitet – nach dem Ablegen (PROJ-5) springt die Auswahl dann nach oben.
- **Priority:** Vor PROJ-5 beheben (kleiner Fix); E2E-Tests (AC11, „Umbenannte Datei") prüfen ihn bereits und werden nach dem Fix grün.
- **Status: BEHOBEN (2026-11-21).** `prevIds.current` wird vor `setSelected` in eine lokale Variable gelesen. Nachtest: Vitest 91/91, PROJ-2-E2E 108/108 grün (AC11 und „Umbenannte Datei" in allen 4 Browsern; ein einmaliger Ausreißer in Firefox bei AC5+AC6 lief bei 3 Wiederholungen stabil grün).

### Beobachtungen (keine Bugs)
- Dateien mit Windows-Attribut „versteckt" und Endung `.pdf` werden angezeigt – bewusste Entscheidung (Ignorieren nur per Namensmuster, siehe Technical Decisions).
- Testinfrastruktur: Server-gerenderte Seite ist sichtbar, bevor das Browser-JavaScript läuft – Timer-Tests warten deshalb auf `networkidle` (ohne das waren sie in Firefox/Safari instabil). Kein App-Fehler.
- Live mit NAS: echter Scan `CHENGPR006_004617.pdf` wird angezeigt, Abfrage 0,08 s.

### Summary
- **Acceptance Criteria:** 21/21 passed (AC11 nach Fix von BUG-1)
- **Edge Cases:** 8/9 ok, 1 nur mit echtem Scan prüfbar
- **Bugs Found:** 1 total (0 critical, 0 high, 1 medium, 0 low) – BUG-1 behoben
- **Security:** Pass
- **Production Ready:** YES

## Deployment
**Deployed:** 2026-11-21 – lokaler Produktivbetrieb (kein Hosting, laut PRD nur auf dem eigenen PC)
**URL:** http://127.0.0.1:3030 (nur lokal erreichbar, Server lauscht ausschliesslich auf 127.0.0.1)
**Version:** Git-Tag `v1.3.0-PROJ-3` (Release mit PROJ-1, PROJ-2, PROJ-3)

- Start: Doppelklick auf `ScanTool.cmd` im Projektordner (bzw. Desktop-Verknüpfung darauf) oder `npm run live` – baut beim ersten Mal, startet den Produktions-Server und öffnet den Browser. Fenster offen lassen; Schliessen beendet ScanTool. Läuft ScanTool schon, wird nur der Browser geöffnet.
- Nach Code-Änderungen: ScanTool-Fenster schliessen, `npm run live:build`, neu starten.
- Eigener Build-Ordner `.next-live` und Port 3030 → Dev-Server (3000) und E2E-Builds (`.next`, 3100) stören den Produktivbetrieb nicht.
- Einstellungen (`data/settings.json`) und API-Schlüssel (`.env.local`) sind dieselben wie im Dev-Betrieb.
- Geprüft: Build ok, 126/126 Unit-/Integrationstests, Start/zweiter Start, Hauptansicht mit echten NAS-Scans und Vorschau in Chrome ohne Fehler, Bindung nur auf 127.0.0.1.
- Vercel, Sentry, Lighthouse und Rate-Limiting aus dem Standard-Deploy-Skill entfallen (lokales Einzelnutzer-Tool ohne Internet-Zugang von aussen).
