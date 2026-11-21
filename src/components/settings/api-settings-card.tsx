"use client"

import { useState } from "react"
import { CircleAlert, CircleCheck, Loader2, PlugZap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiKeyGuide } from "@/components/settings/api-key-guide"
import { testConnection } from "@/lib/settings-api"
import { CONNECTION_MESSAGES } from "@/lib/settings-messages"
import type { ConnectionTestResponse } from "@/lib/settings-types"

interface ApiSettingsCardProps {
  apiKeyPresent: boolean
}

export function ApiSettingsCard({ apiKeyPresent }: ApiSettingsCardProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ConnectionTestResponse | null>(null)

  async function handleTest() {
    setTesting(true)
    setResult(null)
    try {
      setResult(await testConnection())
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claude-API</CardTitle>
        <CardDescription>Wird für die KI-Analyse der Scans benötigt.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {apiKeyPresent ? (
            <Badge variant="outline" className="gap-1.5 border-green-600/40 py-1 text-green-700 dark:text-green-500">
              <CircleCheck className="h-4 w-4" aria-hidden />
              API-Schlüssel gefunden
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 border-destructive/50 py-1 text-destructive">
              <CircleAlert className="h-4 w-4" aria-hidden />
              Kein API-Schlüssel gefunden
            </Badge>
          )}
          <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <PlugZap className="mr-2 h-4 w-4" aria-hidden />
            )}
            {testing ? "Teste Verbindung …" : "Verbindung testen"}
          </Button>
        </div>

        {!apiKeyPresent && !result && (
          <p className="text-sm text-muted-foreground">{CONNECTION_MESSAGES.missing_key}</p>
        )}

        <div aria-live="polite">
          {result &&
            (result.ok ? (
              <Alert className="border-green-600/40">
                <CircleCheck className="h-4 w-4 !text-green-600 dark:!text-green-500" aria-hidden />
                <AlertDescription>Verbindung erfolgreich</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <CircleAlert className="h-4 w-4" aria-hidden />
                <AlertDescription>{CONNECTION_MESSAGES[result.code]}</AlertDescription>
              </Alert>
            ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Der Schlüssel wird in <code className="rounded bg-muted px-1">.env.local</code> hinterlegt und hier
          nie angezeigt. Nach einer Änderung das Tool neu starten.
        </p>

        <ApiKeyGuide defaultOpen={!apiKeyPresent} />
      </CardContent>
    </Card>
  )
}
