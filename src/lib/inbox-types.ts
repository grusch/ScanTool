// Shared contract between the inbox UI and GET /api/inbox (PROJ-2).
import type { FolderStatus } from "./settings-types"

export interface InboxFile {
  /** File name – unique within the inbox folder, used as id */
  name: string
  /** Size in bytes */
  size: number
  /** Last modification time (ISO) = scan date */
  modifiedAt: string
}

export interface InboxResponse {
  /** Configured inbox folder */
  folder: string
  /** "ok" or why the folder could not be listed */
  status: FolderStatus
  /** When the server listed the folder (ISO) */
  checkedAt: string
  /** Finished PDFs, oldest first (empty unless status is "ok") */
  files: InboxFile[]
}
