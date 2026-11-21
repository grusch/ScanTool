// @vitest-environment node
import Anthropic from "@anthropic-ai/sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route"

// Intercept the real SDK call – no network, no costs
const create = vi.spyOn(Anthropic.Messages.prototype, "create")

function req(headers: Record<string, string> = {}) {
  return new Request("http://127.0.0.1:3000/api/settings/test-connection", {
    method: "POST",
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", ...headers },
  })
}

function apiError(status: number, type: string, message = "error") {
  return Anthropic.APIError.generate(status, { type: "error", error: { type, message } }, message, new Headers())
}

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "sk-ant-test"
  create.mockReset()
})

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY
})

describe("POST /api/settings/test-connection", () => {
  it("reports missing key without calling the API", async () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(await (await POST(req())).json()).toEqual({ ok: false, code: "missing_key" })
    expect(create).not.toHaveBeenCalled()
  })

  it("succeeds with a minimal request on the smallest model", async () => {
    create.mockResolvedValue({ content: [] })
    expect(await (await POST(req())).json()).toEqual({ ok: true })
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-haiku-5-5", max_tokens: 1 })
    )
  })

  it.each([
    [apiError(401, "authentication_error"), "invalid_key"],
    [apiError(403, "permission_error"), "invalid_key"],
    [apiError(402, "billing_error"), "no_credit"],
    [apiError(400, "invalid_request_error", "Your credit balance is too low"), "no_credit"],
    [new Anthropic.APIConnectionError({ message: "offline" }), "unreachable"],
    [new Anthropic.APIConnectionTimeoutError(), "unreachable"],
    [apiError(500, "api_error"), "unknown"],
  ])("maps %s to %s", async (err, code) => {
    create.mockRejectedValue(err)
    expect(await (await POST(req())).json()).toEqual({ ok: false, code })
  })

  it("never returns the key", async () => {
    create.mockRejectedValue(apiError(401, "authentication_error"))
    expect(await (await POST(req())).text()).not.toContain("sk-ant-test")
  })

  it("rejects requests from other websites", async () => {
    const res = await POST(req({ origin: "https://evil.example" }))
    expect(res.status).toBe(403)
    expect(create).not.toHaveBeenCalled()
  })
})
