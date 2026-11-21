# PROJ-5: Prüfen & Ablegen

## Status: Planned
**Created:** 2026-11-21
**Last Updated:** 2026-11-21

## Dependencies
- Requires: PROJ-1 (Einstellungen & Setup) – Eingangs- und Ablage-Ordner
- Requires: PROJ-2 (Eingangsliste) – Auswahl, Auswahl-Regeln nach dem Verschwinden eines Scans, Listen-Aktualisierung
- Requires: PROJ-4 (KI-Analyse) – Felder (Datum, Lieferant, Beschreibung, Dokumenttyp) und Dateiname-Regel (`buildFileName`), eigene Eingaben je Scan
- Related: PROJ-3 (PDF-Vorschau) – zeigt nach dem Ablegen den nächsten Scan

## User Stories
- Als Nutzer möchte ich den vorgeschlagenen Dateinamen direkt in einem Eingabefeld sehen und überschreiben können, damit ich den Namen ohne Umweg über die Einzelfelder anpassen kann.
- Als Nutzer möchte ich eine Rechnung oder einen Garantieschein mit einem Klick auf „Rechnung“ umbenannt in `Rechnungen\JJJJ\` meiner Ablage verschieben, damit der Eingang leer wird und das Archiv geordnet bleibt.
- Als Nutzer möchte ich andere Dokumente (Briefe, Mitteilungen, Verträge) mit „Scan“ aus dem Eingang in einen Unterordner `Abgelegt` verschieben, damit nichts verloren geht und der Eingang trotzdem leer wird.
- Als Nutzer möchte ich, dass danach automatisch der nächste Scan erscheint, damit ich den Stapel zügig abarbeite.
- Als Nutzer möchte ich ein versehentliches Ablegen kurz rückgängig machen können, weil es keine Rückfrage gibt.
- Als Nutzer möchte ich, dass bei Namenskonflikten oder Fehlern nie eine Datei überschrieben wird oder verloren geht.
- Als Nutzer möchte ich per Tastatur ablegen können, damit ich schneller bin.

## Out of Scope
- Speichern der Metadaten (Betrag, Artikel, Rechnungsnr. …) in einer Datenbank – PROJ-8
- Suche/Filter im Archiv – PROJ-9, Garantie-Übersicht – PROJ-10
- Automatisches Ablegen ohne Klick – PROJ-11
- Weitere Dokumenttypen mit eigenen Ablageordnern (z. B. Versicherung, Steuern) – PROJ-12; „Scan" ist der einzige Sammelordner im MVP
- Jahres- oder Themen-Unterordner in `Scanner\Abgelegt\`
- Rückgängig nach Ablauf der Meldung (ca. 8 s) bzw. nach Neustart – danach nur über Explorer/OneDrive
- Mehrfachauswahl / Stapel-Ablegen mehrerer Scans auf einmal
- Löschen von Fehlscans ohne Ablage
- PDF verändern (drehen, zusammenfügen, trennen) – laut PRD Nicht-Ziel
- Bestätigungsdialog vor dem Ablegen

## Acceptance Criteria

**Format:** Angenommen [Vorbedingung] / Wenn [Aktion] / Dann [Ergebnis]

### Dateiname-Feld
- [ ] Angenommen ein Scan ist ausgewählt, wenn die rechte Spalte angezeigt wird, dann steht unter den Feldern ein Eingabefeld „Dateiname" mit dem aus Datum, Lieferant, Beschreibung und Dokumenttyp gebildeten Namen (Regel aus PROJ-4), daneben die Knöpfe „Rechnung" und „Scan"
- [ ] Angenommen der Nutzer hat den Dateinamen nicht selbst geändert, wenn er Datum, Lieferant, Beschreibung oder Dokumenttyp ändert, dann passt sich der Dateiname sofort an
- [ ] Angenommen der Nutzer hat den Dateinamen selbst geändert, wenn er danach ein Einzelfeld ändert, dann bleibt sein Dateiname stehen und ein Knopf „Aus Feldern übernehmen" erscheint
- [ ] Angenommen der Dateiname wurde selbst geändert, wenn der Nutzer „Aus Feldern übernehmen" klickt, dann wird der Name wieder aus den Feldern gebildet und folgt ihnen wieder
- [ ] Angenommen der Nutzer gibt einen Namen ohne `.pdf` ein, wenn abgelegt wird, dann wird `.pdf` automatisch ergänzt (Gross-/Kleinschreibung der Endung egal)
- [ ] Angenommen der Dateiname enthält `\ / : * ? " < > |`, ist leer, länger als 100 Zeichen oder besteht nur aus Punkten/Leerzeichen, wenn er angezeigt wird, dann erscheint unter dem Feld eine verständliche Meldung (z. B. „Unerlaubtes Zeichen: /") und „Rechnung" ist deaktiviert
- [ ] Angenommen die Einzelfelder reichen nicht für einen Namen (z. B. Lieferant fehlt), wenn das Dateiname-Feld angezeigt wird, dann ist es leer mit dem Hinweis, was fehlt (wie PROJ-4), und kann trotzdem selbst ausgefüllt werden
- [ ] Angenommen der Nutzer hat für einen Scan Felder oder den Dateinamen geändert, wenn er zu einem anderen Scan wechselt und zurückkehrt, dann sind seine Eingaben noch da (solange ScanTool geöffnet ist)

