# PROJ-3: PDF-Vorschau

## Status: Architected
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
| Eigener Betrachter mit react-pdf (PDF.js) statt iframe mit Browser-Viewer | Eigene Bedienleiste, Seitenzähler, Fehlermeldungen und Strg+Mausrad nur in der Vorschau verlangt; einheitlich in allen Browsern; X-Frame-Options DENY würde iframe behindern | 2026-11-21 |
| PDF.js-Worker lokal ausliefern, kein CDN | Lokaler Betrieb, funktioniert offline, keine Daten an Dritte | 2026-11-21 |
| Neue Schnittstelle „Scan ausliefern": nur Dateiname, Ordner aus Einstellungen, Prüfung auf Pfadtrenner/`..`/Endung | Kein Zugriff ausserhalb des Eingangs (Path Traversal ausgeschlossen); gleiches Prinzip wie Eingangsliste | 2026-11-21 |
| Dieselbe Adresse für „In neuem Tab öffnen", Anzeige „inline" | Ein Endpunkt, Browser-Viewer übernimmt Drucken/Suchen/Vollbild | 2026-11-21 |
| Keine Zwischenspeicherung (no-store) | Ersetzte Datei mit gleichem Namen wird korrekt angezeigt | 2026-11-21 |
| Ganze Datei laden (kein stückweises Laden) im MVP | Übliche Scans klein; einfacher. Stückweises Laden später nachrüstbar, falls 2-s-Ziel bei grossen NAS-Scans verfehlt | 2026-11-21 |
| Seiten nur im sichtbaren Bereich zeichnen, Platzhalter in Seitengrösse | Schnelle erste Seite und flüssiges Scrollen bei grossen Scans; kein Springen der Scrollposition | 2026-11-21 |
| Fehlercodes vom Server: nicht vorhanden / nicht erreichbar (NAS-Probe aus PROJ-1) / ungültig / nicht lokal | Browser kann je Fall die passende Meldung der Spec zeigen; NAS-Ausfall in ~2 s statt Hängen | 2026-11-21 |
| Bei „nicht vorhanden" sofort Liste aktualisieren | Auswahl-Regeln aus PROJ-2 greifen direkt, ohne 30-s-Wartezeit | 2026-11-21 |
| Zoom-Stufen 50/75/100/125/150/200/250/300 %; Drehung 0/90/180/270 für alle Seiten | Gängige Stufen; einfache, vorhersehbare Bedienung | 2026-11-21 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick
Die mittlere Spalte der Arbeitsfläche (bisher Platzhalter) wird zur **PDF-Vorschau**. Sie hängt an der bereits zentral gehaltenen **Auswahl** aus PROJ-2: Wechselt die Auswahl, lädt die Vorschau den neuen Scan.

Zwei Teile:
1. **Server:** eine neue Schnittstelle, die **genau einen Scan aus dem Eingangsordner** ausliefert, und zwar nur lesend und nur aus dem eingestellten Ordner.
2. **Browser:** ein eigener PDF-Betrachter. Er zeichnet die Seiten selbst und bietet dafür eine Bedienleiste mit Seitenzähler, Zoom und Drehen.

Wiederverwendet: Auswahl und Auswahl-Regeln, das Neuladen der Liste (PROJ-2), der Eingangsordner aus den Einstellungen, die schnelle NAS-Prüfung mit 10-s-Obergrenze und der Zugriffsschutz für lokale Anfragen (PROJ-1).

### A) Komponenten-Struktur

```
Arbeitsfläche (aus PROJ-2)
+-- Linke Spalte: Eingangsliste (unverändert)
+-- Mittlere Spalte: PDF-Vorschau  ← NEU
|   +-- Bedienleiste (oben, bleibt beim Scrollen sichtbar)
|   |   +-- Seite: [‹]  „Seite 2 von 3"  [›]
|   |   +-- Zoom:  [−]  „125 %"  [+]   [Breite anpassen] [Ganze Seite]
|   |   +-- Drehen: [90° links] [90° rechts] [180°]
|   |   +-- [In neuem Tab öffnen]
|   |   (auf schmalen Bildschirmen: Knöpfe nur als Symbole mit Tooltip, ggf. umbrechend)
|   +-- Anzeigebereich (in sich scrollbar)
|   |   +-- Seite 1, Seite 2, … untereinander
|   |   |   (Seiten ausserhalb des sichtbaren Bereichs: Platzhalter in Seitengrösse,
|   |   |    werden erst beim Heranscrollen gezeichnet)
|   +-- Ladezustand: Platzhalter in Seitenform mit Ladeanzeige
|   +-- Fehlerzustand: Meldung je Fall + passender Knopf
|   |   („In neuem Tab öffnen" / „Erneut versuchen")
|   +-- Leerer Zustand: „Kein Scan ausgewählt"
+-- Rechte Spalte: Platzhalter „Vorschläge" (PROJ-4/5, unverändert)
```

