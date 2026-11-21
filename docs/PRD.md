# Product Requirements Document – ScanTool

## Vision
ScanTool ist ein lokales Werkzeug, das eingescannte Rechnungen und Garantiescheine aus einem OneDrive-Eingangsordner anzeigt, per KI analysiert und mit einem einheitlichen, aussagekräftigen Namen in eine geordnete Ablage verschiebt. Statt kryptischer Dateinamen wie „Scan_0012.pdf“ entsteht ein Archiv, in dem jedes Dokument in Sekunden wiederzufinden ist.

## Target Users
**Einzelnutzer (Eigentümer des Tools)**, der Rechnungen und Garantiescheine privat digital archiviert.
- **Problem:** Scans landen unsortiert und mit nichtssagenden Namen im Eingang. Manuelles Umbenennen und Einsortieren ist mühsam und wird aufgeschoben.
- **Bedürfnis:** schnell prüfen, sinnvoll benennen, einheitlich ablegen und später über Lieferant oder Artikel wiederfinden, etwa im Garantiefall.

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | Projekt-Setup & Einstellungen (Ordnerpfade, Claude-API-Schlüssel) – PROJ-1 | Deployed (lokal) |
| P0 (MVP) | Eingangsliste: neue PDFs im Eingangsordner anzeigen – PROJ-2 | Deployed (lokal) |
| P0 (MVP) | PDF-Vorschau – PROJ-3 | Deployed (lokal) |
| P0 (MVP) | KI-Analyse: Typ, Datum, Lieferant, Beschreibung, Betrag u. a. vorschlagen – PROJ-4 | Deployed (lokal) |
| P0 (MVP) | Prüfen & Ablegen: Felder bearbeiten, Dateiname bilden, in Zielordner verschieben, Fehlscans in den Papierkorb – PROJ-5 | Deployed (lokal) |
| P1 | OCR-Modus mit Umschalter KI/OCR | Planned |
| P1 | Metadaten-Datenbank (Supabase) | Planned |
| P1 | Suche & Filter über Metadaten | Planned |
| P1 | Garantie-Übersicht (bald ablaufende Garantien) | Planned |
| P2 | Automatikmodus (Ablage ohne Bestätigung bei hoher Sicherheit) | Planned |
| P2 | Weitere Dokumenttypen | Planned |

**Ablagekonvention (MVP):**
- Dateiname: `JJMMTT_Lieferant_Beschreibung.pdf`, z. B. `261121_Digitec_Monitor-Dell-U2724D.pdf`
- Garantiescheine erhalten den Zusatz `_Garantie`, z. B. `261121_Digitec_Monitor-Dell-U2724D_Garantie.pdf`
- Ordner: `<Ablage>\Rechnungen\JJJJ\` – für Rechnungen **und** Garantiescheine (keine Trennung)

**Ablauf (MVP):** Eingangsliste (links) → PDF-Vorschau (Mitte) → KI-Vorschläge bearbeitbar (rechts) → „Ablegen“ verschiebt die Datei → nächster Scan.

## Success Metrics
- Ein Dokument ist in unter 30 Sekunden geprüft und abgelegt.
- Bei mindestens 80 % der Dokumente wird der KI-Vorschlag ohne oder mit nur kleiner Korrektur übernommen.
- Kein Scan liegt länger als eine Woche unsortiert im Eingang.
- Jedes Dokument ist über die OneDrive-Suche nach Lieferant oder Artikel in Sekunden auffindbar.

## Constraints
- **Team:** eine Person, Entwicklung mit Claude Code
- **Zeitplan:** kein fester Termin (Nebenprojekt), MVP in wenigen Wochen nutzbar
- **Betrieb:** nur lokal auf dem eigenen PC (localhost), kein Hosting, kein Login
- **Dateizugriff:** direkt über das Dateisystem, keine Microsoft Graph API. Eingang: Netzwerkfreigabe der Fritz!Box-NAS (Scanner legt dort ab, UNC-Pfad); Ablage: lokal synchronisierter OneDrive-Ordner. Eingang und Ablage liegen damit auf verschiedenen Laufwerken.
- **KI:** Claude API mit eigenem API-Schlüssel (separat vom Claude-Abo, Abrechnung nach Verbrauch, wenige Rappen pro Dokument)
- **Backend:** im MVP keine Datenbank, Supabase folgt in P1
- **Design:** keine Vorgaben, Standard shadcn/ui mit hellem und dunklem Modus
- **Risiko:** OneDrive „Dateien bei Bedarf“: Scans im Eingangsordner müssen lokal verfügbar sein

## Non-Goals
- Kein OCR-Modus bzw. Umschalter (P1)
- Keine Datenbank, Suche oder Garantie-Übersicht (P1)
- Kein FTP-Eingang
- Kein Automatikmodus ohne Bestätigung
- Kein Online-Betrieb, keine Mehrbenutzer-Funktion, kein Login
- Keine anderen Dokumenttypen als Rechnung und Garantieschein
- Kein Bearbeiten von PDFs (drehen, zusammenfügen, trennen)

---

Use `/write-spec` to create detailed feature specifications for each item in the roadmap above.
