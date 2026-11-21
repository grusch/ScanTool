import { redirect } from "next/navigation"
import { Inbox } from "lucide-react"
import { ApiKeyNotice } from "@/components/api-key-notice"
import { getSettingsStatus, isConfigured } from "@/lib/server/settings-service"

// Always evaluate on request: folders may have been renamed or deleted meanwhile.
export const dynamic = "force-dynamic"

export default async function Home() {
  const status = await getSettingsStatus()
  // Main view stays locked until both folders are configured and valid (PROJ-1)
  if (!isConfigured(status)) redirect("/einstellungen")

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      {!status.apiKeyPresent && <ApiKeyNotice />}
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">Eingang</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Hier erscheinen bald die neuen Scans aus deinem Eingangsordner.
        </p>
      </div>
    </div>
  )
}
