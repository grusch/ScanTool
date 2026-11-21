# PROJ-5: Prüfen & Ablegen

## Status: In Progress
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
- [ ] Angenommen Lieferant oder Beschreibung fehlen, wenn das Dateiname-Feld angezeigt wird, dann steht der Name aus den vorhandenen Teilen darin (mindestens das Datum, z. B. `261113_.pdf`) mit dem Hinweis, was fehlt; ohne gültiges Datum ist es leer – in beiden Fällen selbst ausfüllbar
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
- [ ] Rückgängig-Kennungen gehen bei einem Neustart von ScanTool verloren (bewusst, Meldung dauert nur ~8 s) – reicht das in der Praxis?
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
| Verschieben = Kopie unter Zwischenname → SHA-256 + Grösse prüfen → umbenennen → Original löschen (NAS → OneDrive); gleiches Laufwerk („Scan“) = direktes Umbenennen | Kein Datenverlust über Laufwerksgrenzen; keine halben Dateien in OneDrive | 2026-11-21 |
| Neue Schnittstelle „Scan ablegen“: Browser sendet nur Scan-Name, Ziel (Enum), Dateiname, Jahr; Pfade bildet der Server aus den Einstellungen | Path Traversal ausgeschlossen; gleiche Namensprüfung wie PROJ-3/4 | 2026-11-21 |
| Gemeinsame Dateinamen-Prüfregel (Browser + Server): verbotene Zeichen, Steuerzeichen, reservierte Windows-Namen, Punkt/Leerzeichen am Ende, max. 100 Zeichen, `.pdf` ergänzen | Sofortiges Feedback im Browser; Server prüft trotzdem selbst | 2026-11-21 |
| Konflikt: nächste freie Nummer (`_2` …, vor `_Garantie`); identischer Inhalt (Prüfsumme) gegen gleichen Namen und Nummern-Varianten → nur Eingang bereinigen | Nie überschreiben, keine Duplikate | 2026-11-21 |
| Fehlende Zielordner (`Rechnungen`, Jahr, `Abgelegt`) werden rekursiv angelegt | Kein manueller Schritt zum Jahreswechsel | 2026-11-21 |
| Rückgängig über zufällige Kennung im Server-Arbeitsspeicher (~10 min), inkl. Originalname, Zeitstempel und KI-Vorschlag | Browser kennt keine Pfade; Fingerabdruck stimmt wieder; keine erneuten KI-Kosten | 2026-11-21 |
| Eigener Dateiname je Scan im bestehenden Entwurfs-Speicher der Arbeitsfläche (PROJ-4) | Gleiches Verhalten wie die übrigen Felder beim Scan-Wechsel | 2026-11-21 |
| Ergebnis- und Rückgängig-Meldung über sonner-Toast (bereits installiert) | Kein neues Paket; nicht blockierend | 2026-11-21 |
| Tastenkürzel zentral in der Arbeitsfläche, gesperrt während eines laufenden Ablegens | Funktioniert aus allen Feldern; kein doppeltes Ablegen | 2026-11-21 |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick
PROJ-5 ergänzt die rechte Spalte (Vorschläge aus PROJ-4) um den **Ablage-Bereich**, also Dateiname-Feld und die Knöpfe „Rechnung“ und „Scan“. Dazu kommt eine **Server-Schnittstelle**, die eine Datei sicher verschiebt, und eine zweite für **Rückgängig**.

Wiederverwendet:
- aus PROJ-1: Eingangs- und Ablage-Ordner aus den Einstellungen, NAS-Schnellprüfung, Ordner-Prüfung und Zugriffsschutz
- aus PROJ-2: Liste aktualisieren und Auswahl-Regel „nächster Scan“
- aus PROJ-3: Prüfung der Scan-Namen
- aus PROJ-4: Felder, Dateiname-Regel, eigene Eingaben je Scan und Ergebnis-Speicher der KI
- die bereits installierten Toast-Meldungen (sonner) für die Meldung mit „Rückgängig“

