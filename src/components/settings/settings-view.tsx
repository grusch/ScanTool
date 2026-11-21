"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleAlert, PartyPopper, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiSettingsCard } from "@/components/settings/api-settings-card"
import { FolderSettingsCard } from "@/components/settings/folder-settings-card"
import { fetchSettingsStatus } from "@/lib/settings-api"
import { folderCheckMessage } from "@/lib/settings-messages"
import type { SettingsStatusResponse } from "@/lib/settings-types"

export function SettingsView() {
  const [status, setStatus] = useState<SettingsStatusResponse | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  // Bumped after saving so the folder card remounts with fresh checks
  const [version, setVersion] = useState(0)

  const load = useCallback(async () => {
    setLoadFailed(false)
    try {
      setStatus(await fetchSettingsStatus())
    } catch {
      setLoadFailed(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loadFailed) {
    return (
      <Alert variant="destructive">
        <CircleAlert className="h-4 w-4" aria-hidden />
        <AlertTitle>Einstellungen konnten nicht geladen werden</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Der lokale Server antwortet nicht. Läuft das Tool noch?</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!status) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Einstellungen werden geladen">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const firstRun = status.settings === null
  const missing = [status.inbox, status.archive].filter(
    (c): c is NonNullable<typeof c> => c !== null && c.status !== "ok"
  )
  const ready = !firstRun && missing.length === 0

  return (
    <div className="space-y-6">
      {firstRun && (
        <Alert>
          <PartyPopper className="h-4 w-4" aria-hidden />
          <AlertTitle>Willkommen</AlertTitle>
          <AlertDescription>Bitte richte zuerst Eingangs- und Ablageordner ein.</AlertDescription>
        </Alert>
      )}

      {missing.map((c) => (
        <Alert variant="destructive" key={c.path}>
          <CircleAlert className="h-4 w-4" aria-hidden />
          <AlertTitle>
            {c.status === "unreachable"
              ? "Netzwerkpfad nicht erreichbar"
              : c.status === "not_found"
                ? "Ordner nicht mehr gefunden"
                : "Ordner nicht mehr verwendbar"}
          </AlertTitle>
          <AlertDescription className="space-y-1">
            <p className="break-all font-mono text-sm">{c.path}</p>
            {c.status !== "not_found" && <p>{folderCheckMessage(c, false)}</p>}
          </AlertDescription>
        </Alert>
      ))}

      <FolderSettingsCard
        key={version}
        settings={status.settings}
        inboxCheck={status.inbox}
        archiveCheck={status.archive}
        onSaved={() => {
          load().then(() => setVersion((v) => v + 1))
        }}
      />

      <ApiSettingsCard apiKeyPresent={status.apiKeyPresent} />

      {ready && (
        <div className="flex justify-end">
          <Button asChild variant="secondary">
            <Link href="/">
              Zur Hauptansicht
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
