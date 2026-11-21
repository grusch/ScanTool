import Link from "next/link"
import { ScanLine, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ScanLine className="h-5 w-5" aria-hidden />
          <span>ScanTool</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Hauptnavigation">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/einstellungen" aria-label="Einstellungen">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Einstellungen</TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </header>
  )
}
