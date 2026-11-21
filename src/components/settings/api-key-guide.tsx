"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export function ApiKeyGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="link" className="h-auto px-0">
          <ChevronDown className={cn("mr-1 h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
          So legst du einen API-Schlüssel an
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Anthropic Console
            </a>{" "}
            öffnen und anmelden (getrennt vom Claude-Abo).
          </li>
          <li>Unter „Billing" Guthaben aufladen, z. B. 5 USD.</li>
          <li>
            Unter „API Keys" → „Create Key" einen Schlüssel erstellen (bei der Frage nach dem Einsatzort
            „Woanders" wählen) und kopieren.
          </li>
          <li>
            Im Projektordner in <code className="rounded bg-muted px-1">.env.local</code> eintragen:{" "}
            <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY=sk-ant-…</code>
          </li>
          <li>Tool neu starten.</li>
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}
