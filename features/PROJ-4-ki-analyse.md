# PROJ-4: KI-Analyse

## Status: Architected
**Created:** 2026-11-21
**Last Updated:** 2026-11-21

## Dependencies
- Requires: PROJ-1 (Einstellungen & Setup) – Claude-API-Schlüssel und Verbindung; Hinweis „API-Schlüssel fehlt"
- Requires: PROJ-2 (Eingangsliste) – ausgewählter Scan löst die Analyse aus; verschwundene Scans
- Related: PROJ-3 (PDF-Vorschau) – gleicher Scan wird parallel in der Mitte angezeigt; gleiche Regeln, welche Dateien gelesen werden dürfen
- Used by: PROJ-5 (Prüfen & Ablegen) – übernimmt die (bearbeiteten) Felder und den Dateinamen

## User Stories
- Als Nutzer möchte ich, dass ein Scan beim Auswählen automatisch analysiert wird, damit ich ohne zusätzlichen Klick Vorschläge bekomme.
- Als Nutzer möchte ich die Vorschläge direkt in Eingabefeldern sehen, damit ich sie mit einem Klick korrigieren oder überschreiben kann.
- Als Nutzer möchte ich, dass bei unsicheren Angaben nur der sichere Teil eingetragen wird, damit ich nicht erst falsche Werte löschen muss.
- Als Nutzer möchte ich den zukünftigen Dateinamen live sehen, damit ich sofort erkenne, ob die Ablage stimmt.
- Als Nutzer möchte ich, dass jeder Scan nur einmal analysiert und das Ergebnis gemerkt wird (auch über einen Neustart), damit ich nicht mehrfach bezahle.
- Als Nutzer möchte ich bei Problemen (kein Schlüssel, kein Guthaben, keine Verbindung) eine verständliche Meldung sehen und die Felder trotzdem selbst ausfüllen können.

## Out of Scope
- Knöpfe „Scan" und „Rechnung", Verschieben/Umbenennen, Zielordner, Namenskonflikte, Weiterspringen nach dem Ablegen – **PROJ-5**
- Dauerhaftes Speichern der Metadaten (Betrag, Artikel, Rechnungsnummer …) – PROJ-8 (Datenbank)
- OCR-Modus als Alternative zur KI – PROJ-6
- Automatisches Ablegen ohne Bestätigung – PROJ-11
- Weitere Dokumenttypen ausser Rechnung / Garantieschein – PROJ-12
- Vorab-Analyse aller Scans im Eingang (nur der ausgewählte Scan wird analysiert)
- Seriennummer, Bestellnummer, Kundennummer, MWST-Aufschlüsselung
- Hervorheben der erkannten Stellen im PDF
- Anzeige der Kosten pro Analyse
- Merken der eigenen Änderungen über einen Neustart hinaus

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Auslösen & Merken
- [ ] Angenommen ein API-Schlüssel ist hinterlegt, wenn ein noch nicht analysierter Scan ausgewählt wird, dann startet die Analyse automatisch ohne weiteren Klick
- [ ] Angenommen ein Scan wurde bereits analysiert, wenn er erneut ausgewählt wird (auch nach einem Neustart von ScanTool), dann erscheinen die Vorschläge sofort und es wird keine neue Analyse ausgelöst
- [ ] Angenommen ein analysierter Scan wurde im Hintergrund durch eine andere Datei mit gleichem Namen ersetzt, wenn er ausgewählt wird, dann wird er neu analysiert
- [ ] Angenommen ein Scan verschwindet aus dem Eingang (abgelegt oder gelöscht), wenn die Liste aktualisiert wird, dann wird sein gemerktes Ergebnis verworfen
- [ ] Angenommen ein Scan ist ausgewählt, wenn der Nutzer auf „Neu analysieren" klickt, dann wird erneut analysiert; selbst eingegebene Werte bleiben stehen, nur leere Felder werden neu gefüllt

