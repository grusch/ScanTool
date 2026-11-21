// Minimal PDF writer for E2E tests (PROJ-3): real, valid PDFs without extra dependencies.
// Each page shows a black bar at its top edge and its page number, so tests can detect
// orientation and content by reading canvas pixels.

export interface TestPage {
  /** Page size in PDF points (A4 = 595 × 842) */
  width: number
  height: number
  /** Optional label (default "Seite N") */
  label?: string
}

export const A4: TestPage = { width: 595, height: 842 }
export const A4_LANDSCAPE: TestPage = { width: 842, height: 595 }
/** Narrow receipt */
export const BON: TestPage = { width: 226, height: 600 }

export interface MakePdfOptions {
  /**
   * Adds an /Encrypt dictionary whose check values do not match the empty
   * password → PDF readers ask for a password (password-protected PDF).
   */
  passwordProtected?: boolean
}

function escapeText(s: string): string {
  return s.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "?")
}

export function makePdf(pages: TestPage[], options: MakePdfOptions = {}): Buffer {
  const objects: string[] = []
  const add = (body: string) => {
    objects.push(body)
    return objects.length // object number
  }

  const catalogNo = add("") // placeholder, filled later
  const pagesNo = add("")
  const fontNo = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

  const pageNos: number[] = []
  pages.forEach((p, i) => {
    const label = escapeText(p.label ?? `Seite ${i + 1}`)
    const bar = Math.max(20, Math.round(p.height * 0.06))
    const fontSize = Math.max(12, Math.round(p.width / 12))
    const content =
      `0 0 0 rg 0 ${p.height - bar} ${p.width} ${bar} re f\n` +
      `BT /F1 ${fontSize} Tf 20 ${Math.round(p.height / 2)} Td (${label}) Tj ET\n`
    const contentNo = add(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}endstream`)
    pageNos.push(
      add(
        `<< /Type /Page /Parent ${pagesNo} 0 R /MediaBox [0 0 ${p.width} ${p.height}] ` +
          `/Resources << /Font << /F1 ${fontNo} 0 R >> >> /Contents ${contentNo} 0 R >>`
      )
    )
  })
  objects[catalogNo - 1] = `<< /Type /Catalog /Pages ${pagesNo} 0 R >>`
  objects[pagesNo - 1] = `<< /Type /Pages /Kids [${pageNos.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageNos.length} >>`

  let encryptNo = 0
  if (options.passwordProtected) {
    const hex32 = "A5".repeat(32)
    encryptNo = add(`<< /Filter /Standard /V 1 /R 2 /Length 40 /O <${hex32}> /U <${"5A".repeat(32)}> /P -4 >>`)
  }

  let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"))
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefAt = Buffer.byteLength(out, "latin1")
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`
  const id = "0123456789ABCDEF0123456789ABCDEF"
  out +=
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNo} 0 R` +
    (encryptNo ? ` /Encrypt ${encryptNo} 0 R` : "") +
    ` /ID [<${id}> <${id}>] >>\nstartxref\n${xrefAt}\n%%EOF\n`
  return Buffer.from(out, "latin1")
}
