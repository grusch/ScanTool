"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileSearch, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { InboxList } from "@/components/inbox/inbox-list"
import { useInbox } from "@/hooks/use-inbox"
import { moveSelection, reconcileSelection } from "@/lib/inbox-selection"
import type { InboxResponse } from "@/lib/inbox-types"

interface InboxWorkspaceProps {
  /** List rendered by the server with the page (null → loaded in the browser) */
  initialInbox: InboxResponse | null
}

function Placeholder({ icon: Icon, title, text }: { icon: typeof FileSearch; title: string; text: string }) {
  return (
    <Card className="flex h-full min-h-48 flex-col items-center justify-center gap-2 border-dashed p-6 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      <p className="max-w-xs break-all text-sm text-muted-foreground">{text}</p>
    </Card>
  )
}

/** Three-column work area: inbox list · PDF preview (PROJ-3) · suggestions (PROJ-4/5) */
export function InboxWorkspace({ initialInbox }: InboxWorkspaceProps) {
  const state = useInbox(initialInbox)
  const { clearNew } = state
  const files = state.inbox?.files ?? []
  const ids = files.map((f) => f.name)
  const idsKey = ids.join("\n")

  const [selected, setSelected] = useState<string | null>(() => reconcileSelection([], ids, null))
  const prevIds = useRef<string[]>(ids)

  // Re-apply the selection rules whenever the list content changes
  useEffect(() => {
    const next = idsKey ? idsKey.split("\n") : []
    setSelected((current) => reconcileSelection(prevIds.current, next, current))
    prevIds.current = next
  }, [idsKey])

  // Selecting a scan removes its "new" marker
  useEffect(() => {
    if (selected) clearNew(selected)
  }, [selected, clearNew])

  const onMove = useCallback(
    (delta: number) => setSelected((current) => moveSelection(prevIds.current, current, delta)),
    []
  )

  return (
    // grid-cols-1 = minmax(0,1fr): without it the single mobile column grows with long file names
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(280px,340px)]">
      <Card className="flex max-h-[60vh] min-h-0 flex-col lg:max-h-none">
        <CardContent className="flex min-h-0 flex-1 flex-col p-3">
          <InboxList state={state} selected={selected} onSelect={setSelected} onMove={onMove} />
        </CardContent>
      </Card>
      <Placeholder
        icon={FileSearch}
        title="PDF-Vorschau"
        text={selected ? `Ausgewählt: ${selected} – Vorschau folgt mit PROJ-3` : "Kein Scan ausgewählt"}
      />
      <Placeholder icon={Sparkles} title="Vorschläge" text="KI-Vorschläge und Ablegen folgen mit PROJ-4/5" />
    </div>
  )
}