### A) Komponenten-Struktur

```
Rechte Spalte „Vorschläge“ (PROJ-4)
+-- Kopf, Hinweise, Formular (unverändert)
+-- Ablage-Bereich  ← NEU (ersetzt die bisherige Dateiname-Vorschau)
|   +-- Eingabefeld „Dateiname“ (vorbelegt aus den Feldern)
|   |   +-- Hinweis darunter: was fehlt / was ungültig ist (z. B. „Unerlaubtes Zeichen: /“)
|   |   +-- Knopf „Aus Feldern übernehmen“ (nur sichtbar, wenn selbst geändert)
|   +-- Zielanzeige klein: „→ Rechnungen\2026\“ bzw. „→ Scanner\Abgelegt\“
|   +-- [Rechnung] (Haupt-Knopf)   [Scan] (Neben-Knopf)
|       - Ladezustand während des Ablegens, beide gesperrt
|       - Tooltip: Kürzel bzw. Grund, warum deaktiviert
+-- Vermerk „bereits abgelegt – Original noch im Eingang“ (nur in diesem Sonderfall)

Arbeitsfläche (PROJ-2)
+-- Tastenkürzel Strg + Enter / Strg + Umschalt + Enter (für die ganze Hauptansicht)

Meldung unten rechts (Toast, ca. 8 s)
+-- „Abgelegt: Rechnungen\2026\…pdf“ (+ „Name war schon vergeben“ / „War bereits abgelegt“)
+-- [Rückgängig]
```

Verwendete vorhandene Bausteine: Input, Button, Tooltip, Label, sonner (Toast). Keine neuen Pakete.

### B) Datenmodell

```
Nur im Browser (flüchtig, je Scan, wie die eigenen Eingaben aus PROJ-4):
- selbst geänderter Dateiname (fehlt = Name folgt automatisch den Feldern)
- „abgelegt, Original noch im Eingang“-Vermerk (Sonderfall Löschen fehlgeschlagen)

Ablege-Auftrag (Browser → Server):
- Scan (Dateiname im Eingang – nur der Name, kein Pfad)
- Ziel: „Rechnung“ oder „Scan“
- neuer Dateiname (nur der Name, kein Pfad)
- Jahr (nur bei „Rechnung“, aus dem Datumsfeld)

Ergebnis (Server → Browser):
- Status: abgelegt | war bereits abgelegt (nur Eingang bereinigt) | abgelegt, Original nicht gelöscht | Fehlergrund
- tatsächlicher Ablageort zur Anzeige (relativ, z. B. „Rechnungen\2026\…_2.pdf“)
- Name wurde wegen Konflikt geändert: ja/nein
- Rückgängig-Kennung (zufällig, nur kurz gültig)

Rückgängig-Merkzettel (nur im Server-Arbeitsspeicher, ca. 10 Minuten):
- Kennung → wo die Datei jetzt liegt, ursprünglicher Name, ursprüngliche Zeitstempel,
  gemerkte KI-Vorschläge des Scans
```

Es gibt keine Datenbank und keine neue Datei auf der Festplatte. Die Metadaten werden erst mit PROJ-8 gespeichert.

**Gemeinsame Prüfregel für Dateinamen**, gilt im Browser und auf dem Server gleich:
- nicht leer, höchstens 100 Zeichen, `.pdf` wird ergänzt
- keine `\ / : * ? " < > |` und keine Steuerzeichen
- nicht nur Punkte oder Leerzeichen, kein Punkt bzw. Leerzeichen am Ende
- keine reservierten Windows-Namen (`CON`, `NUL`, `COM1` …)

### C) Server-Schnittstellen (in Worten)

