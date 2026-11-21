// Local production operation of ScanTool (no hosting – PRD: runs only on this PC).
//
//   npm run live         start ScanTool (builds first if needed) and open the browser
//   npm run live:build   rebuild after code changes (stop a running instance first)
//
// Uses its own build folder (.next-live) and port (3030), so the dev server (3000)
// and E2E test builds (.next) never interfere with the app in daily use.
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const HOST = "127.0.0.1"
const PORT = 3030
const URL = `http://${HOST}:${PORT}/`
const DIST = ".next-live"
const env = { ...process.env, SCANTOOL_DIST_DIR: DIST, NODE_ENV: "production" }

function run(args) {
  return new Promise((resolve, reject) => {
    // args are fixed constants of this script – passed as one command string (no user input)
    const p = spawn(`npx next ${args.join(" ")}`, { cwd: ROOT, env, stdio: "inherit", shell: true })
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} exited with ${code}`))))
  })
}

function portInUse() {
  return new Promise((resolve) => {
    const s = net.connect(PORT, HOST)
    s.once("connect", () => (s.destroy(), resolve(true)))
    s.once("error", () => resolve(false))
  })
}

function openBrowser() {
  if (process.env.SCANTOOL_NO_BROWSER) return // for automated checks
  spawn("cmd", ["/c", "start", "", URL], { detached: true, stdio: "ignore" }).unref()
}

async function waitUntilUp(timeoutMs = 60_000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (await portInUse()) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

const mode = process.argv[2] ?? "start"

if (mode === "build") {
  if (await portInUse()) {
    console.error(`ScanTool läuft noch auf ${URL} – bitte zuerst das ScanTool-Fenster schliessen.`)
    process.exit(1)
  }
  await run(["build"])
  console.log(`\nFertig. Starten mit: npm run live (oder Desktop-Verknüpfung „ScanTool")`)
} else {
  if (await portInUse()) {
    console.log(`ScanTool läuft bereits – öffne ${URL}`)
    openBrowser()
    process.exit(0)
  }
  if (!existsSync(path.join(ROOT, DIST, "BUILD_ID"))) {
    console.log("Erster Start: ScanTool wird gebaut (dauert ca. 1 Minute) …")
    await run(["build"])
  }
  console.log(`ScanTool startet auf ${URL} – dieses Fenster offen lassen, Schliessen beendet ScanTool.`)
  const server = run(["start", "-H", HOST, "-p", String(PORT)])
  if (await waitUntilUp()) openBrowser()
  await server
}
