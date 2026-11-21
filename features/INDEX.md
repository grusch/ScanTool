# Feature Index

> Central tracking for all features. Updated by skills automatically.

## Status Legend
- **Roadmap** - `/init` done, feature identified in feature map, no spec file yet
- **Planned** - `/write-spec` done, full spec written, architecture not yet designed
- **Architected** - `/architecture` done, tech design approved, ready to build
- **In Progress** - `/frontend` or `/backend` active or completed, not yet in QA
- **In Review** - `/qa` active, testing in progress
- **Approved** - `/qa` passed, no critical/high bugs, ready to deploy
- **Deployed** - `/deploy` done, live in production

## Features

| ID | Feature | Beschreibung | Prio | Abhängig von | Status | Spec | Created |
|----|---------|--------------|------|--------------|--------|------|---------|
| PROJ-1 | Einstellungen & Setup | Ordnerpfade (Eingang, Ablage) und Claude-API-Schlüssel konfigurieren und prüfen | P0 | None | Deployed | [PROJ-1-einstellungen-setup.md](PROJ-1-einstellungen-setup.md) | 2026-11-21 |
| PROJ-2 | Eingangsliste | PDFs im Eingangsordner auflisten, aktualisieren, Scan auswählen | P0 | PROJ-1 | Deployed | [PROJ-2-eingangsliste.md](PROJ-2-eingangsliste.md) | 2026-11-21 |
| PROJ-3 | PDF-Vorschau | Ausgewählten Scan mehrseitig anzeigen (scrollen, zoomen, Ansicht drehen, in neuem Tab öffnen) | P0 | PROJ-1, PROJ-2 | Deployed | [PROJ-3-pdf-vorschau.md](PROJ-3-pdf-vorschau.md) | 2026-11-21 |
| PROJ-4 | KI-Analyse | Ausgewählten Scan automatisch an Claude senden; Typ/Datum/Lieferant/Beschreibung/Betrag/Rechnungsnr./Artikel/Garantiedauer als bearbeitbare Felder vorschlagen, Dateiname-Vorschau | P0 | PROJ-1, PROJ-2 | Deployed | [PROJ-4-ki-analyse.md](PROJ-4-ki-analyse.md) | 2026-11-21 |
| PROJ-5 | Prüfen & Ablegen | Dateiname als direkt änderbares Eingabefeld (vorbelegt aus den Feldern von PROJ-4), daneben drei Knöpfe: „Rechnung" → Datei als `JJMMTT_Lieferant_Beschreibung[_Garantie].pdf` in `<Ablage>\Rechnungen\JJJJ\` verschieben (Zielordner anlegen, Namenskonflikte behandeln); „Scan" → Datei in ein Unterverzeichnis des Scanner-Eingangs verschieben (`Abgelegt`, Name aus dem Dateiname-Feld); „Löschen" → Datei unter Originalname nach `Papierkorb` im Scanner-Eingang verschieben | P0 | PROJ-2, PROJ-4 | Deployed | [PROJ-5-pruefen-ablegen.md](PROJ-5-pruefen-ablegen.md) | 2026-11-21 |
| PROJ-6 | OCR-Modus & Umschalter | Texterkennung plus Regeln als Alternative zur KI, umschaltbar in den Einstellungen | P1 | PROJ-4 | Roadmap | – | 2026-11-21 |
| PROJ-7 | Supabase Infrastructure Setup | Supabase-Projekt, Umgebungsvariablen, Datenbankschema | P1 | None | Roadmap | – | 2026-11-21 |
| PROJ-8 | Metadaten speichern | Beim Ablegen Metadaten und Dateipfad in die Datenbank schreiben | P1 | PROJ-5, PROJ-7 | Roadmap | – | 2026-11-21 |
| PROJ-9 | Suche & Filter | Abgelegte Dokumente nach Lieferant, Zeitraum, Betrag, Typ durchsuchen | P1 | PROJ-8 | Roadmap | – | 2026-11-21 |
| PROJ-10 | Garantie-Übersicht | Bald ablaufende Garantien anzeigen | P1 | PROJ-8 | Roadmap | – | 2026-11-21 |
| PROJ-11 | Automatikmodus | Bei hoher KI-Sicherheit ohne Bestätigung ablegen | P2 | PROJ-5 | Roadmap | – | 2026-11-21 |
| PROJ-12 | Weitere Dokumenttypen | Zusätzliche Typen mit eigenem Ablageordner | P2 | PROJ-4, PROJ-5 | Roadmap | – | 2026-11-21 |

<!-- Add features above this line -->

**Empfohlene Reihenfolge (MVP):** PROJ-1 → PROJ-2 → PROJ-3 → PROJ-4 → PROJ-5

## Next Available ID: PROJ-13
