"use client"

import { useEffect, useRef } from "react"
import { CircleAlert, Loader2, RefreshCw, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { InboxListItem } from "@/components/inbox/inbox-list-item"
import type { InboxState } from "@/hooks/use-inbox"
import { formatTime } from "@/lib/inbox-format"
import { folderCheckMessage } from "@/lib/settings-messages"
import { cn } from "@/lib/utils"

interface InboxListProps {
  state: InboxState
  selected: string | null
  onSelect: (name: string) => void
  onMove: (delta: number) => void
}

function StaleNotice({ state }: { state: InboxState }) {
  const since = state.lastGoodAt ? ` – letzter Stand von ${formatTime(state.lastGoodAt)}` : ""
  const reason =
    state.staleStatus === null
      ? "Liste konnte nicht aktualisiert werden"
      : state.staleStatus === "unreachable"
        ? "Eingangsordner nicht erreichbar"
        : folderCheckMessage({ status: state.staleStatus, path: "" }, false)
  return (
    <Alert className="mb-3 border-amber-500/50" role="status">
      <WifiOff className="h-4 w-4 !text-amber-600" aria-hidden />
      <AlertDescription className="text-sm">
        {reason}
        {since}. Neuer Versuch läuft automatisch.
      </AlertDescription>
    </Alert>
  )
}

export function InboxList({ state, selected, onSelect, onMove }: InboxListProps) {
  const { inbox, failed, refreshing, stale, refresh } = state
  const files = inbox?.files ?? []
  const optionRefs = useRef(new Map<string, HTMLDivElement>())

  // Keep the selected entry visible (e.g. when moving with the arrow keys)
  useEffect(() => {
    if (selected) optionRefs.current.get(selected)?.scrollIntoView({ block: "nearest" })
  }, [selected])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      onMove(1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      onMove(-1)
    }
  }

  const optionId = (index: number) => `inbox-option-${index}`
  const selectedIndex = selected ? files.findIndex((f) => f.name === selected) : -1

  return (
    <section className="flex h-full min-h-0 flex-col" aria-labelledby="inbox-heading">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <h2 id="inbox-heading" className="text-base font-semibold">
          Eingang{inbox && !failed ? ` (${files.length})` : ""}
        </h2>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} aria-label="Liste aktualisieren">
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          )}
          Aktualisieren
        </Button>
      </div>

      {stale && !failed && <StaleNotice state={state} />}

      {failed ? (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" aria-hidden />
          <AlertTitle>Liste konnte nicht geladen werden</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Der lokale Server antwortet nicht. Läuft das Tool noch?</p>
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      ) : inbox === null ? (
        <div className="space-y-2" aria-busy="true" aria-label="Eingang wird geladen">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        // Stale without any known scans: the notice above says everything
        stale ? null : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
            <p className="font-medium">Keine neuen Scans – alles abgelegt 🎉</p>
            <p className="break-all font-mono text-xs text-muted-foreground">{inbox.folder}</p>
          </div>
        )
      ) : (
        <ScrollArea
          /* Radix renders the viewport content as display:table, which lets long
             names widen the list – force block layout so names truncate */
          className="min-h-0 flex-1 [&_[data-radix-scroll-area-viewport]>div]:!block"
        >
          <div
            role="listbox"
            tabIndex={0}
            aria-label="Scans im Eingang"
            aria-activedescendant={selectedIndex >= 0 ? optionId(selectedIndex) : undefined}
            onKeyDown={onKeyDown}
            className={cn(
              "space-y-1 rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              stale && "opacity-60"
            )}
          >
            {files.map((file, index) => (
              <InboxListItem
                key={file.name}
                ref={(el) => {
                  if (el) optionRefs.current.set(file.name, el)
                  else optionRefs.current.delete(file.name)
                }}
                id={optionId(index)}
                file={file}
                selected={file.name === selected}
                isNew={state.newNames.has(file.name)}
                onSelect={() => onSelect(file.name)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </section>
  )
}
