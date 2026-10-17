'use client'

import { Fragment, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Sparkles, FolderCheck, ExternalLink } from 'lucide-react'
import {
  listAdminSubmissions,
  updateAdminSubmission,
  triggerAdminAiReview,
  type AdminSubmission,
  type SubmissionStatus,
} from '@/lib/api/admin'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTableRow } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from '@/lib/markdown/components'

const PAGE_SIZE = 15

const STATUS_TONE: Record<SubmissionStatus, string> = {
  PENDING: 'bg-warning/15 text-warning',
  APPROVED: 'bg-success/15 text-success',
  NEEDS_REVISION: 'bg-error/15 text-error',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function AdminSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('PENDING')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isPlaceholderData, refetch } = useQuery({
    queryKey: ['admin-submissions', page, statusFilter],
    queryFn: () => listAdminSubmissions(page, PAGE_SIZE, statusFilter === 'ALL' ? undefined : statusFilter),
    placeholderData: keepPreviousData,
  })

  const submissions = data?.submissions ?? []
  const meta = data?.meta

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Submissions</h1>
        <p className="mt-1 text-sm text-dim">{meta ? `${meta.total.toLocaleString()} total` : 'Loading…'}</p>
      </motion.div>

      <motion.div variants={cascadeItem} className="flex gap-2">
        {(['PENDING', 'APPROVED', 'NEEDS_REVISION', 'ALL'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatusFilter(s)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              statusFilter === s ? 'bg-brand-muted text-brand' : 'text-dim hover:bg-raised hover:text-ink'
            )}
          >
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </motion.div>

      <motion.div variants={cascadeItem} className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
        {isLoading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon={<FolderCheck size={56} strokeWidth={1.25} className="text-ghost" />}
              headline="Nothing here"
              body="No submissions match this filter."
            />
          </div>
        ) : (
          <ul className="divide-y divide-rim-subtle">
            {submissions.map((s) => (
              <SubmissionRow
                key={s.id}
                submission={s}
                isExpanded={expandedId === s.id}
                onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                onChanged={() => refetch()}
              />
            ))}
          </ul>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-rim-subtle px-5 py-3">
            <p className="text-xs text-dim">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="px-2.5" disabled={!meta.hasPrev || isPlaceholderData} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={15} />
              </Button>
              <Button variant="ghost" size="sm" className="px-2.5" disabled={!meta.hasNext || isPlaceholderData} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function SubmissionRow({
  submission,
  isExpanded,
  onToggle,
  onChanged,
}: {
  submission: AdminSubmission
  isExpanded: boolean
  onToggle: () => void
  onChanged: () => void
}) {
  const [note, setNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const avgScore =
    submission.peerReviews.length > 0
      ? (submission.peerReviews.reduce((sum, r) => sum + r.score, 0) / submission.peerReviews.length).toFixed(1)
      : null

  async function handleStatusChange(status: 'APPROVED' | 'NEEDS_REVISION') {
    if (status === 'NEEDS_REVISION' && !note.trim()) {
      setActionError('Write what the learner should change first.')
      return
    }
    setIsUpdating(true)
    setActionError(null)
    try {
      await updateAdminSubmission(submission.id, status, note || undefined)
      onChanged()
    } catch {
      setActionError("Couldn't update this submission — try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleAiReview() {
    setIsReviewing(true)
    setActionError(null)
    try {
      await triggerAdminAiReview(submission.id)
      onChanged()
    } catch {
      setActionError("AI review failed — it's rate-limited to 20/hour, or something else went wrong.")
    } finally {
      setIsReviewing(false)
    }
  }

  return (
    <Fragment>
      <li>
        <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-raised/50">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{submission.project.title}</p>
            <p className="text-xs text-dim">
              {submission.user.displayName} · {formatDate(submission.createdAt)}
              {avgScore && ` · Peer avg ${avgScore}/10`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', STATUS_TONE[submission.status])}>
              {submission.status.replace('_', ' ')}
            </span>
            {isExpanded ? <ChevronUp size={15} className="text-ghost" /> : <ChevronDown size={15} className="text-ghost" />}
          </div>
        </button>
      </li>
      {isExpanded && (
        <li className="bg-canvas px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 text-sm">
              {submission.repoUrl && (
                <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-brand hover:underline">
                  Repo <ExternalLink size={12} />
                </a>
              )}
              {submission.liveUrl && (
                <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-brand hover:underline">
                  Live demo <ExternalLink size={12} />
                </a>
              )}
            </div>

            {submission.notes && <p className="text-sm text-ink">{submission.notes}</p>}

            <div className="rounded-[var(--radius-md)] border border-rim-subtle bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Sparkles size={14} /> AI review
                </h3>
                <Button variant="outline" size="sm" onClick={handleAiReview} disabled={isReviewing}>
                  {isReviewing ? 'Reviewing…' : submission.aiReview ? 'Re-run' : 'Run AI review'}
                </Button>
              </div>
              {submission.aiReview ? (
                <div className="max-h-[28rem] overflow-y-auto text-sm"><Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{submission.aiReview}</Markdown></div>
              ) : (
                <p className="text-xs text-ghost">Not reviewed yet.</p>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-dim">Feedback for the learner (required to request a revision)</span>
              <textarea
                data-testid="review-feedback"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-[var(--radius-md)] border border-rim bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand"
              />
            </label>

            {submission.reviewFeedback && (
              <p className="text-xs text-dim">Last feedback sent: {submission.reviewFeedback}</p>
            )}
            {actionError && <p className="text-xs font-medium text-error">{actionError}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={() => handleStatusChange('NEEDS_REVISION')}>
                Request revision
              </Button>
              <Button size="sm" disabled={isUpdating} onClick={() => handleStatusChange('APPROVED')}>
                Approve
              </Button>
            </div>
          </div>
        </li>
      )}
    </Fragment>
  )
}
