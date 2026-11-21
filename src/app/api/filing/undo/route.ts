import { z } from "zod"
import { undoFiling } from "@/lib/server/filing"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const bodySchema = z.object({ token: z.string().uuid() })

const STATUS = { expired: 410, gone: 410, inbox_unreachable: 503, unknown: 500 } as const

/** POST /api/filing/undo { token } – moves a just filed scan back into the inbox (PROJ-5). */
export async function POST(req: Request) {
  if (!isLocalRequest(req)) return forbidden()
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, code: "expired" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return Response.json({ ok: false, code: "expired" }, { status: 400 })

  const result = await undoFiling(parsed.data.token)
  return Response.json(result, { status: result.ok ? 200 : STATUS[result.code], headers: { "Cache-Control": "no-store" } })
}