### Knopf „Rechnung"
- [ ] Angenommen der Dateiname ist gültig und im Datumsfeld steht ein gültiges Datum, wenn der Nutzer „Rechnung" klickt, dann wird der Scan ohne Rückfrage unter diesem Namen nach `<Ablage>\Rechnungen\<Jahr aus dem Datumsfeld>\` verschoben
- [ ] Angenommen der Jahresordner (z. B. `Rechnungen\2027\`) oder `Rechnungen\` existiert noch nicht, wenn abgelegt wird, dann wird er automatisch angelegt
- [ ] Angenommen das Datum fehlt oder ist ungültig bzw. der Dateiname ist ungültig, wenn die Knöpfe angezeigt werden, dann ist „Rechnung" deaktiviert und ein Tooltip nennt den Grund (z. B. „Datum fehlt – Jahresordner unbekannt")
- [ ] Angenommen ein Scan wurde mit „Rechnung" abgelegt, wenn der Nutzer danach in den Eingangsordner schaut, dann ist die Datei dort nicht mehr vorhanden (verschoben, nicht kopiert)

### Knopf „Scan"
- [ ] Angenommen ein Scan ist ausgewählt, wenn der Nutzer „Scan" klickt, dann wird er ohne Rückfrage nach `<Eingang>\Abgelegt\` verschoben – unter dem Namen aus dem Dateiname-Feld, falls dieser gültig ist, sonst unter seinem Originalnamen
- [ ] Angenommen der Ordner `Abgelegt` existiert noch nicht, wenn mit „Scan" abgelegt wird, dann wird er automatisch angelegt
- [ ] Angenommen ein Scan wurde mit „Scan" abgelegt, wenn die Eingangsliste aktualisiert wird, dann erscheint er dort nicht mehr (Unterordner werden nicht gelistet)

### Nach dem Ablegen
- [ ] Angenommen ein Scan wurde abgelegt, wenn das Ablegen fertig ist, dann verschwindet er sofort aus der Liste und der nächste Scan wird ausgewählt (bzw. der vorherige, falls es der letzte war – Regel aus PROJ-2); Vorschau und KI-Analyse starten für ihn
- [ ] Angenommen ein Scan wurde abgelegt, wenn das Ablegen fertig ist, dann erscheint für ca. 8 Sekunden eine Meldung mit dem Ablageort (z. B. „Abgelegt: Rechnungen\2026\261102_Elektra-Gaiserwald_Strom-E-Mobility.pdf") und dem Knopf „Rückgängig"
- [ ] Angenommen die Meldung ist sichtbar, wenn der Nutzer „Rückgängig" klickt, dann wird die Datei unter ihrem ursprünglichen Namen zurück in den Eingang verschoben, erscheint wieder in der Liste und seine Eingaben (Felder, Dateiname) sind wieder da
- [ ] Angenommen das Ablegen läuft, wenn der Nutzer erneut einen Knopf drückt, dann passiert nichts (Knöpfe zeigen einen Ladezustand und sind gesperrt) – kein doppeltes Ablegen

### Namenskonflikte
- [ ] Angenommen im Zielordner gibt es schon eine andere Datei mit demselben Namen, wenn abgelegt wird, dann wird nie überschrieben, sondern eine Nummer angehängt (`…_2.pdf`, `…_3.pdf`; beim Garantieschein vor dem Zusatz: `…_2_Garantie.pdf`) und die Meldung nennt den tatsächlichen Namen mit „(Name war schon vergeben)"
- [ ] Angenommen im Zielordner liegt bereits eine inhaltlich identische Datei, wenn abgelegt wird, dann wird keine weitere Kopie angelegt, sondern nur der Scan aus dem Eingang entfernt, mit dem Hinweis „War bereits abgelegt – Eingang bereinigt"

### Sicheres Verschieben & Fehler
- [ ] Angenommen Eingang und Ablage liegen auf verschiedenen Laufwerken (NAS / OneDrive), wenn abgelegt wird, dann wird das Original erst gelöscht, nachdem die Kopie im Ziel vollständig und identisch ist
- [ ] Angenommen der Ablage-Ordner ist nicht erreichbar oder wurde gelöscht, wenn der Nutzer „Rechnung" klickt, dann erscheint „Ablage-Ordner nicht erreichbar", der Scan bleibt im Eingang und alle Eingaben bleiben erhalten
- [ ] Angenommen der Eingangsordner (NAS) ist nicht erreichbar, wenn abgelegt wird, dann erscheint „Eingangsordner nicht erreichbar" und nichts wird verändert
- [ ] Angenommen das Kopieren gelingt, aber das Original kann nicht gelöscht werden (z. B. gesperrt), wenn abgelegt wird, dann bleibt die Kopie in der Ablage, es erscheint „Abgelegt, aber Original konnte nicht aus dem Eingang gelöscht werden", der Scan bleibt in der Liste mit dem Vermerk „bereits abgelegt" – ein erneuter Klick erkennt die identische Datei und bereinigt nur den Eingang
- [ ] Angenommen der Scan ist inzwischen verschwunden, wenn abgelegt werden soll, dann erscheint „Der Scan ist nicht mehr im Eingang" und die Liste wird aktualisiert
- [ ] Angenommen im Ziel fehlen Schreibrechte oder Speicherplatz, wenn abgelegt wird, dann erscheint eine verständliche Meldung, und es wird nichts gelöscht; eine halb geschriebene Kopie wird entfernt

### Tastatur
- [ ] Angenommen der Fokus ist irgendwo in der Hauptansicht (auch in einem Eingabefeld), wenn der Nutzer Strg + Enter drückt, dann wirkt das wie ein Klick auf „Rechnung" – Strg + Umschalt + Enter wie „Scan"
- [ ] Angenommen der jeweilige Knopf ist deaktiviert, wenn das Tastenkürzel gedrückt wird, dann wird nicht abgelegt, sondern kurz der Grund angezeigt
- [ ] Angenommen der Mauszeiger ist über einem Knopf, dann zeigt der Tooltip das Tastenkürzel

### Darstellung
- [ ] Angenommen das Fenster ist schmal (unter ca. 1024 px), wenn die rechte Spalte angezeigt wird, dann sind Dateiname-Feld und beide Knöpfe vollständig sichtbar und bedienbar, ohne seitliches Scrollen
- [ ] Angenommen kein Scan ist ausgewählt, dann sind Dateiname-Feld und Knöpfe nicht sichtbar („Kein Scan ausgewählt" wie bisher)

## Edge Cases
- **Zwei Rechnungen mit gleichem Namen am selben Tag** → `_2`, `_3` … (nie überschreiben).
- **Derselbe Scan doppelt im Eingang** (Scanner hat zweimal abgelegt) → zweites Ablegen erkennt identischen Inhalt, bereinigt nur den Eingang.
- **Datum im Datumsfeld aus dem Jahr 2025, Dateiname manuell mit `26…`** → Jahresordner kommt aus dem Datumsfeld (2025); der Dateiname bleibt wie eingegeben.
- **Dateiname mit Umlauten / `&` / Punkt im Namen** (`Brack.ch`) → erlaubt; nur `\ / : * ? " < > |` sind verboten.
- **Windows-reservierte Namen** (`CON.pdf`, `NUL.pdf`) → als ungültig melden.
- **Rückgängig, nachdem im Eingang inzwischen eine neue Datei mit dem Originalnamen liegt** → nicht überschreiben; Rückgängig hängt eine Nummer an den Originalnamen an und meldet das.
- **Rückgängig, wenn die abgelegte Datei inzwischen in OneDrive verschoben/gelöscht wurde** → Meldung „Rückgängig nicht möglich – Datei nicht mehr am Ablageort".
- **NAS bricht während des Kopierens ab** → Original bleibt im Eingang, halbe Kopie wird entfernt bzw. nicht als „abgelegt" gewertet.
- **OneDrive „Dateien bei Bedarf"**: Zielordner ist lokal synchronisiert; Schreiben erfolgt lokal, OneDrive lädt später hoch – kein Warten auf den Upload.
- **Sehr schnelles Ablegen hintereinander** (Strg + Enter mehrfach) → jeder Scan wird nur einmal abgelegt; Tastendruck während eines laufenden Ablegens wird ignoriert.
- **KI-Analyse läuft noch** → Ablegen ist trotzdem möglich, sobald der Dateiname gültig ist (z. B. selbst eingegeben).

## Technical Requirements (optional)
- **Datensicherheit:** Nie überschreiben; Original erst nach geprüfter Kopie löschen; im Zweifel doppelt statt verloren.
- **Performance:** Ablegen eines üblichen Scans (einige MB) von der NAS in OneDrive in < 3 s; nächster Scan erscheint direkt danach.
- **Sicherheit:** Nur Dateien aus dem konfigurierten Eingang; Ziele ausschliesslich `<Ablage>\Rechnungen\<Jahr>\` bzw. `<Eingang>\Abgelegt\` – der Dateiname darf keinen Pfad enthalten (kein Ausbrechen per `..\`). Nur lokale Anfragen (wie PROJ-1 bis PROJ-4).
- **Browser:** Chrome, Edge, Firefox, Safari (aktuelle Versionen).

## Open Questions
- [ ] Soll die Meldung nach dem Ablegen einen Link „Ordner öffnen" (Explorer) bekommen? – im MVP nicht vorgesehen, ggf. später.

## Decision Log

### Product Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Dateiname als eigenes, direkt änderbares Eingabefeld, vorbelegt aus den Feldern | Vom Nutzer gewünscht; schnelles Korrigieren ohne Umweg | 2026-11-21 |
| Dateiname folgt den Feldern, bis der Nutzer ihn selbst ändert; „Aus Feldern übernehmen" stellt die Automatik wieder her | Eigene Eingabe wird nie überschrieben, Automatik bleibt erreichbar | 2026-11-21 |
| Zwei Knöpfe: „Rechnung" → `<Ablage>\Rechnungen\JJJJ\`, „Scan" → `<Eingang>\Abgelegt\` | Vom Nutzer vorgegeben; „Scan" für alles, was keine Rechnung ist (Briefe, Mitteilungen) | 2026-11-21 |
| „Scan" benennt ebenfalls nach dem Dateiname-Feld um, sonst Originalname; kein Jahresordner | Auffindbar über die OneDrive-/Explorer-Suche; einfach gehalten | 2026-11-21 |
| Jahresordner aus dem Datumsfeld, nicht aus dem Dateinamen | Eindeutig, auch wenn der Name manuell geändert wurde | 2026-11-21 |
| „Rechnung" nur mit gültigem Namen und Datum, „Scan" immer möglich | Archiv bleibt sauber; Nicht-Rechnungen sollen den Eingang nie blockieren | 2026-11-21 |
| Keine Rückfrage vor dem Ablegen, dafür „Rückgängig" in der Meldung (~8 s) | Ziel < 30 s pro Dokument; Fehlklick bleibt korrigierbar | 2026-11-21 |
| Namenskonflikt → Nummer anhängen (`_2`, vor `_Garantie`), nie überschreiben; identischer Inhalt → nur Eingang bereinigen | Kein Datenverlust, keine Duplikate | 2026-11-21 |
| Verschieben = kopieren, prüfen, dann Original löschen; im Zweifel doppelt statt verloren | Eingang (NAS) und Ablage (OneDrive) liegen auf verschiedenen Laufwerken | 2026-11-21 |
| Fehlende Ziel-/Jahresordner werden automatisch angelegt | Kein manueller Schritt zum Jahreswechsel | 2026-11-21 |
| Nach dem Ablegen automatisch nächster Scan (Regel aus PROJ-2) | Flüssiges Abarbeiten des Stapels | 2026-11-21 |
| Tastenkürzel Strg + Enter (Rechnung), Strg + Umschalt + Enter (Scan), auch aus Eingabefeldern | Schneller ohne Maus; vom Nutzer bestätigt | 2026-11-21 |

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
