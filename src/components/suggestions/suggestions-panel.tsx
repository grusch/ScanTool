"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { AlertCircle, FileText, Info, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useScanAnalysis } from "@/hooks/use-scan-analysis"
import { ANALYSIS_MESSAGES } from "@/lib/analysis-api"
import type { InboxFile } from "@/lib/inbox-types"
import {
  buildFileName,
  fieldsFromSuggestion,
  mergeFields,
  type FieldName,
  type SuggestionFields,
} from "@/lib/suggestion-form"

interface SuggestionsPanelProps {
  /** Selected scan or null */
  file: InboxFile | null
  apiKeyPresent: boolean
  /** Values the user typed for this scan (kept per scan while ScanTool is open) */
  touched: Partial<SuggestionFields>
  onChange: (field: FieldName, value: string) => void
  /** Scan vanished → refresh the list (selection moves on, PROJ-2 rules) */
  onScanMissing: () => void
}

const NO_DOC_TYPE = "none"

function Field({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

/** Right column of the work area: AI suggestions as editable fields (PROJ-4) */
export function SuggestionsPanel({ file, apiKeyPresent, touched, onChange, onScanMissing }: SuggestionsPanelProps) {
  const { state, reanalyze, retry } = useScanAnalysis(file, apiKeyPresent)

  const result = state.status === "done" ? state.result : state.status === "idle" ? null : state.previous
  const aiFields = useMemo(() => fieldsFromSuggestion(result?.suggestion), [result])
  const values = mergeFields(aiFields, touched)
  const fileName = buildFileName(values)
  const loading = state.status === "loading"
  const error = state.status === "error" ? state.error : null

  useEffect(() => {
    if (error === "not_found") onScanMissing()
  }, [error, file?.name, onScanMissing])

  if (!file) {
    return (
      <Card className="flex min-h-48 flex-col items-center justify-center gap-2 border-dashed p-6 text-center lg:h-full">
        <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">Kein Scan ausgewählt</p>
      </Card>
    )
  }

  const set = (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange(field, e.target.value)
  const id = (field: FieldName) => `suggestion-${field}`
  const message = error ? ANALYSIS_MESSAGES[error] : null

  return (
    <Card className="flex min-h-0 flex-col lg:h-full" aria-label={`Vorschläge: ${file.name}`}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="font-semibold">Vorschläge</h2>
          {loading ? (
            <Badge variant="secondary" className="gap-1 whitespace-nowrap" role="status">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              KI analysiert …
            </Badge>
          ) : result ? (
            <Badge variant="outline" className="gap-1 whitespace-nowrap">
              <Sparkles className="h-3 w-3" aria-hidden />
              Von KI vorgeschlagen
            </Badge>
          ) : null}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={reanalyze}
                disabled={loading || !apiKeyPresent}
                aria-label="Neu analysieren"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Neu analysieren</TooltipContent>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {message && (
          <Alert variant={error === "missing_key" ? "default" : "destructive"} role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertDescription className="space-y-2 text-sm">
              <p>{message.text}</p>
              {error === "missing_key" || error === "invalid_key" ? (
                <Link href="/einstellungen" className="font-medium underline underline-offset-4">
                  Zu den Einstellungen
                </Link>
              ) : null}
              {message.retry && error !== "invalid_key" && (
                <Button type="button" variant="outline" size="sm" onClick={retry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Erneut versuchen
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        {result && !result.suggestion.isInvoiceDocument && (
          <Alert role="status">
            <Info className="h-4 w-4" aria-hidden />
            <AlertDescription className="text-sm">Kein Rechnungsdokument erkannt.</AlertDescription>
          </Alert>
        )}
        {result && result.totalPages > result.pagesAnalyzed && (
          <p className="text-xs text-muted-foreground">
            Nur die ersten {result.pagesAnalyzed} Seiten analysiert ({result.totalPages} Seiten insgesamt).
          </p>
        )}

        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => e.preventDefault()} aria-busy={loading}>
          <Field id={id("docType")} label="Dokumenttyp" className="col-span-2 space-y-1.5">
            <Select
              value={values.docType || NO_DOC_TYPE}
              onValueChange={(v) => onChange("docType", v === NO_DOC_TYPE ? "" : v)}
            >
              <SelectTrigger id={id("docType")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DOC_TYPE}>– nicht festgelegt –</SelectItem>
                <SelectItem value="rechnung">Rechnung</SelectItem>
                <SelectItem value="garantieschein">Garantieschein</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id={id("date")} label="Datum" className="col-span-2 space-y-1.5 sm:col-span-1 lg:col-span-2 xl:col-span-1">
            <Input id={id("date")} value={values.date} onChange={set("date")} placeholder="TT.MM.JJJJ" inputMode="numeric" autoComplete="off" />
          </Field>
          <Field id={id("invoiceNumber")} label="Rechnungsnummer" className="col-span-2 space-y-1.5 sm:col-span-1 lg:col-span-2 xl:col-span-1">
            <Input id={id("invoiceNumber")} value={values.invoiceNumber} onChange={set("invoiceNumber")} autoComplete="off" />
          </Field>
          <Field id={id("supplier")} label="Lieferant" className="col-span-2 space-y-1.5">
            <Input id={id("supplier")} value={values.supplier} onChange={set("supplier")} placeholder="z. B. Digitec" autoComplete="off" />
          </Field>
          <Field id={id("description")} label="Beschreibung" className="col-span-2 space-y-1.5">
            <Input
              id={id("description")}
              value={values.description}
              onChange={set("description")}
              placeholder="z. B. Monitor Dell U2724D"
              autoComplete="off"
            />
          </Field>
          <Field id={id("amount")} label="Betrag" className="space-y-1.5">
            <Input id={id("amount")} value={values.amount} onChange={set("amount")} placeholder="0.00" inputMode="decimal" autoComplete="off" />
          </Field>
          <Field id={id("currency")} label="Währung" className="space-y-1.5">
            <Input id={id("currency")} value={values.currency} onChange={set("currency")} placeholder="CHF" maxLength={3} autoComplete="off" />
          </Field>
          <Field id={id("warrantyMonths")} label="Garantie (Monate)" className="col-span-2 space-y-1.5">
            <Input
              id={id("warrantyMonths")}
              value={values.warrantyMonths}
              onChange={set("warrantyMonths")}
              inputMode="numeric"
              autoComplete="off"
            />
          </Field>
          <Field id={id("articles")} label="Artikel (eine Position pro Zeile)" className="col-span-2 space-y-1.5">
            <Textarea id={id("articles")} value={values.articles} onChange={set("articles")} rows={3} />
          </Field>
        </form>

        <div className="space-y-1 rounded-md border bg-muted/40 p-3" aria-live="polite">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Dateiname
          </p>
          {fileName.ok ? (
            <p className="break-all font-mono text-sm" data-testid="file-name-preview">
              {fileName.name}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="file-name-preview">
              {fileName.missing.join(" · ")}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Ablegen mit „Scan" / „Rechnung" folgt mit PROJ-5.</p>
      </div>
    </Card>
  )
}
