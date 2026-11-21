import { testConnection } from "@/lib/server/anthropic"
import { forbidden, isLocalRequest } from "@/lib/server/local-guard"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** POST /api/settings/test-connection – minimal Claude request; never returns the key */
export async function POST(req: Request) {
  if (!isLocalRequest(req)) return forbidden()
  return Response.json(await testConnection())
}
