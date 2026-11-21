"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Archive, FileText, Loader2, Receipt, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { validateFileName } from "@/lib/file-name-rules"
import type { FilingBusy } from "@/hooks/use-filing"
import type { FilingRequest, FilingTarget } from "@/lib/filing-types"
import { parseSwissDate, type FileNameResult } from "@/lib/suggestion-form"
import { cn } from "@/lib/utils"

interface FilingSectionProps {
  /** Scan in the inbox */
  scan: string
  /** Name built from the fields (PROJ-4 rule) */
  autoName: FileNameResult
  /** Name the user typed – undefined = follows the fields */
  customName: string | undefined
  /** Date field (TT.MM.JJJJ) – gives the year folder for "Rechnung" */
  date: string
  onNameChange: (name: string) => void
  onResetName: () => void
  /** Filing running or short lock right after it – buttons and shortcuts are disabled */
  busy: FilingBusy
  /** Copy is already at the target (via this button), original could not be deleted */
  alreadyCopied: FilingTarget | undefined
  onFile: (request: FilingRequest) => void
}

const SHORTCUT_INVOICE = "Strg + Enter"
const SHORTCUT_SCAN = "Strg + Umschalt + Enter"
const SHORTCUT_TRASH = "Strg + Entf"

/** File name field + "Rechnung" / "Scan" / "Löschen" (PROJ-5) */
export function FilingSection(props: FilingSectionProps) {
  const { scan, autoName, customName, date, busy, alreadyCopied } = props
  const custom = customName !== undefined
  const shown = custom ? customName : autoName.ok ? autoName.name : ""
  const check = validateFileName(shown)
  const parsedDate = parseSwissDate(date)
  const year = parsedDate?.year

  // Why "Rechnung" is not possible (null = possible)
  const invoiceBlocker = !shown.trim()
    ? !custom && !autoName.ok
      ? autoName.missing.join(" · ")
      : "Dateiname fehlt"
    : !check.ok
      ? check.message
      : !date.trim()
        ? "Datum fehlt – Jahresordner unbekannt"
        : !parsedDate
          ? "Datum ungültig – Jahresordner unbekannt"
          : null
  // Error (red): the shown name is invalid. Info (grey): parts that are still missing in the automatic name.
  const error = shown.trim() && !check.ok ? check.message : null
  const hint = error ?? (!custom && autoName.missing.length > 0 ? autoName.missing.join(" · ") : null)

  const fileInvoice = () => {
    if (invoiceBlocker || !check.ok || !year) return
    props.onFile({ scan, target: "rechnung", fileName: check.name, year })
  }
  // "Scan" is always possible – without a valid name the original name stays
  const fileAsScan = () => props.onFile({ scan, target: "scan", fileName: check.ok ? check.name : null })
  // "Löschen" is always possible – moves the scan with its original name to Scanner\Papierkorb\
  const moveToTrash = () => props.onFile({ scan, target: "papierkorb", fileName: null })

  // Keyboard shortcuts for the whole main view, also from input fields
  const actions = useRef({ fileInvoice, fileAsScan, moveToTrash, invoiceBlocker, busy })
  actions.current = { fileInvoice, fileAsScan, moveToTrash, invoiceBlocker, busy }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      if (e.key !== "Delete" && e.key !== "Enter") return
      // A held key repeats – it must not file / delete one scan after the other (QA BUG-4)
      if (e.repeat) {
        e.preventDefault()
        return
      }
      // Strg + Entf: also from input fields – deletes the scan, not the word in the field
      if (e.key === "Delete" && !e.shiftKey) {
        e.preventDefault()
        if (!actions.current.busy) actions.current.moveToTrash()
        return
      }
      if (e.key !== "Enter") return
      e.preventDefault()
      const a = actions.current
      if (a.busy) return
      if (e.shiftKey) a.fileAsScan()
      else if (a.invoiceBlocker) toast.info(`Ablegen als Rechnung nicht möglich: ${a.invoiceBlocker}`)
      else a.fileInvoice()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const target = year ? `Rechnungen\\${year}\\` : "Rechnungen\\JJJJ\\"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="filing-name" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Dateiname
        </Label>
        {custom && (
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={props.onResetName}>
            <RotateCcw className="mr-1 h-3 w-3" aria-hidden />
            Aus Feldern übernehmen
          </Button>
        )}
      </div>
      <Input
        id="filing-name"
        data-testid="file-name-input"
        value={shown}
        onChange={(e) => props.onNameChange(e.target.value)}
        className={cn("font-mono text-sm", error && "border-destructive")}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={hint ? "filing-name-hint" : undefined}
      />
      {hint && (
        <p id="filing-name-hint" data-testid="file-name-hint" className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {hint}
        </p>
      )}
      {alreadyCopied && (
        <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
          {alreadyCopied === "papierkorb"
            ? "Liegt bereits im Papierkorb – Original noch im Eingang. Erneut löschen bereinigt nur den Eingang."
            : "Bereits abgelegt – Original noch im Eingang. Erneut ablegen bereinigt nur den Eingang."}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex flex-1">
              <Button
                type="button"
                className="w-full"
                onClick={fileInvoice}
                disabled={Boolean(invoiceBlocker) || busy !== null}
                aria-keyshortcuts="Control+Enter"
              >
                {busy === "rechnung" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Receipt className="mr-2 h-4 w-4" aria-hidden />}
                Rechnung
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{invoiceBlocker ?? `Nach ${target} ablegen (${SHORTCUT_INVOICE})`}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={fileAsScan}
                disabled={busy !== null}
                aria-keyshortcuts="Control+Shift+Enter"
              >
                {busy === "scan" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Archive className="mr-2 h-4 w-4" aria-hidden />}
                Scan
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Nach Scanner\Abgelegt\ ablegen{check.ok ? "" : " (Originalname)"} ({SHORTCUT_SCAN})
          </TooltipContent>
        </Tooltip>
        {/* Set apart (gap + left border) so it is not hit by mistake */}
        <div className="ml-auto flex border-l pl-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={moveToTrash}
                  disabled={busy !== null}
                  aria-keyshortcuts="Control+Delete"
                >
                  {busy === "papierkorb" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden />}
                  Löschen
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>In Scanner\Papierkorb\ verschieben, Originalname ({SHORTCUT_TRASH})</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <p className="text-xs text-muted-foreground" data-testid="filing-target">
        Rechnung → {target} · Scan → Scanner\Abgelegt\ · Löschen → Scanner\Papierkorb\
      </p>
    </div>
  )
}
