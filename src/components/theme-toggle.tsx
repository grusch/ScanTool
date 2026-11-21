"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const noop = () => () => {}

/** false on the server and during hydration, true afterwards – no setState in an effect needed */
function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // The server does not know the browser's theme. Until hydration is done the label stays
  // neutral, otherwise server HTML and browser differ (React hydration warning).
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === "dark"
  const label = !mounted ? "Hell/Dunkel umschalten" : isDark ? "Hellen Modus aktivieren" : "Dunklen Modus aktivieren"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} onClick={() => setTheme(isDark ? "light" : "dark")}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
