# PROJ-3: PDF-Vorschau

## Status: Planned
**Created:** 2026-11-21
**Last Updated:** 2026-11-21

## Dependencies
- Requires: PROJ-1 (Einstellungen & Setup) – gültiger Eingangsordner
- Requires: PROJ-2 (Eingangsliste) – ausgewählter Scan bestimmt, was angezeigt wird; Auswahl-Regeln bei verschwundenen Scans

## User Stories
- Als Nutzer möchte ich den in der Liste ausgewählten Scan sofort in der mittleren Spalte sehen, damit ich weiss, um welches Dokument es sich handelt.
- Als Nutzer möchte ich bei mehrseitigen Scans alle Seiten untereinander durchscrollen und gezielt zu einer Seite springen können, damit ich nichts übersehe.
- Als Nutzer möchte ich hinein- und herauszoomen sowie zwischen „Breite anpassen" und „ganze Seite" wechseln können, damit ich kleine Beträge und Daten lesen und trotzdem das Layout überblicken kann.
- Als Nutzer möchte ich quer oder kopfüber eingescannte Seiten in der Ansicht drehen können, damit ich sie lesen kann, ohne die Datei zu verändern.
- Als Nutzer möchte ich einen Scan in einem neuen Browser-Tab öffnen können, damit ich ihn drucken, im Text suchen oder in voller Grösse ansehen kann.
- Als Nutzer möchte ich bei beschädigten, geschützten oder nicht mehr vorhandenen Dateien eine verständliche Meldung sehen, damit ich weiss, was los ist.

