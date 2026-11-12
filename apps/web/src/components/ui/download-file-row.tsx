import { Button } from './button'
import { Icon } from './icon'

/** One purchased file: document icon, file name, and a Download button. */
export function DownloadFileRow({
  label,
  onDownload,
  disabled = false,
}: {
  label: string
  onDownload: () => void
  disabled?: boolean
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="flex min-w-0 items-center gap-3 text-body text-ink">
        <Icon name="doc" size={18} className="flex-none text-ink-soft" />
        <span className="truncate">{label}</span>
      </span>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onDownload} aria-label={`Download ${label}`}>
        <Icon name="download" size={16} />
        Download
      </Button>
    </li>
  )
}
