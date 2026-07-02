/* -------------------------------------------------------------------------
   Minimal CSV encode/parse (RFC 4180-style quoting) plus a browser download
   helper. Kept dependency-free; the admin's export/import volumes are small.
   ------------------------------------------------------------------------- */

function encodeCell(value: string): string {
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
  // Drop rows that are entirely empty (trailing newlines, blank lines).
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''))
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
