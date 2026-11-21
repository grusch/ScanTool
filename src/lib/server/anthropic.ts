// Claude API access (PROJ-1: connection test; reused by PROJ-4).
import Anthropic from "@anthropic-ai/sdk"
import type { ConnectionTestResponse } from "@/lib/settings-types"

/** Smallest/cheapest model – the test only checks key, credit and network. */
const CONNECTION_TEST_MODEL = "claude-haiku-5-5"
const CONNECTION_TEST_TIMEOUT_MS = 15_000

export function apiKeyPresent(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

/** Maps SDK errors to the user-facing categories from the spec. */
export function classifyConnectionError(err: unknown): ConnectionTestResponse {
  if (err instanceof Anthropic.APIConnectionError) {
    // includes APIConnectionTimeoutError
    return { ok: false, code: "unreachable" }
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return { ok: false, code: "invalid_key" }
  }
  if (err instanceof Anthropic.PaymentRequiredError) {
    return { ok: false, code: "no_credit" }
  }
  if (err instanceof Anthropic.APIError) {
    if (err.type === "billing_error" || err.type === "authentication_error") {
      return { ok: false, code: err.type === "billing_error" ? "no_credit" : "invalid_key" }
    }
    // Older accounts may still get a 400 for an empty credit balance
    if (err instanceof Anthropic.BadRequestError && /credit balance/i.test(err.message)) {
      return { ok: false, code: "no_credit" }
    }
  }
  return { ok: false, code: "unknown" }
}

/** Makes a minimal request (1 output token, thinking off) to verify the setup. */
export async function testConnection(): Promise<ConnectionTestResponse> {
  if (!apiKeyPresent()) return { ok: false, code: "missing_key" }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!.trim(),
    timeout: CONNECTION_TEST_TIMEOUT_MS,
    maxRetries: 0,
  })
  try {
    await client.messages.create({
      model: CONNECTION_TEST_MODEL,
      max_tokens: 1,
      thinking: { type: "disabled" },
      messages: [{ role: "user", content: "ping" }],
    })
    return { ok: true }
  } catch (err) {
    const result = classifyConnectionError(err)
    if (!result.ok && result.code === "unknown") {
      // Log type/status only – never the key
      const e = err as { status?: number; type?: string; name?: string }
      console.warn("[test-connection] unexpected error", e?.name, e?.status, e?.type)
    }
    return result
  }
}
