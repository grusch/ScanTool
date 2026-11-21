"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { AlertCircle, Info, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FilingSection } from "@/components/suggestions/filing-section"
import { useMounted } from "@/hooks/use-mounted"
import { useScanAnalysis } from "@/hooks/use-scan-analysis"
import { ANALYSIS_MESSAGES } from "@/lib/analysis-api"
import type { FilingBusy } from "@/hooks/use-filing"
import type { FilingRequest } from "@/lib/filing-types"
import type { InboxFile } from "@/lib/inbox-types"
import {
  buildFileName,
  fieldsFromSuggestion,
  mergeFields,
  withFileDateFallback,
  type FieldName,
  type ScanDraft,
} from "@/lib/suggestion-form"

interface SuggestionsPanelProps {
  /** Selected scan or null */
  file: InboxFile | null
  apiKeyPresent: boolean
  /** Values the user typed for this scan (kept per scan while ScanTool is open) */
  touched: ScanDraft
  onChange: (field: FieldName, value: string) => void
  /** Own file name (PROJ-5); onResetName = follow the fields again */
  onNameChange: (name: string) => void
  onResetName: () => void
  /** Filing (PROJ-5) */
  filingBusy: FilingBusy
  alreadyCopied: boolean
  onFile: (request: FilingRequest) => void
  /** Scan vanished → refresh the list (selection moves on, PROJ-2 rules) */
  onScanMissing: () => void
  /** Time of the last successful list refresh – a still-listed scan is analysed again */
  listCheckedAt?: string
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
export function SuggestionsPanel(props: SuggestionsPanelProps) {
  const { file, apiKeyPresent, onChange, onScanMissing, listCheckedAt } = props
  const { fileName: customName, ...touched } = props.touched
  const { state, reanalyze, retry } = useScanAnalysis(file, apiKeyPresent)
  // Fields stay disabled until the page is interactive – typing earlier would be lost (PROJ-4 BUG-2)
  const mounted = useMounted()

  const result = state.status === "done" ? state.result : state.status === "idle" ? null : state.previous
  const loading = state.status === "loading"
  // No invoice date from the AI (or no AI at all) → date from the file properties.
  // Not while the analysis runs, so the field does not jump from file date to invoice date.
  const { fields: aiFields, dateFromFile } = useMemo(() => {
    const fromAi = fieldsFromSuggestion(result?.suggestion)
    return loading ? { fields: fromAi, dateFromFile: false } : withFileDateFallback(fromAi, file?.fileDate)
  }, [result, loading, file?.fileDate])
  const values = mergeFields(aiFields, touched)
  const showFileDateHint = dateFromFile && touched.date === undefined
  const fileName = buildFileName(values)
  const error = state.status === "error" ? state.error : null

  // Scan gone → refresh the list once; if it is still listed afterwards, ask again
  const reportedMissing = useRef<string | null>(null)
  useEffect(() => {
    if (state.status === "done") reportedMissing.current = null
    if (error === "not_found" && file && reportedMissing.current !== file.name) {
      reportedMissing.current = file.name
      onScanMissing()
    }
  }, [error, state.status, file, onScanMissing])
  const lastError = useRef(error)
  lastError.current = error
  useEffect(() => {
    if (lastError.current === "not_found") retry()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listCheckedAt])

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

        <fieldset disabled={!mounted} className="contents">
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
            <Input
              id={id("date")}
              value={values.date}
              onChange={set("date")}
              placeholder="TT.MM.JJJJ"
              inputMode="numeric"
              autoComplete="off"
              aria-describedby={showFileDateHint ? id("date") + "-hint" : undefined}
            />
            {showFileDateHint && (
              <p id={id("date") + "-hint"} className="text-xs text-muted-foreground">
                Datum aus Datei-Eigenschaften
              </p>
            )}
          </Field>
          <Field id={id("invoiceNumber")} label="Rechnungsnummer" className="col-span-2 space-y-1.5 sm:col-span-1 lg:col-span-2 xl:col-span-1">
            <Input id={id("invoiceNumber")} value={values.invoiceNumber} onChange={set("invoiceNumber")} autoComplete="off" />
          </Field>
          <Field id={id("supplier")} label="Lieferant" className="col-span-2 space-y-1.5">
            <Input id={id("supplier")} value={values.supplier} onChange={set("supplier")} autoComplete="off" />
          </Field>
          <Field id={id("description")} label="Beschreibung" className="col-span-2 space-y-1.5">
            <Input
              id={id("description")}
              value={values.description}
              onChange={set("description")}
              autoComplete="off"
            />
          </Field>
          <Field id={id("amount")} label="Betrag" className="space-y-1.5">
            <Input id={id("amount")} value={values.amount} onChange={set("amount")} inputMode="decimal" autoComplete="off" />
          </Field>
          <Field id={id("currency")} label="Währung" className="space-y-1.5">
            <Input id={id("currency")} value={values.currency} onChange={set("currency")} maxLength={3} autoComplete="off" />
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
        </fieldset>
      </div>

      {/* Fixed footer: file name and the two buttons stay visible while the fields scroll */}
      <fieldset disabled={!mounted} className="min-w-0 border-t p-3">
        <FilingSection
          scan={file.name}
          autoName={fileName}
          customName={customName}
          date={values.date}
          onNameChange={props.onNameChange}
          onResetName={props.onResetName}
          busy={props.filingBusy}
          alreadyCopied={props.alreadyCopied}
          onFile={props.onFile}
        />
      </fieldset>
    </Card>
  )
}
