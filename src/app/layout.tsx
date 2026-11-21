import type { Metadata } from "next"
import "./globals.css"
import { AppHeader } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"
import { AppToaster } from "@/components/app-toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: "ScanTool",
  description: "Eingescannte Rechnungen und Garantiescheine prüfen, benennen und ablegen",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            <AppHeader />
            <main>{children}</main>
            <AppToaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
