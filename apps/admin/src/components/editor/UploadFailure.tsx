import { formatBytes } from '../../lib/upload-transport'
import { useUploads, type UploadJob } from '../../lib/uploads'
import { Button } from '../primitives'

/**
 * A failed upload, said out loud.
 *
 * One component for all three upload fields, which each used to carry their own
 * identical copy — and each said only "Upload failed (400)", which is the one
 * thing an editor can do nothing with. What they need is the cause, so this
 * shows three things:
 *
 *   1. the file, and its size — a size limit is the most common refusal, and
 *      the number is half the answer
 *   2. what went wrong in plain English, and where possible what to do
 *   3. storage's own code and message, dimmed, for anything our wording does
 *      not cover — so the answer is here rather than in the network tab
 *
 * It persists until dismissed. A failed upload is a state the editor still has
 * to deal with, not a notification.
 */
export function UploadFailure({ job }: { job: UploadJob }) {
  const { dismiss } = useUploads()
  const size = formatBytes(job.sizeBytes)

  return (
    <div className="grid gap-1 rounded-control border border-danger bg-danger-tint px-2.5 py-2">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-ui text-danger">
          <span className="font-medium">{job.filename}</span>
          {size ? <span className="text-danger/70"> · {size}</span> : null}
          <br />
          {job.error ?? 'The upload failed, and storage gave no reason.'}
        </p>
        <Button variant="ghost" size="sm" onClick={() => dismiss(job.id)}>
          Dismiss
        </Button>
      </div>

      {/* Storage's exact words. Only shown when it said something beyond what
          the sentence above already conveys, so the common cases stay clean. */}
      {job.errorDetail ? (
        <p className="text-ui text-danger/70">{job.errorDetail}</p>
      ) : null}
    </div>
  )
}
