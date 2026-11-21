"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PdfPreview } from "@/components/preview/pdf-preview"
import { SuggestionsPanel } from "@/components/suggestions/suggestions-panel"
import { Card, CardContent } from "@/components/ui/card"
import { InboxList } from "@/components/inbox/inbox-list"
import { useInbox } from "@/hooks/use-inbox"
import { useFiling } from "@/hooks/use-filing"
import { scanKey } from "@/hooks/use-scan-analysis"
import { moveSelection, reconcileSelection } from "@/lib/inbox-selection"
import type { InboxResponse } from "@/lib/inbox-types"
import type { FieldName, ScanDraft } from "@/lib/suggestion-form"

interface InboxWorkspaceProps {
  /** List rendered by the server with the page (null → loaded in the browser) */
  initialInbox: InboxResponse | null
  /** API key configured (PROJ-1) – without it no AI analysis is started */
  apiKeyPresent: boolean
}

/** Three-column work area: inbox list · PDF preview (PROJ-3) · suggestions (PROJ-4/5) */
export function InboxWorkspace({ initialInbox, apiKeyPresent }: InboxWorkspaceProps) {
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
    // Capture the previous list now: the state updater runs later, after the ref was overwritten
    const prev = prevIds.current
    prevIds.current = next
    setSelected((current) => reconcileSelection(prev, next, current))
  }, [idsKey])

  // Selecting a scan removes its "new" marker
  useEffect(() => {
    if (selected) clearNew(selected)
  }, [selected, clearNew])

  // Values the user typed, per scan (name + size + date) – kept while ScanTool is open
  const [drafts, setDrafts] = useState<Record<string, ScanDraft>>({})
  const selectedFile = files.find((f) => f.name === selected) ?? null
  const draftKey = selectedFile ? scanKey(selectedFile) : ""
  const onFieldChange = useCallback(
    (field: FieldName, value: string) =>
      setDrafts((d) => ({ ...d, [draftKey]: { ...d[draftKey], [field]: value } })),
    [draftKey]
  )
  const onNameChange = useCallback(
    (name: string) => setDrafts((d) => ({ ...d, [draftKey]: { ...d[draftKey], fileName: name } })),
    [draftKey]
  )
  const onResetName = useCallback(
    () =>
      setDrafts((d) => {
        const { fileName: _own, ...rest } = d[draftKey] ?? {}
        return { ...d, [draftKey]: rest }
      }),
    [draftKey]
  )

  // Filing (PROJ-5): list refresh selects the next scan; undo selects the restored one
  const { refresh } = state
  const filing = useFiling({ refresh, onRestored: setSelected })

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
      <PdfPreview selected={selected} onScanMissing={state.refresh} listCheckedAt={state.inbox?.checkedAt} />
      <SuggestionsPanel
        file={selectedFile}
        apiKeyPresent={apiKeyPresent}
        touched={drafts[draftKey] ?? {}}
        onChange={onFieldChange}
        onScanMissing={state.refresh}
        listCheckedAt={state.inbox?.checkedAt}
        onNameChange={onNameChange}
        onResetName={onResetName}
        filingBusy={filing.busy}
        alreadyCopied={selected !== null && filing.alreadyCopied.has(selected)}
        onFile={filing.file}
      />
    </div>
  )
}