| Schnittstelle | Zweck |
|---------------|-------|
| **Scan ablegen** | Erhält Scan-Name, Ziel („Rechnung“/„Scan“), neuen Dateinamen und ggf. Jahr. Der **Zielordner wird ausschließlich auf dem Server gebildet**: `<Ablage>\Rechnungen\<Jahr>\` bzw. `<Eingang>\Abgelegt\` aus den gespeicherten Einstellungen. Der Browser kann keinen Pfad vorgeben. |
| **Rückgängig** | Erhält nur die Rückgängig-Kennung. Verschiebt die Datei an den ursprünglichen Platz im Eingang zurück, mit ursprünglichem Namen und Zeitstempel, und stellt die gemerkten KI-Vorschläge wieder her. |

Beide Schnittstellen sind nur lokal erreichbar, mit demselben Schutz wie bisher.

### D) Abläufe

**Sicheres Verschieben** („Rechnung“, NAS → OneDrive, verschiedene Laufwerke):
1. Prüfen: Eingang erreichbar, Scan vorhanden, Ablage-Ordner erreichbar und beschreibbar. Fehlende Ordner (`Rechnungen`, Jahresordner, `Abgelegt`) werden angelegt.
2. Freien Namen finden:
   - Ist der Name frei, wird er verwendet.
   - Liegt im Ziel schon eine Datei mit diesem Namen oder einer Nummern-Variante **mit identischem Inhalt**, wird nichts kopiert, sondern nur das Original gelöscht („war bereits abgelegt“).
   - Sonst kommt die nächste freie Nummer `_2`, `_3` …, bei Garantiescheinen vor `_Garantie`.
3. Unter einem **unsichtbaren Zwischennamen** in den Zielordner kopieren. So taucht eine halbe Datei nie unter dem echten Namen in OneDrive auf.
4. Kopie prüfen: gleiche Größe und gleiche Prüfsumme (SHA-256) wie das Original.
5. Zwischenname → endgültiger Name. Vorher wird noch einmal geprüft, ob der Name frei ist. Es wird nie überschrieben.
6. Original im Eingang löschen. Klappt das nicht, gilt der Status „abgelegt, Original nicht gelöscht“, und die Kopie bleibt.
7. Bei einem Fehler in Schritt 3–5 wird die Zwischendatei entfernt, und das Original bleibt unangetastet.

**„Scan“ (gleiches Laufwerk, NAS → NAS):** Hier wird direkt umbenannt bzw. verschoben, das ist ein einziger Schritt ohne Kopie. Die Regeln für freie Namen und identische Inhalte gelten genauso.

**Im Browser nach dem Ablegen:**
- Liste sofort aktualisieren, damit der nächste Scan ausgewählt wird (PROJ-2), und die Meldung mit „Rückgängig“ zeigen.
- Die KI-Ergebnisse des abgelegten Scans räumt der Server beim Auflisten ohnehin auf (PROJ-4). Für Rückgängig hat er sie vorher in den Merkzettel gelegt.

**Rückgängig:**
- Die Datei kommt zurück in den Eingang, mit ursprünglichem Namen und ursprünglicher Änderungszeit.
- Ist der Name im Eingang inzwischen belegt, wird eine Nummer angehängt.
- Weil Name, Größe und Zeit wieder stimmen, erkennt der Browser den Scan wieder („Fingerabdruck“ aus PROJ-4). Deine Eingaben und die KI-Vorschläge sind sofort wieder da, ohne erneute Kosten.
- Ist die Datei am Ablageort nicht mehr vorhanden oder die Kennung abgelaufen, erscheint „Rückgängig nicht möglich“.

**Dateiname-Feld:**
- Es zeigt den automatisch gebildeten Namen, solange du es nicht selbst änderst.
- Hast du es geändert, wird dein Wert je Scan gemerkt. „Aus Feldern übernehmen“ löscht nur diesen gemerkten Wert.

**Knöpfe und Tastenkürzel:**
- „Rechnung“ ist aktiv, wenn der Name gültig ist und das Datumsfeld ein gültiges Datum hat.
- „Scan“ ist immer aktiv, bei ungültigem Namen wird der Originalname verwendet.
- Die Kürzel wirken in der ganzen Hauptansicht, auch aus Eingabefeldern heraus. Läuft gerade ein Ablegen, werden sie ignoriert.

**Fehler** (die Meldungen stammen aus der Spec):

| Situation | Erkannt durch | Ergebnis |
|-----------|---------------|----------|
| Ablage nicht erreichbar / gelöscht | Ordner-Prüfung aus PROJ-1 | nichts verändert, Eingaben bleiben |
| NAS nicht erreichbar | Schnellprüfung aus PROJ-1 | nichts verändert |
| Keine Rechte / kein Platz | Fehler beim Anlegen oder Kopieren | Zwischendatei entfernt, Original bleibt |
| Original gesperrt | Fehler beim Löschen | Kopie bleibt, Vermerk „bereits abgelegt“, erneuter Klick bereinigt nur den Eingang |
| Scan verschwunden | Scan nicht vorhanden | Liste aktualisieren |
| Ungültiger Name / Jahr / Ziel | Prüfregel auf dem Server | abgelehnt, nichts verändert |

### E) Technische Entscheidungen (Begründung)

- **Kopieren → prüfen → Original löschen statt einfachem „Verschieben“:** NAS und OneDrive sind verschiedene Laufwerke, dort ist Verschieben intern ohnehin Kopieren und Löschen, aber ohne Kontrolle. Mit Prüfsumme ist sicher, dass die Kopie vollständig ist, bevor das Original verschwindet.
- **Unsichtbarer Zwischenname im Zielordner:** OneDrive würde sonst eine halb kopierte Datei unter dem echten Namen hochladen. Das Umbenennen am Ende geht innerhalb desselben Ordners in einem Schritt.
- **Zielordner nur auf dem Server bestimmt, Browser schickt nur Namen:** Ein manipulierter Auftrag kann keine Datei außerhalb von `Rechnungen\<Jahr>` bzw. `Abgelegt` schreiben, und es gilt dieselbe Namensprüfung wie bei Vorschau und Analyse.
- **Identischer Inhalt über Prüfsumme statt nur über den Namen:** Nur so lässt sich „derselbe Scan doppelt“ von „zwei verschiedene Rechnungen mit gleichem Namen“ unterscheiden.
- **Rückgängig über eine kurzlebige Kennung im Server-Speicher:** Der Browser muss keine Pfade kennen oder zurückschicken. Nach etwa 10 Minuten oder einem Neustart verfällt sie. Für die 8-Sekunden-Meldung reicht das, und es ist sicher.
- **KI-Vorschläge im Rückgängig-Merkzettel:** Beim Auflisten werden die Ergebnisse abgelegter Scans entfernt (PROJ-4). Ohne Merkzettel würde ein Rückgängig eine neue, kostenpflichtige Analyse auslösen.
- **Ursprüngliche Zeitstempel beim Rückgängig wiederherstellen:** Damit ist der „Fingerabdruck“ identisch. Eigene Eingaben und Vorschläge erscheinen wieder, und das Scan-Datum in der Liste stimmt.
- **Gemeinsame Prüfregel für Dateinamen in Browser und Server:** Der Browser kann Knöpfe sofort korrekt aktivieren oder deaktivieren, und der Server verlässt sich trotzdem nicht darauf.
- **Toast-Meldung (sonner) für Ergebnis und Rückgängig:** Das Paket ist schon im Projekt und im Layout eingebunden, und die Meldung stört den Arbeitsfluss nicht.
- **Tastenkürzel auf der Arbeitsfläche statt am Knopf:** So funktionieren sie aus jedem Feld heraus, und doppelte Auslöser während eines laufenden Ablegens werden zentral verhindert.
- **Keine Datenbank, kein dauerhafter Speicher:** Metadaten speichert erst PROJ-8. Bis dahin steckt die Information im Dateinamen und Ablageort.

### F) Abhängigkeiten (zu installieren)
Keine. Node-Bordmittel für Dateien und Prüfsummen genügen, dazu die vorhandenen Pakete (zod, sonner, shadcn/ui).

## Implementation Notes (Frontend)
**Gebaut (2026-11-21):**
- `src/components/suggestions/filing-section.tsx` – **feste Fusszeile** der rechten Spalte (bleibt sichtbar, während die Felder scrollen): Eingabefeld „Dateiname" (vorbelegt aus `buildFileName`, folgt den Feldern bis zur eigenen Änderung), Knopf „Aus Feldern übernehmen", Hinweis bei fehlenden/ungültigen Angaben, Knöpfe **Rechnung** (Haupt) und **Scan** (Neben) mit Ladezustand und Tooltip (Ziel + Kürzel bzw. Grund der Sperre), Zielzeile „Rechnung → Rechnungen\JJJJ\ · Scan → Scanner\Abgelegt\", Vermerk „bereits abgelegt – Original noch im Eingang". Tastenkürzel Strg + Enter / Strg + Umschalt + Enter (auch aus Feldern; gesperrt während Ablegen; bei gesperrter Rechnung nur Hinweis-Toast).
- `src/lib/file-name-rules.ts` (+ 21 Unit-Tests) – gemeinsame Prüfregel (Browser + Server): verbotene Zeichen, Steuerzeichen, reservierte Windows-Namen, Punkt/Leerzeichen am Ende, max. 100 Zeichen, `.pdf` ergänzen.
- `src/hooks/use-filing.ts` – `POST /api/filing`, Toast (sonner, 8 s) mit „Rückgängig" → `POST /api/filing/undo`; Liste wird nach dem Ablegen aktualisiert (nächster Scan per PROJ-2-Regel), nach Rückgängig wird der zurückgeholte Scan wieder ausgewählt. Nur ein Ablegen gleichzeitig.
- `src/lib/filing-types.ts`, `src/lib/filing-api.ts` – Vertrag mit dem Backend und Meldungstexte.
- `inbox-workspace.tsx` – Entwurf je Scan um `fileName` erweitert (`ScanDraft`), `useFiling` eingebunden; `use-inbox.ts`: `refresh` liefert ein Promise.
- `suggestions-panel.tsx` – bisherige Dateiname-Vorschau durch den Ablage-Bereich ersetzt.

**Änderung (2026-11-21, Nutzerwunsch):** Dateiname wird auch aus Teilen gebildet (Datum immer, Lieferant/Beschreibung soweit vorhanden); fehlende Teile stehen grau darunter, Fehler im Namen rot.

**Tests:** 17 neue Komponententests (`filing-section.test.tsx`, Server simuliert): Name folgt Feldern / eigener Name / „Aus Feldern übernehmen", ungültiger Name, ohne Datum, Name je Scan, Rechnung mit Jahr aus dem Datumsfeld + nächster Scan, Scan mit Namen bzw. Originalname, Tastenkürzel, Sperre bei Doppelauslösung, Konflikt/bereits abgelegt, Fehler (Ablage/NAS/Rechte), Original nicht gelöscht, Rückgängig inkl. Wiederauswahl und Eingaben, Rückgängig nicht möglich. Bestehende PROJ-4-Tests auf das Dateiname-Feld umgestellt. Vitest gesamt 241/241.

**Abweichungen / Hinweise:**
- Tastenkürzel hängen am Ablage-Bereich (immer genau einer sichtbar, solange ein Scan ausgewählt ist) statt an der Arbeitsfläche – gleiche Wirkung, einfacher.
- Geprüft im Dev-Server mit simulierter Schnittstelle (nichts verschoben): Darstellung, Tooltip, Toast mit „Rückgängig", 375 px ohne seitliches Scrollen.

## Implementation Notes (Backend)
**Gebaut (2026-11-21):**
- `POST /api/filing` (`src/app/api/filing/route.ts`) – Body `{ scan, target: "rechnung"|"scan", fileName|null, year? }` (Zod). Antwort `{ ok: true, status: "filed"|"already_filed"|"copied_not_deleted", location, renamed, undoToken? }` oder `{ ok: false, code }`: 400 `invalid_request`, 404 `not_found`, 409 `no_permission`, 503 `inbox_unreachable`/`archive_unreachable`, 500 `unknown`, 403 nicht lokal.
- `POST /api/filing/undo` (`…/undo/route.ts`) – Body `{ token }` (UUID). Antwort `{ ok: true, name, renamed }` oder 410 `expired`/`gone`, 503 `inbox_unreachable`.
- `src/lib/server/filing.ts`:
  - Prüfung: Scan-Name wie PROJ-3, Dateiname mit `validateFileName` (gleiche Regel wie im Browser), „Rechnung" braucht Name + Jahr (1990–2100).
  - Zielordner nur aus den Einstellungen: `<Ablage>\Rechnungen\<Jahr>\` (Ablage-Stammordner muss existieren, wird nie angelegt) bzw. `<Eingang>\Abgelegt\`; Unterordner werden rekursiv angelegt.
  - Namenswahl: Name und Nummern-Varianten (`_2` …, vor `_Garantie`) – erste freie; existiert eine Variante mit gleicher Grösse und SHA-256 → `already_filed` (nur Eingang bereinigen).
  - „Rechnung": Kopie unter `~$scantool-<zufall>.tmp` im Zielordner (`COPYFILE_EXCL`) → Grösse + SHA-256 prüfen → nochmals prüfen, ob der Name frei ist → umbenennen → Änderungsdatum übernehmen → Original löschen. Fehler → Zwischendatei entfernt, Original unangetastet. Löschen scheitert → `copied_not_deleted` (nächster Versuch erkennt die identische Datei).
  - „Scan": gleiches Laufwerk → direktes Umbenennen (nach Konflikt-Prüfung).
  - Pro Scan nur ein Ablegen gleichzeitig (Sperre im Server); eine zweite gleichzeitige Anfrage findet den Scan nicht mehr (`not_found`).
  - Rückgängig-Merkzettel im Arbeitsspeicher (10 min, einmal verwendbar): Ablageort, Originalname, Zeitstempel, gemerkte KI-Vorschläge. Undo legt die Datei mit Originalname (bei Belegung `_2`) und Originaldatum zurück und stellt die KI-Vorschläge im Ergebnis-Speicher wieder her → keine neue Analyse.

**Tests:** `src/app/api/filing/filing.test.ts` – 31 Integrationstests mit echten Dateien in temporären Ordnern: Rechnung (Ordner anlegen, Inhalt + Datum, keine Zwischendateien), Jahr aus der Anfrage, `.pdf` ergänzen, Konflikte `_2`/`_3`/`_2_Garantie`, identische Datei (auch als `_2`), Original gesperrt → copied_not_deleted → zweiter Versuch bereinigt, kaputte Kopie wird erkannt, kein Platz, Ablage fehlt (Stammordner wird nicht angelegt), Scan nach Abgelegt (mit/ohne Namen, Konflikt), 8 ungültige Anfragen ohne Veränderung, NAS unerreichbar < 5 s, gleichzeitige Anfragen = einmal abgelegt, fremde Webseiten 403, Rückgängig (Rechnung inkl. Datum + KI-Vorschlag, Scan, belegter Name → `_2`, Datei weg → gone, unbekannt/abgelaufen, Token nur einmal). Vitest gesamt 272/272.

**Live (mit Zustimmung, eigene Testdatei, NAS → OneDrive):** Ablegen 1,4 s, Inhalt identisch, Datum erhalten, keine Zwischendateien; Rückgängig 0,8 s, Datei wieder im Eingang und aus der Ablage entfernt; Testdatei danach gelöscht. Dabei wurde `Finanzen\Rechnungen6\` neu angelegt (bleibt leer bestehen). Der Nutzer hat zudem selbst einen Brief per „Scan" abgelegt → korrekt in `Scanner\Abgelegt\` mit Originaldatum.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
