import { redirect } from "next/navigation"
import { ApiKeyNotice } from "@/components/api-key-notice"
import { InboxWorkspace } from "@/components/inbox/inbox-workspace"
import { listInbox } from "@/lib/server/inbox"
import { getSettingsStatus, isConfigured } from "@/lib/server/settings-service"

// Always evaluate on request: folders may have been renamed or deleted meanwhile.
export const dynamic = "force-dynamic"

export default async function Home() {
  const status = await getSettingsStatus()
  // Main view stays locked until both folders are configured and valid (PROJ-1)
  if (!isConfigured(status)) redirect("/einstellungen")

  return (
    <div className="flex w-full flex-col gap-4 px-4 py-4 sm:px-6 lg:h-[calc(100dvh-3.5rem)]">
      {!status.apiKeyPresent && <ApiKeyNotice />}
      {/* First list is rendered with the page → visible immediately, no loading flicker */}
      <InboxWorkspace initialInbox={await listInbox()} />
    </div>
  )
}