Verwendete vorhandene shadcn/ui-Bausteine: Button, Tooltip, Separator, Skeleton, Alert, Card, ScrollArea (bzw. einfacher Scrollbereich). Keine neuen shadcn-Bausteine nötig.

### B) Datenmodell

```
Nichts wird gespeichert – keine Datenbank, keine Datei.

Vom Server geliefert:
- Der Scan selbst (PDF-Datei, unverändert, nur gelesen)
- Bei Problemen ein Fehlergrund: Scan nicht mehr da / Eingang nicht erreichbar /
  ungültiger Dateiname / kein Zugriff

Nur im Browser (flüchtig, pro angezeigtem Scan):
- Anzahl Seiten und Grösse jeder Seite
- Aktuelle Seite (aus der Scrollposition ermittelt)
- Zoom-Modus: „Breite anpassen" | „Ganze Seite" | fester Wert (50–300 %)
- Drehung: 0° / 90° / 180° / 270°
- Zustand: lädt / angezeigt / Fehler (mit Grund)
→ wird beim Wechsel auf einen anderen Scan verworfen (Zoom/Drehung starten neu)
```

Zoom-Stufen für „+"/„−": 50, 75, 100, 125, 150, 200, 250, 300 %. Von „Breite anpassen" aus springt „+"/„−" zur nächstgrösseren bzw. -kleineren Stufe ausgehend vom aktuell tatsächlichen Wert.

### C) Server-Schnittstelle (in Worten)

| Schnittstelle | Zweck |
|---------------|-------|
| Scan ausliefern | Erhält **nur einen Dateinamen** (kein Pfad). Prüft: kein Pfadtrenner, kein `..`, Endung `.pdf`, Datei liegt direkt im **gespeicherten** Eingangsordner. Liefert die Datei als PDF zur Anzeige im Browser, **ohne Zwischenspeichern** (damit ein ersetzter Scan mit gleichem Namen sofort neu erscheint). |

Antworten bei Problemen (verständliche Gründe, vom Browser in die Meldungen der Spec übersetzt):
- Datei nicht (mehr) vorhanden → „Scan nicht mehr im Eingang"
- Eingangsordner/NAS nicht erreichbar (schnelle Prüfung aus PROJ-1, ~2 s) → „Eingangsordner nicht erreichbar"
- Dateiname ungültig (Pfadangabe, falsche Endung) → abgelehnt
- Anfrage nicht lokal / von fremder Webseite → abgelehnt (gleicher Schutz wie PROJ-1/2)

Dieselbe Adresse wird für **„In neuem Tab öffnen"** verwendet. Der Browser zeigt die Datei dort mit seinem eingebauten PDF-Viewer an.

### D) Abläufe

**Scan anzeigen:**
1. Auswahl wechselt → Vorschau verwirft den bisherigen Scan (laufender Ladevorgang wird abgebrochen) und zeigt den Ladeplatzhalter.
2. Datei wird vom Server geholt, Seitenanzahl und -grössen werden gelesen.
3. Die ersten sichtbaren Seiten werden gezeichnet, weitere erst beim Heranscrollen.

**Schneller Wechsel mit ↑/↓:** Jeder Wechsel bricht den vorherigen Ladevorgang ab. Ergebnisse eines älteren Scans werden verworfen, angezeigt wird nur der zuletzt gewählte Scan.

**Gleicher Scan bleibt ausgewählt** (z. B. nach einer Listen-Aktualisierung): kein Neuladen, Zoom und Scrollposition bleiben.

**Seitenzähler:** Die Seite, die den grössten Teil des sichtbaren Bereichs einnimmt, gilt als „aktuelle Seite". „‹"/„›" scrollen zum Anfang der vorherigen/nächsten Seite.

**Zoom:**
- „Breite anpassen": Seitenbreite = Breite des Anzeigebereichs; passt sich an, wenn das Fenster seine Grösse ändert.
- „Ganze Seite": aktuelle Seite passt vollständig (Höhe und Breite) in den Anzeigebereich.
- „+"/„−" und Strg + Mausrad: nächste Stufe; Strg + Mausrad über der Vorschau zoomt nur die Vorschau, nicht die Browserseite.
- Gedrehte Seiten (90°/270°) werden bei „Breite anpassen"/„Ganze Seite" mit vertauschter Breite/Höhe eingepasst.

