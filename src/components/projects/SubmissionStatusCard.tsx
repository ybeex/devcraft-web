import { ExternalLink, GiftIcon } from 'lucide-react'
import { StatusDot } from '@/components/ui/StatusDot'
import { AvatarStack } from '@/components/ui/AvatarStack'
import type { MySubmission } from '@/lib/api/projects'

const STATUS_TONE: Record<MySubmission['status'], 'success' | 'warning' | 'info'> = {
  APPROVED: 'success',
  NEEDS_REVISION: 'warning',
  PENDING: 'info',
}

const STATUS_LABEL: Record<MySubmission['status'], string> = {
  APPROVED: 'Approved',
  NEEDS_REVISION: 'Needs revision',
  PENDING: 'Pending review',
}

export function SubmissionStatusCard({ submission }: { submission: MySubmission }) {
  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-6 shadow-elev-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusDot
          tone={STATUS_TONE[submission.status]}
          label={STATUS_LABEL[submission.status]}
          pulse={submission.status === 'PENDING'}
        />
        <span className="text-xs text-ghost">Submitted {new Date(submission.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {submission.repoUrl && (
          <a
            href={submission.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-rim px-3.5 py-2 text-xs font-medium text-dim transition-colors hover:text-ink"
          >
            <GiftIcon size={13} /> Repository
          </a>
        )}
        {submission.liveUrl && (
          <a
            href={submission.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-rim px-3.5 py-2 text-xs font-medium text-dim transition-colors hover:text-ink"
          >
            <ExternalLink size={13} /> Live demo
          </a>
        )}
      </div>

      {submission.notes && <p className="text-sm leading-relaxed text-dim">{submission.notes}</p>}

      {submission.reviewFeedback && (
        <div
          data-testid="reviewer-feedback"
          className={`rounded-lg border p-4 ${submission.status === 'NEEDS_REVISION' ? 'border-warning/40 bg-warning/10' : 'border-success/40 bg-success/10'}`}
        >
          <span className="font-ui text-xs font-semibold uppercase tracking-wide text-dim">
            {submission.status === 'NEEDS_REVISION' ? 'What to change' : 'Reviewer note'}
          </span>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{submission.reviewFeedback}</p>
          <p className="mt-2 text-xs text-ghost">Update your links or notes and resubmit to send it back for review.</p>
        </div>
      )}

      {submission.aiReview && (
        <div className="rounded-lg bg-raised p-4">
          <div className="flex items-center justify-between">
            <span className="font-ui text-xs font-semibold uppercase tracking-wide text-dim">AI review</span>
            {submission.aiScore !== null && (
              <span className="font-ui text-sm font-bold text-brand">{submission.aiScore}/100</span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-dim">{submission.aiReview}</p>
        </div>
      )}

      {submission.peerReviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <span className="font-ui text-xs font-semibold uppercase tracking-wide text-dim">Peer reviews</span>
            <AvatarStack
              avatars={submission.peerReviews.map((r) => ({ name: r.reviewer.displayName, src: r.reviewer.avatar }))}
            />
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {submission.peerReviews.map((review) => (
              <div key={review.id} className="border-t border-rim-subtle pt-3 first:border-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{review.reviewer.displayName}</span>
                  <span className="text-sm font-bold text-brand">{review.score}/100</span>
                </div>
                <p className="mt-1 text-sm text-dim">{review.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
