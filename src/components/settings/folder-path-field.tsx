"use client"

import { useState } from "react"
import { CircleAlert, CircleCheck, FolderPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFolderCheck } from "@/hooks/use-folder-check"
import { createFolder } from "@/lib/settings-api"
import { folderCheckMessage } from "@/lib/settings-messages"
import type { FolderCheck, FolderKind } from "@/lib/settings-types"
import { cn } from "@/lib/utils"

interface FolderPathFieldProps {
  id: string
  kind: FolderKind
  label: string
  placeholder: string
  description?: React.ReactNode
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  /** Check result of the saved path (avoids re-checking on load) */
  initialCheck: FolderCheck | null
  /** Validation error from the form (required, same/nested folder …) */
  error?: string
  disabled?: boolean
}

export function FolderPathField({
  id,
  kind,
  label,
  placeholder,
  description,
  value,
  onChange,
  onBlur,
  initialCheck,
  error,
  disabled,
}: FolderPathFieldProps) {
  const { check, checking, failed, setCheck } = useFolderCheck(value, kind, initialCheck)
  const [creating, setCreating] = useState(false)
  const [createFailed, setCreateFailed] = useState(false)

  async function handleCreate() {
    setCreating(true)
    setCreateFailed(false)
    try {
      setCheck(await createFolder({ path: value, kind }))
    } catch {
      setCreateFailed(true)
    } finally {
      setCreating(false)
    }
  }

  const statusId = `${id}-status`
  const errorId = `${id}-error`
  const ok = check?.status === "ok"

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        disabled={disabled}
        aria-invalid={Boolean(error) || (check !== null && !ok)}
        aria-describedby={cn(statusId, error && errorId)}
        className="font-mono text-sm"
      />

      <div id={statusId} aria-live="polite" className="min-h-6 text-sm">
        {checking ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Prüfe Ordner …
          </span>
        ) : failed ? (
          <span className="flex items-center gap-2 text-destructive">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
            Prüfung fehlgeschlagen – läuft das Tool noch?
          </span>
        ) : check ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className={cn(
                "flex items-center gap-2",
                ok ? "text-green-600 dark:text-green-500" : "text-destructive"
              )}
            >
              {ok ? (
                <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {folderCheckMessage(check, kind === "inbox")}
            </span>
            {check.status === "not_found" && (
              <Button type="button" size="sm" variant="outline" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <FolderPlus className="mr-2 h-4 w-4" aria-hidden />
                )}
                Ordner anlegen
              </Button>
            )}
            {createFailed && (
              <span className="text-destructive">Ordner konnte nicht angelegt werden.</span>
            )}
          </div>
        ) : null}
      </div>

      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  )
}
