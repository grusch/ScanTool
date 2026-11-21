// @vitest-environment node
import net from "net"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { isSmbHostReachable, TimeoutError, uncHost, withTimeout } from "./network"

describe("uncHost", () => {
  it("extracts the server of a UNC path", () => {
    expect(uncHost("\\\\fritz.box\\FRITZ.NAS\\Scanner")).toBe("fritz.box")
    expect(uncHost("\\\\192.168.1.5\\share")).toBe("192.168.1.5")
  })
  it("returns null for local paths", () => {
    expect(uncHost("C:\\Scans")).toBeNull()
  })
})

describe("withTimeout", () => {
  it("passes through fast results", async () => {
    await expect(withTimeout(Promise.resolve(42), 100)).resolves.toBe(42)
  })
  it("rejects slow promises with TimeoutError", async () => {
    await expect(withTimeout(new Promise(() => {}), 20)).rejects.toBeInstanceOf(TimeoutError)
  })
})

describe("isSmbHostReachable", () => {
  it("is false within the timeout for a non-routable address", async () => {
    // 192.0.2.0/24 is TEST-NET-1 (RFC 5737) – never routed
    const start = Date.now()
    expect(await isSmbHostReachable("192.0.2.1", 500)).toBe(false)
    expect(Date.now() - start).toBeLessThan(2000)
  })

  it("is false quickly for an unknown host name", async () => {
    expect(await isSmbHostReachable("host-does-not-exist.invalid", 500)).toBe(false)
  })

  describe("with a listening port", () => {
    let server: net.Server
    beforeAll(async () => {
      server = net.createServer((s) => s.destroy())
      // Port 445 is usually taken by Windows; the probe only needs one open port,
      // so this case is verified indirectly via a local listener on 139 if free.
      await new Promise<void>((resolve) => server.once("error", () => resolve()).listen(139, "127.0.0.1", resolve))
    })
    afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

    it("is true for localhost (Windows SMB on 445 or test listener on 139)", async () => {
      expect(await isSmbHostReachable("127.0.0.1", 1000)).toBe(true)
    })
  })
})
