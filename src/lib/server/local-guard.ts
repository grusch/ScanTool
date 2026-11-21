// Protects the local API from other websites open in the same browser (PROJ-1).
//
// The server only listens on 127.0.0.1, but any web page the user visits could
// still send requests to http://127.0.0.1:3000 (CSRF) or reach it via a DNS
// rebinding trick. We therefore accept only:
//  - a Host header pointing to localhost, and
//  - no Origin header (non-browser clients) or an Origin on localhost.

const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]", "::1"])

function hostnameOf(hostHeader: string): string {
  // "[::1]:3000" -> "[::1]", "localhost:3000" -> "localhost"
  if (hostHeader.startsWith("[")) return hostHeader.slice(0, hostHeader.indexOf("]") + 1)
  return hostHeader.split(":")[0]
}

export function isLocalRequest(req: Request): boolean {
  const host = req.headers.get("host")
  if (!host || !LOCAL_HOSTNAMES.has(hostnameOf(host).toLowerCase())) return false

  const origin = req.headers.get("origin")
  if (origin && origin !== "null") {
    try {
      const url = new URL(origin)
      if (!LOCAL_HOSTNAMES.has(url.hostname.toLowerCase())) return false
    } catch {
      return false
    }
  } else if (origin === "null") {
    return false
  }

  if (req.headers.get("sec-fetch-site") === "cross-site") return false
  return true
}

export function forbidden(): Response {
  return Response.json({ code: "forbidden", message: "Nur lokale Anfragen erlaubt" }, { status: 403 })
}
