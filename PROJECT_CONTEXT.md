# Project Context – ScanTool

> Ist-Stand des Projekts. Stand: 2026-11-21.
> Produktvision, Zielgruppe und Features folgen über `/init` → [docs/PRD.md](docs/PRD.md) und [features/INDEX.md](features/INDEX.md).

## Status

| Bereich | Stand |
|---------|-------|
| Projektidee / PRD | Festgelegt (`/init` am 2026-11-21) |
| Features | 12 definiert (PROJ-1 bis PROJ-12), alle Status „Roadmap“ |
| Frontend | Starter-Template, nur Startseite ([src/app/page.tsx](src/app/page.tsx)) |
| Backend | Supabase vorgesehen, Client noch deaktiviert |
| Deployment | Vercel vorgesehen, noch nicht eingerichtet |

## Projektidee

Lokales Tool (nur localhost, Einzelnutzer, kein Login), das eingescannte **Rechnungen und Garantiescheine** aus einem lokal synchronisierten OneDrive-Eingangsordner anzeigt, per **Claude API** analysiert und nach Bestätigung umbenannt ablegt:

- Dateiname: `JJMMTT_Lieferant_Beschreibung.pdf`
- Ablage: `<Ablage>\Rechnungen\JJJJ\` bzw. `<Ablage>\Garantiescheine\JJJJ\`
- MVP: PROJ-1 → PROJ-5 (Einstellungen, Eingangsliste, PDF-Vorschau, KI-Analyse, Prüfen & Ablegen)
- Später: OCR-Modus (P1), Supabase-Metadaten + Suche + Garantie-Übersicht (P1), Automatikmodus (P2)

Details: [docs/PRD.md](docs/PRD.md), [features/INDEX.md](features/INDEX.md)

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix UI), Icons: lucide-react |
| Formulare & Validierung | react-hook-form + Zod 4 |
| Benachrichtigungen | sonner / shadcn Toast |
| Theming | next-themes |
| Backend | Supabase (PostgreSQL, Auth, Storage) via `@supabase/supabase-js` |
| Tests | Vitest + Testing Library (Unit), Playwright (E2E) |
| Deployment | Vercel |

## Supabase-Anbindung

**MCP-Server (für Claude Code):**
- Konfiguriert in `.mcp.json` (Projekt-Root) als gehosteter Server `https://mcp.supabase.com/mcp`.
- Authentifizierung per Personal Access Token im `Authorization`-Header.
- `.mcp.json` steht in `.gitignore` und darf **nicht** committet werden, weil sie den Token enthält.
- Verbindung prüfen: `/mcp` in Claude Code.

**App-Client:**
- [src/lib/supabase.ts](src/lib/supabase.ts) ist vorbereitet, aber auskommentiert (exportiert aktuell `null`).
- Benötigt `.env.local` mit:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  ```
  (noch nicht angelegt – wird mit dem ersten Backend-Feature über `/backend` eingerichtet)

**Regeln (aus [.claude/rules/backend.md](.claude/rules/backend.md)):**
- Row Level Security auf jeder Tabelle, Policies für SELECT/INSERT/UPDATE/DELETE
- Alle Eingaben mit Zod validieren, Auth in jeder API-Route prüfen
- Keine Secrets im Code – nur Umgebungsvariablen

## Projektstruktur

```
src/
  app/              Seiten (App Router)
  components/ui/    shadcn/ui-Komponenten (nicht neu erstellen!)
  hooks/            use-mobile, use-toast
  lib/              supabase.ts, utils.ts
  test/             Vitest-Setup
features/           Feature-Specs (PROJ-X-name.md) + INDEX.md
docs/               PRD.md, Production-Guides
.claude/            Skills, Agents (frontend/backend/qa), Regeln
```

## Befehle

```bash
npm run dev        # Dev-Server → http://localhost:3000
npm run build      # Production-Build
npm run lint       # ESLint
npm test           # Vitest
npm run test:e2e   # Playwright
npm run test:all   # Beide Test-Suites
```

## Workflow

`/init` → `/write-spec` → `/architecture` → `/frontend` → `/backend` → `/qa` → `/deploy`

- Jedes Feature bekommt eine Spec in `features/PROJ-X-name.md`, Status-Tracking in `features/INDEX.md`.
- Commits: `type(PROJ-X): beschreibung` (feat, fix, refactor, test, docs, deploy, chore).
- Freigabe durch den Nutzer vor jedem nächsten Workflow-Schritt.

## Offene Punkte

- [x] `/init` ausführen: Projektidee, Zielgruppe und Feature-Roadmap festlegen
- [ ] Claude-API-Schlüssel in der Anthropic Console anlegen (separat vom Abo) – Teil von PROJ-1
- [ ] Supabase-Access-Token erneuern (alter Token war im Chat sichtbar)
- [ ] Optional: MCP-Server per `project_ref` auf ein Projekt beschränken
- [ ] `.env.local` mit Supabase-URL und Anon-Key anlegen
- Vercel entfällt vorerst – das Tool läuft nur lokal
