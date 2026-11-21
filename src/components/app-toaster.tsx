"use client"

import { Toaster } from "@/components/ui/sonner"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * Toast messages away from the filing buttons (PROJ-5 QA BUG-2): the buttons sit at the
 * bottom right on desktop and at the bottom of the page on phones (where toasts span the
 * full width) – so bottom-left on desktop, top on small screens.
 */
export function AppToaster() {
  const isMobile = useIsMobile()
  return <Toaster position={isMobile ? "top-center" : "bottom-left"} richColors />
}