### Felder & Vorschläge
- [ ] Angenommen die Analyse ist fertig, wenn die rechte Spalte angezeigt wird, dann stehen die Vorschläge in bearbeitbaren Eingabefeldern: Dokumenttyp (Rechnung / Garantieschein), Datum, Lieferant, Beschreibung, Betrag + Währung, Rechnungsnummer, Artikel, Garantiedauer (Monate)
- [ ] Angenommen die KI ist sich bei einer Angabe nicht sicher, wenn die Vorschläge eingetragen werden, dann steht im Feld nur der sichere Teil oder es bleibt leer – es wird nichts geraten
- [ ] Angenommen ein Vorschlag steht im Feld, wenn der Nutzer hineinklickt und tippt, dann kann er den Wert direkt ändern oder vollständig überschreiben
- [ ] Angenommen das Datum wird angezeigt, dann im Format TT.MM.JJJJ; der Betrag mit zwei Nachkommastellen und Währung (z. B. „389.00" + „CHF")
- [ ] Angenommen der Lieferant wird vorgeschlagen, dann als Kurzname ohne Rechtsform und Adresse (z. B. „Digitec" statt „Digitec Galaxus AG, Zürich")
- [ ] Angenommen die Beschreibung wird vorgeschlagen, dann mit 2–5 Wörtern, die das Hauptprodukt bzw. die Leistung benennen (z. B. „Monitor Dell U2724D")
- [ ] Angenommen der Scan enthält mehrere Positionen, wenn Artikel vorgeschlagen werden, dann die Hauptpositionen (höchstens ca. 10), ohne Versandkosten/Gebühren
- [ ] Angenommen keine Garantiedauer ist erkennbar, dann bleibt das Feld leer

### Dateiname-Vorschau
- [ ] Angenommen Datum, Lieferant und Beschreibung sind ausgefüllt, wenn die Felder angezeigt oder geändert werden, dann zeigt die Vorschau sofort den Namen `JJMMTT_Lieferant_Beschreibung.pdf` (z. B. `261121_Digitec_Monitor-Dell-U2724D.pdf`)
- [ ] Angenommen der Dokumenttyp ist „Garantieschein", dann endet der Name auf `_Garantie.pdf`
- [ ] Angenommen ein Feld enthält Leerzeichen, dann werden sie im Namen zu `-` (z. B. „Media Markt" → `Media-Markt`)
- [ ] Angenommen ein Feld enthält Umlaute, dann bleiben sie im Namen erhalten (z. B. `Müller`)
- [ ] Angenommen ein Feld enthält `\ / : * ? " < > |` oder `_`, dann werden diese Zeichen entfernt bzw. durch `-` ersetzt (der Unterstrich trennt nur die Bestandteile)
- [ ] Angenommen der Name würde länger als 100 Zeichen, dann wird die Beschreibung so gekürzt, dass der Name höchstens 100 Zeichen hat
- [ ] Angenommen Datum, Lieferant oder Beschreibung fehlt bzw. das Datum ist ungültig, dann zeigt die Vorschau statt eines Namens, was fehlt (z. B. „Datum fehlt")

### Laden & eigene Eingaben
- [ ] Angenommen die Analyse läuft, wenn die rechte Spalte angezeigt wird, dann zeigt sie „KI analysiert …" mit Ladeanzeige, die Felder sind bereits bedienbar
- [ ] Angenommen der Nutzer hat während der Analyse ein Feld selbst ausgefüllt, wenn die Vorschläge eintreffen, dann wird sein Wert nicht überschrieben
- [ ] Angenommen der Nutzer hat Felder eines Scans geändert, wenn er einen anderen Scan anschaut und zurückkehrt, dann sind seine Änderungen noch da (solange ScanTool geöffnet ist)
- [ ] Angenommen ein üblicher Scan (1–3 Seiten), wenn er analysiert wird, dann stehen die Vorschläge in der Regel nach weniger als 10 Sekunden in den Feldern
- [ ] Angenommen der Nutzer wechselt schnell zwischen Scans, wenn Analysen noch laufen, dann laufen sie zu Ende und werden gemerkt; angezeigt wird stets nur das Ergebnis des aktuell gewählten Scans

### Fehlerfälle
- [ ] Angenommen kein API-Schlüssel ist hinterlegt, wenn ein Scan ausgewählt wird, dann findet keine Analyse statt, es erscheint „KI-Analyse nicht verfügbar – API-Schlüssel in den Einstellungen hinterlegen" und die Felder sind leer und selbst ausfüllbar
- [ ] Angenommen der Schlüssel ist ungültig, das Guthaben aufgebraucht, Claude nicht erreichbar oder die Analyse dauert länger als 60 s, wenn analysiert wird, dann erscheint eine verständliche Meldung je Fall mit „Erneut versuchen"; die Felder bleiben bedienbar
- [ ] Angenommen der Scan ist beschädigt oder passwortgeschützt, wenn er ausgewählt wird, dann erscheint „Scan kann nicht analysiert werden" und die Felder sind selbst ausfüllbar
- [ ] Angenommen der Scan ist kein Rechnungsdokument (z. B. ein Brief), wenn er analysiert wird, dann bleibt der Dokumenttyp leer und es erscheint „Kein Rechnungsdokument erkannt"; erkennbare Angaben (z. B. Datum, Absender) dürfen trotzdem eingetragen werden
- [ ] Angenommen der Eingangsordner (NAS) ist nicht erreichbar, wenn analysiert werden soll, dann erscheint „Eingangsordner nicht erreichbar" mit „Erneut versuchen"

### Grosse Scans
- [ ] Angenommen ein Scan hat mehr als 5 Seiten, wenn er analysiert wird, dann werden nur die ersten 5 Seiten berücksichtigt und es erscheint der Hinweis „Nur die ersten 5 Seiten analysiert"
- [ ] Angenommen ein Scan ist grösser als 30 MB, wenn er ausgewählt wird, dann findet keine Analyse statt und es erscheint „Scan zu gross für die KI-Analyse – bitte Felder selbst ausfüllen"

### Darstellung
- [ ] Angenommen kein Scan ist ausgewählt, wenn die Hauptansicht angezeigt wird, dann zeigt die rechte Spalte „Kein Scan ausgewählt"
- [ ] Angenommen das Fenster ist schmal (unter ca. 1024 px), wenn die Hauptansicht angezeigt wird, dann stehen die Felder unter der Vorschau, sind vollständig bedienbar und die Seite scrollt nicht seitlich

## Edge Cases
- **Datum nur teilweise lesbar** (z. B. Monat/Jahr erkennbar, Tag nicht): Feld bleibt leer – ein halbes Datum ergibt keinen gültigen Dateinamen.
- **Mehrere Daten auf dem Dokument** (Bestell-, Liefer-, Rechnungsdatum): Rechnungsdatum hat Vorrang, beim Garantieschein das Kaufdatum.
- **Fremdwährung** (EUR, USD): Betrag mit erkannter Währung, keine Umrechnung.
- **Gutschrift / negativer Betrag:** Betrag mit Minus übernehmen; Typ bleibt „Rechnung".
- **Rechnung und Garantieschein in einem PDF:** Typ „Rechnung" (Hauptdokument), Garantiedauer trotzdem eintragen.
- **Lieferant mit Sonderzeichen** (z. B. „Müller & Söhne", „Brack.ch"): im Feld unverändert, im Dateinamen bereinigt.
- **Handschriftliche oder sehr schlechte Scans:** nur Sicheres eintragen, sonst leer; kein Fehler.
- **Scan verschwindet während der Analyse:** Ergebnis wird verworfen, Auswahl springt nach PROJ-2-Regeln weiter.
- **Analyse liefert unbrauchbare Antwort** (z. B. falsches Format): wie Fehlerfall behandeln, „Erneut versuchen".
- **Gleicher Inhalt unter neuem Namen** (Datei umbenannt): darf neu analysiert werden (keine Pflicht, Inhalte zu vergleichen).
- **„Neu analysieren" während eine Analyse läuft:** Knopf ist deaktiviert, keine doppelte Analyse.

## Technical Requirements (optional)
- **Kosten:** pro Scan genau eine Analyse (ausser „Neu analysieren" oder geänderte Datei); höchstens 5 Seiten; Ziel wenige Rappen pro Dokument.
- **Performance:** Vorschläge bei üblichen Scans < 10 s; Abbruch nach 60 s.
- **Datenschutz:** Scans werden ausschliesslich an die Claude API (Anthropic) übertragen, nur der jeweils ausgewählte Scan. Der API-Schlüssel bleibt auf dem Server und erscheint nie im Browser.
- **Sicherheit:** nur Dateien aus dem konfigurierten Eingangsordner (gleiche Regeln wie PROJ-3); nur lokale Anfragen (wie PROJ-1/2/3). Inhalte aus dem Scan werden als Text dargestellt, nie als HTML ausgeführt.
- **Lokal gemerkte Ergebnisse** enthalten nur die Vorschläge, keine Kopie des Scans.

## Open Questions
- [ ] Reicht Haiku 5.5 für ≥ 80 % brauchbare Vorschläge? Sonst Modell wechseln (eine Stelle im Code) – in QA mit echten Rechnungen messen, inkl. tatsächlicher Kosten pro Scan.
- [ ] Welche Trefferquote erreichen die Vorschläge bei echten Scans? Ziel laut PRD: ≥ 80 % ohne oder mit kleiner Korrektur – in QA mit einigen echten Rechnungen prüfen.
- [ ] Details zum Knopf „Scan" (Name des Unterordners im Scanner-Ordner, Umbenennen ja/nein) – in PROJ-5 klären.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Analyse automatisch bei Auswahl, einmal pro Scan | Kein zusätzlicher Klick (Ziel < 30 s pro Dokument); Kosten nur für angeschaute Scans | 2026-11-21 |
| Vorschläge direkt in bearbeitbaren Eingabefeldern; bei Unsicherheit nur der sichere Teil, sonst leer | Vom Nutzer gewünscht: einfach überschreiben statt falsche Werte löschen | 2026-11-21 |
| Aufteilung: PROJ-4 = Analyse + Felder + Dateiname-Vorschau; PROJ-5 = Knöpfe „Scan"/„Rechnung" und Verschieben | Single Responsibility; Knopf-Wunsch in PROJ-5 vermerkt | 2026-11-21 |
| Felder: Typ, Datum, Lieferant, Beschreibung, Betrag + Währung, Rechnungsnummer, Artikel, Garantiedauer | Rechnungsnummer wird im Garantiefall verlangt und hilft bei der späteren Suche; Serien-/Bestellnummer zu unzuverlässig | 2026-11-21 |
| Dateiname: Leerzeichen → `-`, Umlaute bleiben, verbotene Zeichen und `_` bereinigt, max. 100 Zeichen, Beschreibung wird gekürzt | Eindeutig lesbare Trennung, gut durchsuchbar, Windows-tauglich | 2026-11-21 |
| Eigene Eingaben werden nie von der KI überschrieben (auch nicht bei „Neu analysieren") | Nutzer behält Kontrolle; Tippen während der Analyse ist möglich | 2026-11-21 |
| Laufende Analysen werden bei Scan-Wechsel nicht abgebrochen, sondern gemerkt | Kosten sind ohnehin angefallen; Ergebnis beim Zurückkehren sofort da | 2026-11-21 |
| KI-Ergebnisse überdauern einen Neustart, eigene Änderungen nur die Sitzung | Jeder Scan wird genau einmal bezahlt; Änderungen werden ohnehin mit PROJ-5 abgelegt | 2026-11-21 |
| Nur die ersten 5 Seiten; ab 30 MB keine Analyse | Rechnungsdaten stehen vorne; Kosten bleiben bei dicken Dokumenten klein | 2026-11-21 |
| Fehler verhindern nie das manuelle Ausfüllen | Tool bleibt auch ohne KI nutzbar | 2026-11-21 |

### Technical Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Modell `claude-haiku-5-5`, an einer Stelle konfiguriert | Vom Nutzer gewählt (Kosten ~0,1 Rp./Scan); Wechsel auf Sonnet/Opus 5.5 ohne Umbau, falls Trefferquote < 80 % | 2026-11-21 |
| Structured Outputs (festes JSON-Schema) + eigene Zod-Prüfung der Antwort | Verlässliche Felder, kein Parsen von Freitext; doppelte Absicherung | 2026-11-21 |
| Effort niedrig, adaptives Denken (Standard) | Einfache Extraktion; spart Zeit und Kosten | 2026-11-21 |
| PDF als Dokument-Block (base64) direkt an Claude | Claude liest Text und Bild, auch ohne Textebene; kein eigenes OCR (PROJ-6) | 2026-11-21 |
| pdf-lib zum Zuschneiden auf 5 Seiten und als Vorab-Prüfung | Reines JavaScript, keine Systemabhängigkeit; erkennt beschädigte/geschützte PDFs vor Kosten | 2026-11-21 |
| Ergebnis-Speicher `data/analyses.json`, atomar geschrieben, Schlüssel = Name + Grösse + Änderungszeit | Keine DB im MVP; einmal bezahlen auch über Neustart; ersetzte Datei wird erkannt ohne vollständiges Lesen | 2026-11-21 |
| Aufräumen verwaister Ergebnisse beim Auflisten des Eingangs | Kein separater Hintergrundprozess nötig | 2026-11-21 |
| Analyse-Jobs serverseitig, unabhängig von der Anfrage, pro Fingerabdruck zusammengelegt | Wegklicken bricht nicht ab; keine Doppelkosten | 2026-11-21 |
| Neue Schnittstelle „Scan analysieren“ (nur Dateiname + Flag „neu“), Antwort wartet auf Ergebnis (max. 60 s) | Einfacher als Polling; gleiche Namensprüfung wie PROJ-3 | 2026-11-21 |
| Zeitlimit 60 s gesamt, max. 1 Wiederholung bei Überlastung | Robust gegen kurze Überlast, Wartezeit begrenzt | 2026-11-21 |
| Kein Refusal-Fallback | Für Haiku 5.5 nicht verfügbar; Ablehnung als „Antwort unbrauchbar“ | 2026-11-21 |
| Dateiname-Regel als gemeinsame, unit-getestete Funktion (Browser-Vorschau + PROJ-5-Server) | Vorschau und Ablage müssen identisch sein | 2026-11-21 |
| Eigene Eingaben + „berührt“-Markierung nur im Browser je Scan | Laut Spec nur für die Sitzung; KI überschreibt nie Nutzereingaben | 2026-11-21 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick
Die rechte Spalte der Arbeitsfläche (bisher Platzhalter „Vorschläge“) wird zum **Vorschlags-Formular**. Es hängt wie die Vorschau (PROJ-3) an der zentralen **Auswahl** aus PROJ-2.

Drei Teile:
1. **Server – Analyse-Dienst:** liest den Scan aus dem Eingang, schneidet ihn auf höchstens 5 Seiten zu, schickt ihn an Claude und erhält die Felder in einem **fest vorgegebenen Format** zurück. Ergebnisse werden **lokal gemerkt**, damit jeder Scan nur einmal bezahlt wird.
2. **Server – Ergebnis-Speicher:** eine kleine lokale Datei neben den Einstellungen mit den KI-Vorschlägen je Scan. Er wird aufgeräumt, wenn Scans aus dem Eingang verschwinden.
3. **Browser – Formular:** Eingabefelder, Ladezustand, Meldungen, „Neu analysieren“ und die live gebildete Dateiname-Vorschau. Eigene Eingaben werden je Scan gemerkt, solange ScanTool offen ist.

Wiederverwendet:
- aus PROJ-1: API-Schlüssel aus `.env.local`, Fehlerzuordnung (Schlüssel ungültig, kein Guthaben, nicht erreichbar) und Zugriffsschutz für lokale Anfragen
- aus PROJ-2: Auswahl und Listen-Aktualisierung
- aus PROJ-3: Prüfung „nur Dateien aus dem Eingang“ und NAS-Erreichbarkeit

### A) Komponenten-Struktur

```
Arbeitsfläche (aus PROJ-2)
+-- Linke Spalte: Eingangsliste (unverändert)
+-- Mittlere Spalte: PDF-Vorschau (PROJ-3, unverändert)
+-- Rechte Spalte: Vorschläge  ← NEU
    +-- Kopf: „Vorschläge“ + Status („KI analysiert …“ / „Von KI vorgeschlagen“) + [Neu analysieren]
    +-- Hinweiszeile (nur bei Bedarf):
    |   „Nur die ersten 5 Seiten analysiert“ · „Kein Rechnungsdokument erkannt“ ·
    |   Fehlermeldung je Fall + [Erneut versuchen] · „API-Schlüssel fehlt“ (Link zu Einstellungen)
    +-- Formular (immer bedienbar, auch während der Analyse und bei Fehlern)
    |   +-- Dokumenttyp: Auswahl Rechnung / Garantieschein / (leer)
    |   +-- Datum (TT.MM.JJJJ)
    |   +-- Lieferant
    |   +-- Beschreibung
    |   +-- Betrag + Währung (zwei Felder nebeneinander)
    |   +-- Rechnungsnummer
    |   +-- Garantiedauer (Monate)
    |   +-- Artikel (mehrzeiliges Feld, eine Position pro Zeile)
    +-- Dateiname-Vorschau: `261121_Digitec_Monitor-Dell-U2724D.pdf` oder „Datum fehlt“
    +-- Platz für die Knöpfe „Scan“ / „Rechnung“ (kommen mit PROJ-5)
    +-- Leerer Zustand: „Kein Scan ausgewählt“
```

Verwendete vorhandene shadcn/ui-Bausteine: Card, Input, Textarea, Select, Label, Button, Alert, Badge, Skeleton, Tooltip. Keine neuen Bausteine nötig. Die Validierung der Felder läuft wie in PROJ-1 mit react-hook-form und Zod.

### B) Datenmodell

```
KI-Vorschlag je Scan (vom Server, lokal gemerkt):
- Dokumenttyp: Rechnung | Garantieschein | leer
- Rechnungsdokument erkannt: ja / nein
- Datum (Kalenderdatum) | leer
- Lieferant (Kurzname) | leer
- Beschreibung (2–5 Wörter) | leer
- Betrag (Zahl, 2 Nachkommastellen, Minus bei Gutschrift) | leer
- Währung (3-Buchstaben-Code, z. B. CHF/EUR/USD) | leer
- Rechnungsnummer | leer
- Artikel: Liste (max. 10 Texte)
- Garantiedauer in Monaten (ganze Zahl) | leer
- Seiten analysiert / Seiten gesamt (für den 5-Seiten-Hinweis)
- Zeitpunkt der Analyse, verwendetes Modell

Gemerkt in: data/analyses.json (gleicher Ordner wie die Einstellungen, nicht in Git).
Schlüssel je Eintrag = „Fingerabdruck“ des Scans: Dateiname + Grösse + Änderungszeit.
→ Andere Grösse oder Änderungszeit = andere Datei = neue Analyse.
→ Einträge, deren Scan nicht mehr im Eingang liegt, werden beim Aktualisieren der Liste entfernt.
Keine Kopie des Scans, nur die Vorschläge.

Nur im Browser (flüchtig, solange ScanTool offen ist), je Scan:
- aktuelle Feldwerte
- welche Felder der Nutzer selbst geändert hat („berührt“) → werden nie von der KI überschrieben
```

**Dateiname-Regel** (eine gemeinsame, separat getestete Regel, die PROJ-5 beim Ablegen auf dem Server genauso verwendet):
- `JJMMTT_Lieferant_Beschreibung[_Garantie].pdf`
- Leerzeichen werden zu `-`, Umlaute bleiben.
- `\ / : * ? " < > |` und `_` werden entfernt bzw. zu `-`. Doppelte `-` werden zusammengezogen, `-` an Anfang und Ende entfernt.
- höchstens 100 Zeichen, dafür wird die Beschreibung gekürzt
- Statt eines Namens erscheint der fehlende Teil: „Datum fehlt“, „Datum ungültig“, „Lieferant fehlt“, „Beschreibung fehlt“.

### C) Server-Schnittstelle (in Worten)

| Schnittstelle | Zweck |
|---------------|-------|
| **Scan analysieren** | Erhält nur einen Dateinamen und optional „neu analysieren“. Prüft den Namen mit denselben Regeln wie die Vorschau. Liegt ein Ergebnis zum aktuellen Fingerabdruck vor, kommt es **sofort** zurück, ohne Kosten. Sonst startet die Analyse oder hängt sich an eine bereits laufende für denselben Scan an. Die Antwort folgt, sobald das Ergebnis da ist, spätestens nach 60 s. |

**Antworten:** Vorschlag + Hinweise, oder ein Fehlergrund. Die Fehlergründe sind:
- kein API-Schlüssel
- Schlüssel ungültig
- kein Guthaben
- Claude nicht erreichbar
- Zeitüberschreitung
- Scan nicht lesbar (beschädigt oder passwortgeschützt)
- Scan zu groß (> 30 MB)
- Scan nicht mehr da
- Eingang nicht erreichbar
- KI-Antwort unbrauchbar bzw. abgelehnt

Gleicher Zugriffsschutz wie bisher: nur lokal, keine fremden Webseiten.

**Aufräumen:** Beim Auflisten des Eingangs (PROJ-2) entfernt der Server die gemerkten Ergebnisse, deren Scan nicht mehr da ist.

### D) Abläufe

**Scan auswählen:**
1. Das Formular zeigt sofort die gemerkten eigenen Eingaben dieses Scans, falls vorhanden, sonst leere Felder mit „KI analysiert …“.
2. Der Browser fragt „Scan analysieren“ an. Ist das Ergebnis gemerkt, ist es sofort da. Sonst gilt:
   - Der Server liest die Datei vom NAS.
   - Ist sie größer als 30 MB, wird abgebrochen: „zu groß“.
   - Ein PDF-Werkzeug öffnet die Datei. Ist sie beschädigt oder passwortgeschützt, wird abgebrochen: „nicht lesbar“.
   - Bei mehr als 5 Seiten wird eine verkleinerte Kopie mit den ersten 5 Seiten erzeugt, nur im Arbeitsspeicher.
   - Das PDF geht zusammen mit festen Anweisungen auf Deutsch an Claude, mit fest vorgegebenem Antwortformat.
   - Die Antwort wird geprüft und vereinheitlicht, das Ergebnis gemerkt.
3. **Zusammenführen im Browser:** KI-Werte füllen nur Felder, die der Nutzer **nicht berührt** hat.

**Schneller Wechsel:** Wechselt die Auswahl, verwirft der Browser die Antwort für den alten Scan. Der Server rechnet aber weiter und merkt das Ergebnis, denn eine Analyse läuft unabhängig von der Anfrage, die sie gestartet hat. Zwei Anfragen für denselben Scan lösen nur **eine** Analyse aus.

**„Neu analysieren“:** Der Server ignoriert das gemerkte Ergebnis und analysiert neu. Im Browser werden wieder nur unberührte Felder gefüllt. Während eine Analyse läuft, ist der Knopf deaktiviert.

**Anweisungen an Claude** (Inhalt, nicht Wortlaut):
- Nur sicher Erkanntes eintragen, sonst leer lassen und nichts raten.
- Rechnungsdatum vor Liefer- oder Bestelldatum, beim Garantieschein das Kaufdatum.
- Lieferant als Kurzname ohne Rechtsform und Adresse.
- Beschreibung mit 2–5 Wörtern zum Hauptprodukt, keine Sonderzeichen.
- Betrag ist der Gesamtbetrag inkl. MWST, Gutschriften negativ.
- Artikel sind nur Hauptpositionen, keine Versandkosten und Gebühren.
- Ist es kein Rechnungsdokument, wird „Rechnungsdokument erkannt: nein“ gesetzt.

**Fehler:**

| Situation | Erkannt durch | Anzeige |
|-----------|---------------|---------|
| Kein API-Schlüssel | Einstellungen (PROJ-1) | Hinweis + Link zu Einstellungen, **keine** Anfrage an Claude |
| Schlüssel ungültig / kein Guthaben / nicht erreichbar | Fehlerzuordnung aus PROJ-1 | Meldung je Fall + „Erneut versuchen“ |
| Zeitüberschreitung (60 s) | Server-Zeitlimit | „Analyse dauert zu lange“ + „Erneut versuchen“ |
| Beschädigt / passwortgeschützt | PDF-Werkzeug | „Scan kann nicht analysiert werden“ |
| > 30 MB | Dateigröße | „Scan zu groß für die KI-Analyse – bitte Felder selbst ausfüllen“ |
| Antwort unbrauchbar / von Claude abgelehnt | Formatprüfung / Antwortgrund | „KI-Antwort unbrauchbar“ + „Erneut versuchen“ |
| Scan verschwunden | Server: nicht vorhanden | Liste aktualisieren (wie PROJ-3), Auswahl springt weiter |
| NAS nicht erreichbar | Schnellprüfung aus PROJ-1 | „Eingangsordner nicht erreichbar“ + „Erneut versuchen“ |

In allen Fällen bleibt das Formular bedienbar. Fehler werden **nicht** gemerkt, der nächste Versuch fragt wieder an.

### E) Technische Entscheidungen (Begründung)

- **Modell Claude Haiku 5.5 (vom Nutzer gewählt):** Es ist das günstigste aktuelle Modell, etwa 0,1 Rappen pro üblichem Scan, und schnell, was zum 10-s-Ziel passt. Das Modell ist an **einer Stelle** festgelegt. Reicht die Trefferquote in der QA nicht (Ziel ≥ 80 %), lässt sich ohne Umbau auf Sonnet 5.5 oder Opus 5.5 wechseln.
- **Fest vorgegebenes Antwortformat („Structured Outputs“) statt freiem Text:** Claude muss genau die Felder in der vorgegebenen Form liefern. Es gibt kein Raten beim Auslesen und keine kaputten Antworten durch Formatfehler. Zusätzlich prüft der Server jede Antwort selbst.
- **Geringer „Denkaufwand“ (Effort niedrig):** Felder aus einer Rechnung zu lesen ist eine einfache Aufgabe. Wenig Nachdenken spart Zeit und Kosten, ohne die Qualität spürbar zu senken.
- **PDF direkt an Claude, nicht vorher selbst in Text umwandeln:** Claude liest Text und Bild der Seiten, auch bei Scans ohne Textebene. Eine eigene Texterkennung ist erst Thema von PROJ-6.
- **Auf 5 Seiten zuschneiden mit „pdf-lib“:** Das kostenlose PDF-Werkzeug läuft auf dem Server ohne Zusatzprogramme. Es kopiert die ersten 5 Seiten in eine neue Datei im Arbeitsspeicher, das Original bleibt unverändert. Nebenbei erkennt es beschädigte und passwortgeschützte Dateien, bevor Geld ausgegeben wird.
- **Ergebnisse in einer lokalen Datei (`data/analyses.json`) statt in der Datenbank:** Im MVP gibt es keine Datenbank (PRD). Die Datei liegt neben den Einstellungen, ist nicht in Git und wird atomar geschrieben wie die Einstellungen in PROJ-1. So bezahlt man jeden Scan einmal, auch über einen Neustart hinweg.
- **Fingerabdruck aus Name + Größe + Änderungszeit statt Inhalts-Prüfsumme:** Ein ersetzter Scan wird zuverlässig erkannt, ohne jede Datei ganz vom NAS lesen zu müssen, nur um die Liste zu prüfen.
- **Analyse läuft serverseitig weiter, auch wenn der Browser wegklickt, und wird zusammengelegt:** Das erfüllt „laufende Analysen werden gemerkt, nicht abgebrochen“. Doppelte Kosten durch schnelles Hin- und Herklicken sind ausgeschlossen.
- **Zeitlimit 60 s mit höchstens einem automatischen Wiederholversuch bei Überlastung:** Kurzzeitige Überlastung bei Anthropic wird abgefangen, und die Gesamtwartezeit bleibt trotzdem begrenzt.
- **Kein Fallback-Modell bei Ablehnung:** Für Haiku 5.5 gibt es keinen serverseitigen Fallback. Eine (bei Rechnungen sehr unwahrscheinliche) Ablehnung wird als „KI-Antwort unbrauchbar“ gemeldet, und manuelles Ausfüllen bleibt möglich.
- **Eigene Eingaben nur im Browser-Arbeitsspeicher:** So steht es in der Spec, nach einem Neustart erscheinen wieder die KI-Vorschläge. Die dauerhafte Speicherung übernimmt PROJ-5 beim Ablegen.
- **Dateiname-Regel als gemeinsame, getestete Logik:** Browser-Vorschau und Ablage (PROJ-5) müssen exakt denselben Namen bilden, sonst würde die Vorschau lügen.
- **API-Schlüssel bleibt auf dem Server:** Der Browser spricht nur mit ScanTool, nie direkt mit Anthropic.

### F) Abhängigkeiten (zu installieren)
- **pdf-lib**: PDF öffnen, Seitenzahl lesen, die ersten 5 Seiten in eine neue Datei kopieren, beschädigte und geschützte PDFs erkennen.
- Vorhanden und wiederverwendet: `@anthropic-ai/sdk` (Claude API), `zod` (Antwort- und Formularprüfung), `react-hook-form`.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
