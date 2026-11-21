import { z } from "zod"
import type { AnalysisErrorCode } from "@/lib/analysis-types"
import { analyzeScan } from "@/lib/server/analysis"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// An analysis may take up to 60 s
export const maxDuration = 70

const bodySchema = z.object({
  name: z.string().max(300),
  force: z.boolean().optional(),
})

const STATUS: Record<AnalysisErrorCode, number> = {
  invalid_name: 400,
  missing_key: 412,
  not_found: 404,
  too_large: 413,
  unreadable: 422,
  invalid_key: 502,
  no_credit: 502,
  unreachable: 502,
  bad_response: 502,
  inbox_unreachable: 503,
  timeout: 504,
  unknown: 500,
}

/**
 * POST /api/analysis { name, force? } – AI suggestions for one scan of the inbox.
 * Returns a remembered result immediately (no cost), otherwise analyses once.
 */
export async function POST(req: Request) {
  if (!isLocalRequest(req)) return forbidden()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, code: "invalid_name" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ ok: false, code: "invalid_name" }, { status: 400 })

  const result = await analyzeScan(parsed.data.name, parsed.data.force ?? false)
  const status = result.ok ? 200 : STATUS[result.code]
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } })
}
