import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

/** Shown when useContentSave's `conflictId` is set — links to the conflict-resolution view built in checkpoint 27 rather than silently failing or auto-navigating away from the form. */
export function ConflictNotice({ conflictId }: { conflictId: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-warning/10 px-4 py-3 text-sm text-warning">
      <span className="flex items-center gap-2">
        <AlertTriangle size={16} className="shrink-0" />
        Someone else edited this since you loaded it — your attempt has been saved for review.
      </span>
      <Link href={`/admin/conflicts?id=${conflictId}`} className="shrink-0 font-semibold underline underline-offset-2">
        Review conflict →
      </Link>
    </div>
  )
}
