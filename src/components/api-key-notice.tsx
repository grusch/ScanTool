import Link from "next/link"
import { KeyRound } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

/** Shown on the main view when no Claude API key is configured (PROJ-1). */
export function ApiKeyNotice() {
  return (
    <Alert>
      <KeyRound className="h-4 w-4" aria-hidden />
      <AlertDescription>
        API-Schlüssel fehlt – die KI-Analyse ist deaktiviert. Siehe{" "}
        <Link href="/einstellungen" className="font-medium underline underline-offset-4">
          Einstellungen
        </Link>
        .
      </AlertDescription>
    </Alert>
  )
}
