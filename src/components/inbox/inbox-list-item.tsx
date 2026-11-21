"use client"

import { forwardRef } from "react"
import { Clock, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatScanDate, formatSize, overdueDays } from "@/lib/inbox-format"
import type { InboxFile } from "@/lib/inbox-types"
import { cn } from "@/lib/utils"

interface InboxListItemProps {
  id: string
  file: InboxFile
  selected: boolean
  isNew: boolean
  onSelect: () => void
}

export const InboxListItem = forwardRef<HTMLDivElement, InboxListItemProps>(function InboxListItem(
  { id, file, selected, isNew, onSelect },
  ref
) {
  const days = overdueDays(file.modifiedAt)

  return (
    <div
      ref={ref}
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm transition-colors",
        selected ? "border-primary/30 bg-accent text-accent-foreground" : "hover:bg-muted/60"
      )}
    >
      <FileText
        className={cn("mt-0.5 h-4 w-4 shrink-0", selected ? "text-foreground" : "text-muted-foreground")}
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className={cn("truncate", selected && "font-medium")}>{file.name}</p>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm break-all">
            {file.name}
          </TooltipContent>
        </Tooltip>
        <p className="text-xs text-muted-foreground">
          {formatScanDate(file.modifiedAt)} · {formatSize(file.size)}
        </p>
        {(isNew || days !== null) && (
          <div className="flex flex-wrap gap-1.5">
            {isNew && <Badge className="px-1.5 py-0 text-[11px]">neu</Badge>}
            {days !== null && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/50 px-1.5 py-0 text-[11px] text-amber-700 dark:text-amber-400"
              >
                <Clock className="h-3 w-3" aria-hidden />
                seit {days} Tagen
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