**Drehen:** „90° links" = −90°, „90° rechts" = +90°, „180°" = +180°, jeweils zur aktuellen Drehung addiert (immer 0/90/180/270). Gilt für alle Seiten des Scans, nur in der Ansicht.

**Fehlerfälle:**
| Situation | Erkannt durch | Anzeige |
|-----------|---------------|---------|
| Datei beschädigt / kein PDF | PDF lässt sich nicht lesen | Meldung + „In neuem Tab öffnen" |
| Passwortgeschützt | PDF meldet Passwortschutz | Meldung, keine Passworteingabe |
| Scan nicht mehr da | Server: „nicht vorhanden" | Meldung, **Liste wird sofort aktualisiert** → Auswahl springt nach PROJ-2-Regeln weiter |
| NAS nicht erreichbar | Server: „nicht erreichbar" | Meldung + „Erneut versuchen" |

Bereits angezeigte Seiten bleiben sichtbar, wenn das NAS danach wegfällt. Ein Fehler tritt erst beim nächsten Ladeversuch auf.

### E) Technische Entscheidungen (Begründung)

- **Eigener PDF-Betrachter statt eingebettetem Browser-Viewer:** Der eingebaute Viewer (iframe) sieht in jedem Browser anders aus und lässt sich von aussen nicht steuern. Die Spec verlangt aber eigene Knöpfe (Zoom-Stufen, „ganze Seite", drei Dreh-Knöpfe), einen Seitenzähler, eigene Fehlermeldungen für beschädigte oder geschützte Dateien und dass Strg + Mausrad nur die Vorschau zoomt. Ausserdem verbietet ScanTool aus Sicherheitsgründen das Einbetten in Rahmen, was mit einem iframe kollidieren würde. Ein eigener Betrachter erfüllt all das in allen Browsern gleich.
- **Bewährte Bibliothek „PDF.js" (von Mozilla, auch im Firefox eingebaut) über den React-Baustein „react-pdf":** Sie ist ausgereift, kostenlos und weit verbreitet. Sie kann drehen, Seiten einzeln zeichnen, Passwortschutz und beschädigte Dateien erkennen und Ladevorgänge abbrechen. Etwas Eigenes zu bauen, wäre unverhältnismässig.
- **Hilfsprozess der PDF-Bibliothek wird lokal mitgeliefert (kein Internet-Download):** ScanTool läuft lokal. Die Vorschau soll auch ohne Internet funktionieren, und es werden keine Scans oder Metadaten an fremde Server verraten.
- **Seiten erst beim Heranscrollen zeichnen:** Damit erscheint die erste Seite auch bei 30-seitigen Scans schnell und der Browser bleibt flüssig. Platzhalter in Seitengrösse verhindern, dass die Scrollposition springt.
- **Schnittstelle nimmt nur einen Dateinamen, der Ordner kommt aus den Einstellungen:** So lässt sich nichts ausserhalb des Eingangsordners abrufen, auch nicht mit manipulierten Namen wie `..\..\Ablage\…`. Dasselbe Prinzip gilt schon bei der Eingangsliste.
- **Kein Zwischenspeichern der Datei:** Ein im Hintergrund ersetzter Scan mit gleichem Namen wird korrekt neu angezeigt. Bei lokaler Nutzung kostet das kaum Zeit.
- **Ganze Datei auf einmal statt stückweise laden:** Übliche Scans sind wenige MB gross, das ist einfacher und robuster. Falls die 2-Sekunden-Grenze bei grossen Scans vom NAS nicht reicht (offene Frage), lässt sich stückweises Laden später ergänzen, ohne die Oberfläche zu ändern.
- **Bei „Scan nicht mehr da" Liste sofort aktualisieren:** So greifen die bewährten Auswahl-Regeln aus PROJ-2 direkt, ohne auf das 30-s-Intervall zu warten.
- **Zoom/Drehung pro Scan flüchtig:** So steht es in der Spec, jeder Scan startet vorhersehbar. Speicher oder Datenbank sind nicht nötig.

### F) Abhängigkeiten (zu installieren)
- **react-pdf**: React-Baustein für PDF-Anzeige; bringt **pdfjs-dist** (PDF.js von Mozilla) mit. Damit werden Seiten gezeichnet, gedreht und Fehler erkannt.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
