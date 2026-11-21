import { Inbox } from "lucide-react"

// Main view. Access check (redirect to /einstellungen, API-key notice) is wired
// up server-side in the PROJ-1 backend; content follows with PROJ-2 to PROJ-5.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">Eingang</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Hier erscheinen bald die neuen Scans aus deinem Eingangsordner.
        </p>
      </div>
    </div>
  )
}
