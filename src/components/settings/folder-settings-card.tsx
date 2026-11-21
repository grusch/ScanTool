"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderPathField } from "@/components/settings/folder-path-field"
import { cleanPath, isAbsoluteWindowsPath, isNestedPath, isSamePath } from "@/lib/paths"
import { saveSettings } from "@/lib/settings-api"
import { MSG_NESTED, MSG_SAME_FOLDER } from "@/lib/settings-messages"
import type { FolderCheck, Settings } from "@/lib/settings-types"

const pathField = z
  .string()
  .trim()
  .min(1, "Pflichtfeld")
  .refine(isAbsoluteWindowsPath, "Bitte einen vollständigen Pfad angeben, z. B. C:\\Users\\…")

const schema = z
  .object({ inboxPath: pathField, archivePath: pathField })
  .superRefine((v, ctx) => {
    if (!v.inboxPath || !v.archivePath) return
    if (isSamePath(v.inboxPath, v.archivePath)) {
      ctx.addIssue({ code: "custom", path: ["archivePath"], message: MSG_SAME_FOLDER })
    } else if (isNestedPath(v.inboxPath, v.archivePath)) {
      ctx.addIssue({ code: "custom", path: ["archivePath"], message: MSG_NESTED })
    }
  })

type FormValues = z.infer<typeof schema>

interface FolderSettingsCardProps {
  settings: Settings | null
  inboxCheck: FolderCheck | null
  archiveCheck: FolderCheck | null
  onSaved: (settings: Settings) => void
}

export function FolderSettingsCard({ settings, inboxCheck, archiveCheck, onSaved }: FolderSettingsCardProps) {
  const [saving, setSaving] = useState(false)
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      inboxPath: settings?.inboxPath ?? "",
      archivePath: settings?.archivePath ?? "",
    },
  })

  const archivePath = form.watch("archivePath")
  const archivePreview = isAbsoluteWindowsPath(archivePath)
    ? `${cleanPath(archivePath).replace(/\\$/, "")}\\Rechnungen\\${new Date().getFullYear()}\\`
    : null

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setRootError(null)
    try {
      const result = await saveSettings({
        inboxPath: cleanPath(values.inboxPath),
        archivePath: cleanPath(values.archivePath),
      })
      if (result.ok) {
        form.reset({ inboxPath: result.settings.inboxPath, archivePath: result.settings.archivePath })
        toast.success("Einstellungen gespeichert")
        onSaved(result.settings)
      } else if (result.error.field) {
        form.setError(result.error.field, { message: result.error.message })
      } else {
        setRootError(result.error.message)
      }
    } catch {
      setRootError("Speichern fehlgeschlagen – läuft das Tool noch?")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader>
          <CardTitle>Ordner</CardTitle>
          <CardDescription>
            Pfad aus der Adresszeile des Windows-Explorers kopieren und hier einfügen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Controller
            control={form.control}
            name="inboxPath"
            render={({ field, fieldState }) => (
              <FolderPathField
                id="inboxPath"
                kind="inbox"
                label="Eingangsordner"
                placeholder="C:\Users\…\OneDrive\Scans\Eingang"
                description="Hier legt der Scanner die neuen PDFs ab."
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                initialCheck={inboxCheck}
                error={fieldState.error?.message}
                disabled={saving}
              />
            )}
          />
          <Controller
            control={form.control}
            name="archivePath"
            render={({ field, fieldState }) => (
              <FolderPathField
                id="archivePath"
                kind="archive"
                label="Ablage-Stammordner"
                placeholder="C:\Users\…\OneDrive\Dokumente"
                description={
                  archivePreview ? (
                    <>
                      Abgelegt wird in: <span className="break-all font-mono">{archivePreview}</span>
                    </>
                  ) : (
                    "Darunter werden die Ordner Rechnungen\\JJJJ\\ automatisch angelegt."
                  )
                }
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                initialCheck={archiveCheck}
                error={fieldState.error?.message}
                disabled={saving}
              />
            )}
          />
          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden />
            )}
            Speichern
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
