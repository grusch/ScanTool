import type { FilingErrorCode } from "@/lib/filing-types"
import { fileScan, filingRequestSchema } from "@/lib/server/filing"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATUS: Record<FilingErrorCode, number> = {
  invalid_request: 400,
  not_found: 404,
  no_permission: 409,
  inbox_unreachable: 503,
  archive_unreachable: 503,
  unknown: 500,
}

/**
 * POST /api/filing { scan, target: "rechnung" | "scan", fileName, year? } – files one scan.
 * Target folders come from the saved settings only; the request contains names, never paths.
 */
export async function POST(req: Request) {
  if (!isLocalRequest(req)) return forbidden()
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, code: "invalid_request" }, { status: 400 })
  }
  const parsed = filingRequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ ok: false, code: "invalid_request" }, { status: 400 })

  const result = await fileScan(parsed.data)
  return Response.json(result, { status: result.ok ? 200 : STATUS[result.code], headers: { "Cache-Control": "no-store" } })
}
