// Fast reachability check for network paths (PROJ-1, BUG-1).
//
// Windows waits ~40 s before a filesystem call on an unreachable UNC path
// (\\server\share) fails, and that call cannot be cancelled. We therefore probe
// the SMB ports with a short, cancellable TCP connect before touching the path.
import net from "net"

const SMB_PORTS = [445, 139]
export const SMB_PROBE_TIMEOUT_MS = 2000

/** "\\server\share\dir" → "server"; null for local paths. */
export function uncHost(p: string): string | null {
  const m = /^\\\\([^\\]+)\\/.exec(p)
  return m ? m[1] : null
}

function probePort(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port })
    const done = (ok: boolean) => {
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs, () => done(false))
    socket.once("connect", () => done(true))
    socket.once("error", () => done(false))
  })
}

/** True as soon as one SMB port accepts a connection. */
export async function isSmbHostReachable(host: string, timeoutMs = SMB_PROBE_TIMEOUT_MS): Promise<boolean> {
  const probes = SMB_PORTS.map((port) => probePort(host, port, timeoutMs))
  return new Promise((resolve) => {
    let pending = probes.length
    for (const probe of probes) {
      probe.then((ok) => {
        if (ok) resolve(true)
        else if (--pending === 0) resolve(false)
      })
    }
  })
}

export class TimeoutError extends Error {}

/** Rejects with TimeoutError if the promise does not settle in time. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(`timed out after ${ms} ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