## Out of Scope
- PDF bearbeiten: Drehen speichern, Seiten löschen, zusammenfügen, trennen (laut PRD Nicht-Ziel)
- Passworteingabe für geschützte PDFs
- Eigener Vollbildmodus in ScanTool (abgedeckt durch „In neuem Tab öffnen")
- Textsuche, Markieren, Kopieren und Drucken innerhalb der Vorschau (über den neuen Tab möglich)
- Miniaturansichten / Seitenleiste mit Thumbnails
- Anzeige anderer Dateitypen als PDF (Liste zeigt nur PDFs, PROJ-2)
- Merken von Zoom/Drehung pro Scan oder über einen Scan-Wechsel hinaus
- KI-Analyse und Bearbeitung der Felder (rechte Spalte) – PROJ-4 / PROJ-5
- Hervorheben der von der KI erkannten Stellen im PDF – ggf. später

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Anzeige
- [ ] Angenommen ein Scan ist in der Eingangsliste ausgewählt, wenn die Hauptansicht angezeigt wird, dann erscheint sein Inhalt in der mittleren Spalte
- [ ] Angenommen der Nutzer wählt in der Liste einen anderen Scan (Klick oder ↑/↓), wenn die Auswahl wechselt, dann zeigt die Vorschau den neu gewählten Scan
- [ ] Angenommen ein Scan hat mehrere Seiten, wenn er angezeigt wird, dann stehen alle Seiten untereinander und lassen sich durchscrollen
- [ ] Angenommen ein mehrseitiger Scan wird angezeigt, wenn der Nutzer scrollt, dann zeigt die Bedienleiste die aktuelle Seite an (z. B. „Seite 2 von 3")
- [ ] Angenommen ein mehrseitiger Scan wird angezeigt, wenn der Nutzer auf „nächste Seite" bzw. „vorherige Seite" klickt, dann springt die Ansicht zum Anfang der nächsten bzw. vorherigen Seite (auf der ersten/letzten Seite ist der jeweilige Knopf deaktiviert)
- [ ] Angenommen kein Scan ist ausgewählt (z. B. leerer Eingang), wenn die Hauptansicht angezeigt wird, dann zeigt die mittlere Spalte den Platzhalter „Kein Scan ausgewählt"

### Zoom
- [ ] Angenommen ein Scan wird neu angezeigt, wenn er erscheint, dann ist er auf „Breite anpassen" eingestellt (Seitenbreite = Spaltenbreite, kein seitliches Scrollen)
- [ ] Angenommen ein Scan wird angezeigt, wenn der Nutzer „+" bzw. „−" klickt, dann wird stufenweise vergrössert bzw. verkleinert (Bereich 50 % – 300 %) und der aktuelle Wert angezeigt (z. B. „125 %"); an den Grenzen ist der jeweilige Knopf deaktiviert
- [ ] Angenommen ein Scan wird angezeigt, wenn der Nutzer „ganze Seite" wählt, dann wird die aktuelle Seite vollständig in die Spalte eingepasst (Höhe und Breite sichtbar)
- [ ] Angenommen der Nutzer hat gezoomt, wenn er „Breite anpassen" wählt, dann wird wieder auf Spaltenbreite eingepasst
- [ ] Angenommen der Mauszeiger ist über der Vorschau, wenn der Nutzer Strg + Mausrad betätigt, dann zoomt die Vorschau (nicht die ganze Browserseite)
- [ ] Angenommen der Nutzer hat gezoomt oder gedreht, wenn er einen anderen Scan auswählt, dann startet dieser wieder mit „Breite anpassen" und ohne Drehung

### Drehen
- [ ] Angenommen ein Scan wird angezeigt, wenn der Nutzer auf „90° links" klickt, dann wird die Ansicht um 90° gegen den Uhrzeigersinn gedreht
- [ ] Angenommen ein Scan wird angezeigt, wenn der Nutzer auf „90° rechts" klickt, dann wird die Ansicht um 90° im Uhrzeigersinn gedreht
- [ ] Angenommen ein Scan wird angezeigt, wenn der Nutzer auf „180°" klickt, dann wird die Ansicht auf den Kopf gedreht
- [ ] Angenommen die Ansicht ist bereits gedreht, wenn der Nutzer einen weiteren Dreh-Knopf klickt, dann addiert sich die Drehung zur aktuellen Lage (z. B. „90° rechts" + „90° links" = Ausgangslage; „180°" zweimal = Ausgangslage)
- [ ] Angenommen der Nutzer hat die Ansicht gedreht, wenn er die Datei danach im Explorer oder im neuen Tab öffnet, dann ist die Datei unverändert

### In neuem Tab öffnen
- [ ] Angenommen ein Scan ist ausgewählt, wenn der Nutzer auf „In neuem Tab öffnen" klickt, dann öffnet sich der Scan im PDF-Viewer des Browsers in einem neuen Tab

### Laden & Leistung
- [ ] Angenommen ein Scan wird geladen, wenn die Anzeige noch nicht bereit ist, dann sieht der Nutzer einen Platzhalter in Seitenform mit Ladeanzeige (keine leere weisse Fläche)
- [ ] Angenommen ein üblicher Scan (1–3 Seiten, einige MB) auf der NAS wird ausgewählt, wenn er geladen wird, dann ist die erste Seite innerhalb von 2 Sekunden sichtbar
- [ ] Angenommen ein grosser Scan (z. B. 30 Seiten) wird ausgewählt, wenn er geladen wird, dann erscheint die erste Seite zuerst und weitere Seiten werden beim Scrollen nachgeladen
- [ ] Angenommen der Nutzer wechselt mit ↑/↓ schnell durch mehrere Scans, wenn die Ladevorgänge enden, dann wird ausschliesslich der zuletzt gewählte Scan angezeigt (kein Aufflackern älterer Scans)

### Fehlerfälle
- [ ] Angenommen die Datei ist beschädigt oder kein gültiges PDF, wenn sie angezeigt werden soll, dann erscheint „Dieser Scan lässt sich nicht anzeigen – die Datei ist beschädigt oder kein gültiges PDF." mit dem Knopf „In neuem Tab öffnen"; die Auswahl in der Liste bleibt bestehen
- [ ] Angenommen das PDF ist passwortgeschützt, wenn es angezeigt werden soll, dann erscheint „Dieser Scan ist passwortgeschützt und kann nicht angezeigt werden."
- [ ] Angenommen der ausgewählte Scan wurde inzwischen gelöscht oder verschoben, wenn er angezeigt werden soll, dann erscheint „Der Scan ist nicht mehr im Eingang.", die Liste wird aktualisiert und die Auswahl springt nach den Regeln aus PROJ-2 weiter
- [ ] Angenommen die NAS ist nicht erreichbar, wenn ein Scan angezeigt werden soll, dann erscheint „Eingangsordner nicht erreichbar – ist die NAS eingeschaltet?" mit dem Knopf „Erneut versuchen"

### Darstellung
- [ ] Angenommen das Browserfenster ist breit (Desktop), wenn die Hauptansicht angezeigt wird, dann steht die Vorschau in der mittleren von drei Spalten
- [ ] Angenommen das Browserfenster ist schmal (unter ca. 1024 px), wenn die Hauptansicht angezeigt wird, dann steht die Vorschau unter der Liste mit einer festen Höhe von ca. 70 % des Fensters, ist in sich scrollbar, die Bedienleiste bleibt erreichbar und die Seite scrollt nicht seitlich

## Edge Cases
- **Querformat-Seite** (z. B. Kassenbon quer gescannt): „Breite anpassen" passt sie auf Spaltenbreite ein; mit „90° links" bzw. „90° rechts" lesbar machen.
- **Gemischte Seitengrössen** in einem PDF (A4 + Kassenbon): jede Seite wird in ihrer eigenen Proportion dargestellt; Seitenzähler stimmt trotzdem.
- **Einseitiger Scan:** Seitenzähler zeigt „Seite 1 von 1", Blätterknöpfe sind deaktiviert.
- **Sehr grosser Scan** (30+ Seiten, 20+ MB): keine Grössengrenze; erste Seite zuerst, Rest beim Scrollen; die App bleibt bedienbar.
- **Datei verschwindet während der Anzeige** (im Explorer gelöscht, während sie offen ist): bereits angezeigte Seiten dürfen bleiben; spätestens bei der nächsten Listen-Aktualisierung (PROJ-2) springt die Auswahl weiter und die Vorschau folgt.
- **Datei mit `.pdf`-Endung, aber anderem Inhalt** (z. B. umbenanntes JPG): Meldung „beschädigt oder kein gültiges PDF".
- **NAS kurz weg, Scan war schon geladen:** bereits angezeigter Scan bleibt sichtbar; Meldung erst beim nächsten Ladeversuch.
- **Dateiname mit Sonderzeichen** (Umlaute, Leerzeichen, `#`, `%`, `&`): wird korrekt angezeigt und im neuen Tab geöffnet.
- **Gleicher Scan erneut gewählt:** kein unnötiges Neuladen, Zoom und Scrollposition bleiben.
- **Datei wird im Hintergrund ersetzt** (gleicher Name, neuer Inhalt): wird beim nächsten Auswählen mit dem neuen Inhalt angezeigt (kein veralteter Zwischenspeicher).

## Technical Requirements (optional)
- **Performance:** erste Seite eines üblichen Scans ≤ 2 s ab Auswahl, auch vom NAS; ↑/↓-Wechsel ohne spürbare Verzögerung der Liste.
- **Sicherheit:** Es dürfen ausschliesslich PDF-Dateien aus dem konfigurierten Eingangsordner ausgeliefert werden – kein Zugriff auf andere Ordner (z. B. über `..` oder absolute Pfade im Dateinamen). Gleicher lokaler Schutz wie bei PROJ-1/PROJ-2 (nur localhost, keine fremden Webseiten).
- **Unveränderlichkeit:** Die Vorschau verändert die Datei nie (nur lesen).
- **Browser:** Chrome, Edge, Firefox, Safari (aktuelle Versionen).
- **Barrierefreiheit:** alle Bedienknöpfe per Tastatur erreichbar und mit verständlicher Beschriftung (Tooltip/aria-label).

## Open Questions
- [ ] Reicht die 2-Sekunden-Grenze bei grossen Scans vom NAS in der Praxis? Mit echten mehrseitigen Scans messen (siehe auch offene Frage zur Änderungszeit in PROJ-2).

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Alle Seiten untereinander (Endlos-Scroll) statt seitenweisem Blättern; zusätzlich Seitenzähler und Sprungknöpfe | Rechnungen haben meist 1–2 Seiten – alles auf einen Blick ohne Klicken; Sprungknöpfe helfen bei längeren Dokumenten | 2026-11-21 |
| Standard-Zoom „Breite anpassen", zusätzlich „ganze Seite", „+"/„−" (50–300 %) und Strg + Mausrad | Beträge/Daten gut lesbar ohne seitliches Scrollen; „ganze Seite" für den Layout-Überblick (vom Nutzer gewünscht) | 2026-11-21 |
| Zoom und Drehung werden beim Scan-Wechsel zurückgesetzt | Jeder Scan startet vorhersehbar; kein Merken nötig, hält das MVP einfach | 2026-11-21 |
| Drehen nur in der Ansicht, Datei bleibt unverändert | PRD schliesst PDF-Bearbeitung aus; die KI-Analyse (PROJ-4) ist unabhängig von der Anzeige-Ausrichtung | 2026-11-21 |
| Drei Dreh-Knöpfe: „90° links", „90° rechts", „180°" (wirken relativ zur aktuellen Lage) | Vom Nutzer gewünscht: jede Ausrichtung mit einem Klick, kopfüber gescannte Seiten direkt mit „180°" | 2026-11-21 |
| „In neuem Tab öffnen" statt eigenem Vollbildmodus | Browser-Viewer bietet Drucken, Textsuche, Vollbild bereits – nichts nachbauen | 2026-11-21 |
| Verständliche Meldung je Fehlerfall, Auswahl bleibt bestehen; keine Passworteingabe | Nutzer weiss, was los ist; geschützte Scans sind beim eigenen Scanner unwahrscheinlich | 2026-11-21 |
| Keine Grössengrenze; erste Seite zuerst, Rest beim Scrollen | Auch grosse Scans müssen ansehbar sein; Wartezeit nur dort, wo sie anfällt | 2026-11-21 |
| Schmale Fenster: Spalten untereinander, Vorschau mit fester Höhe (~70 %) | Tool wird am PC genutzt, aber schmale Fenster kommen vor; konsistent mit PROJ-2 | 2026-11-21 |

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
