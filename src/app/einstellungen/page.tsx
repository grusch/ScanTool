import type { Metadata } from "next"
import { SettingsView } from "@/components/settings/settings-view"

export const metadata: Metadata = {
  title: "Einstellungen – ScanTool",
}

export default function EinstellungenPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Einstellungen</h1>
      <SettingsView />
    </div>
  )
}
