# PROJ-4: KI-Analyse

## Status: Planned
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

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
