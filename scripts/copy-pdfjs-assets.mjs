// Copies the helper files PDF.js needs at runtime from node_modules/pdfjs-dist to
// public/pdfjs (served locally, no CDN – PROJ-3). Without them black-and-white scans
// (CCITT/JBIG2) and JPEG 2000 images stay blank. Runs on install, dev and build, so the
// files always match the installed pdfjs-dist version. public/pdfjs is not in Git.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SRC = path.join(ROOT, "node_modules", "pdfjs-dist")
const DEST = path.join(ROOT, "public", "pdfjs")

if (!existsSync(SRC)) {
  console.warn("[pdfjs-assets] pdfjs-dist not installed – skipped")
  process.exit(0)
}

rmSync(DEST, { recursive: true, force: true })
mkdirSync(DEST, { recursive: true })
for (const dir of ["wasm", "standard_fonts", "iccs", "cmaps"]) {
  cpSync(path.join(SRC, dir), path.join(DEST, dir), { recursive: true })
}
console.log("[pdfjs-assets] copied to public/pdfjs")
