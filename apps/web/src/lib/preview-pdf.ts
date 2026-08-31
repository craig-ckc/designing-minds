import type { PreviewPdf } from '@designing-minds/cms'

/**
 * A preview PDF lives in Supabase's public storage bucket — a different
 * origin from the site — so the browser ignores an anchor's `download`
 * attribute there. The object's own `?download=` query param is what forces
 * `Content-Disposition: attachment` instead of a same-tab navigation to the PDF.
 */
export function previewDownloadHref(pdf: PreviewPdf): string {
  const label = pdf.label.trim()
  const filename = label ? (/\.pdf$/i.test(label) ? label : `${label}.pdf`) : pdf.filename
  const separator = pdf.url.includes('?') ? '&' : '?'
  return `${pdf.url}${separator}download=${encodeURIComponent(filename)}`
}
