/* -------------------------------------------------------------------------
   Minimal CSV encode/parse (RFC 4180-style quoting) plus a browser download
   helper. Kept dependency-free; the admin's export/import volumes are small.
   ------------------------------------------------------------------------- */

/*
 * Spreadsheet formula injection: Excel/Sheets evaluate a cell that STARTS with
 * = + - @ (or a tab/CR that some apps trim away first). Submissions, customer
 * names and similar fields are written by the public, so an exported cell must
 * never be able to start a formula. The OWASP-recommended fix is a leading
 * apostrophe, which spreadsheets render as plain text.
 *
 * A plain number such as -12.50 is left alone so numeric columns stay numeric;
 * anything else that merely looks numeric (+27 82 ..., -1+1) is guarded.
 */
const FORMULA_START = /^[=+\-@\t\r]/
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/
const FORMULA_GUARD = /^'(?=[=+\-@\t\r])/

export function neutraliseFormula(value: string): string {
  return FORMULA_START.test(value) && !PLAIN_NUMBER.test(value) ? `'${value}` : value
}

function encodeCell(raw: string): string {
  const value = neutraliseFormula(raw)
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(encodeCell).join(',')).join('\r\n')
}

/** Parse CSV text into rows of cells, honouring quoted cells and embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  // Drop rows that are entirely empty (trailing newlines, blank lines), and
  // undo the export-side formula guard so an exported file re-imports unchanged.
  return rows
    .filter((cells) => cells.some((value) => value.trim() !== ''))
    .map((cells) => cells.map((value) => value.replace(FORMULA_GUARD, '')))
}

export function downloadCsv(filename: string, csv: string): void {
  // Leading BOM so Excel opens the file as UTF-8.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
