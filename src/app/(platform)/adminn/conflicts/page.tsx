'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { GitMerge, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { listConflicts, getConflictDetail, resolveConflict, type ContentConflict, type ConflictStatus } from '@/lib/api/admin'
import { computeConflictDiff, ConflictDiffView } from '@/components/admin/ConflictDiffView'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTableRow } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AvatarStack } from '@/components/ui/AvatarStack'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<ConflictStatus, string> = {
  PENDING: 'Pending',
  RESOLVED_KEPT_MINE: 'Kept attempted edit',
  RESOLVED_KEPT_THEIRS: 'Kept current version',
  RESOLVED_MERGED: 'Merged',
}

const STATUS_TONE: Record<ConflictStatus, string> = {
  PENDING: 'bg-warning/15 text-warning',
  RESOLVED_KEPT_MINE: 'bg-info/15 text-info',
  RESOLVED_KEPT_THEIRS: 'bg-info/15 text-info',
  RESOLVED_MERGED: 'bg-success/15 text-success',
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

type ResolutionMode = 'mine' | 'theirs' | 'merge'

/**
 * List + detail in one page rather than a separate /admin/conflicts/[id]
 * route — selecting a row uses data already in the fetched list page, so
 * there's no separate detail fetch/loading state, just an instant diff.
 *
 * The one exception is arriving via ?id=<uuid> — the content edit forms
 * link here directly when a save 409s with a fresh conflict, and that
 * conflict has no guarantee of being on whatever page/filter the list
 * happens to be showing. getConflictDetail (previously unused in this
 * page) covers exactly that case: fetched only when an id param is
 * present, used as a fallback when the list itself doesn't have it.
 */
function ConflictsPageContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const linkedId = searchParams.get('id')
  const [statusFilter, setStatusFilter] = useState<ConflictStatus | 'ALL'>('PENDING')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(linkedId)
  const [mode, setMode] = useState<ResolutionMode>('theirs')
  const [fieldChoices, setFieldChoices] = useState<Record<string, 'mine' | 'theirs'>>({})
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-conflicts', page, statusFilter],
    queryFn: () => listConflicts(page, 15, statusFilter === 'ALL' ? undefined : statusFilter),
    placeholderData: keepPreviousData,
  })

  const { data: linkedConflict } = useQuery({
    queryKey: ['admin-conflict-detail', linkedId],
    queryFn: () => getConflictDetail(linkedId!),
    enabled: !!linkedId,
  })

  // If the link target shows up in the fetched list, prefer that (it's
  // already the shape the rest of this page works with); otherwise fall
  // back to the direct fetch so the diff still renders regardless of
  // pagination or the current status filter.
  const conflicts = data?.conflicts ?? []
  const meta = data?.meta
  const selected = conflicts.find((c) => c.id === selectedId) ?? (linkedConflict?.id === selectedId ? linkedConflict : null)

  useEffect(() => {
    if (linkedId) setSelectedId(linkedId)
  }, [linkedId])

  function selectConflict(conflict: ContentConflict) {
    setSelectedId(conflict.id)
    setMode('theirs')
    setFieldChoices({})
    setResolveError(null)
  }

  async function handleResolve() {
    if (!selected) return
    setIsResolving(true)
    setResolveError(null)
    try {
      if (mode === 'mine') {
        await resolveConflict(selected.id, { resolution: 'RESOLVED_KEPT_MINE' })
      } else if (mode === 'theirs') {
        await resolveConflict(selected.id, { resolution: 'RESOLVED_KEPT_THEIRS' })
      } else {
        const mergedData: Record<string, unknown> = { ...selected.currentSnapshot }
        for (const [key, choice] of Object.entries(fieldChoices)) {
          if (choice === 'mine') mergedData[key] = selected.attemptedChanges[key]
        }
        await resolveConflict(selected.id, { resolution: 'RESOLVED_MERGED', mergedData })
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-conflicts'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-pending-conflicts'] }),
      ])
      setSelectedId(null)
    } catch {
      setResolveError('Something went wrong resolving this conflict — try again.')
    } finally {
      setIsResolving(false)
    }
  }

  const diffFields = selected ? computeConflictDiff(selected.attemptedChanges, selected.currentSnapshot) : []
  const changedFields = diffFields.filter((f) => f.changed)
  const mergeReady = mode !== 'merge' || changedFields.every((f) => fieldChoices[f.key])

  // Reconstructs which side "won" each field for an already-merged conflict,
  // by comparing the stored mergedData back against mine/theirs per field.
  let historicalMergeChoices: Record<string, 'mine' | 'theirs'> | undefined
  if (selected?.status === 'RESOLVED_MERGED' && selected.mergedData) {
    const mergedData = selected.mergedData
    historicalMergeChoices = {}
    for (const f of changedFields) {
      historicalMergeChoices[f.key] = JSON.stringify(mergedData[f.key]) === JSON.stringify(f.mine) ? 'mine' : 'theirs'
    }
  }

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem}>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Conflicts</h1>
        <p className="mt-1 text-sm text-dim">Concurrent edits that collided — review and resolve them here.</p>
      </motion.div>

      <motion.div variants={cascadeItem} className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className={cn('flex flex-col gap-3', selectedId && 'hidden lg:flex')}>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ConflictStatus | 'ALL')
              setPage(1)
            }}
            className="rounded-[var(--radius-md)] border border-rim bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-brand"
          >
            <option value="PENDING">Pending</option>
            <option value="ALL">All statuses</option>
            <option value="RESOLVED_KEPT_MINE">Kept attempted edit</option>
            <option value="RESOLVED_KEPT_THEIRS">Kept current version</option>
            <option value="RESOLVED_MERGED">Merged</option>
          </select>

          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
            {isLoading ? (
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} />
                ))}
              </div>
            ) : conflicts.length === 0 ? (
              <div className="p-2">
                <EmptyState
                  icon={<GitMerge size={48} strokeWidth={1.25} className="text-ghost" />}
                  headline={statusFilter === 'PENDING' ? 'No pending conflicts' : 'Nothing here'}
                  body={statusFilter === 'PENDING' ? 'The queue is clear.' : 'No conflicts match this filter.'}
                />
              </div>
            ) : (
              <ul className="divide-y divide-rim-subtle">
                {conflicts.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectConflict(c)}
                      className={cn(
                        'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-raised/50',
                        selectedId === c.id && 'bg-brand-muted'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{c.contentType}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', STATUS_TONE[c.status])}>
                          {STATUS_LABEL[c.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-dim">
                        <AvatarStack avatars={[{ name: c.admin.displayName, src: c.admin.avatar }]} max={1} size={16} />
                        {c.admin.displayName} · {formatTimestamp(c.createdAt)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-dim">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  disabled={!meta.hasPrev || isPlaceholderData}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  disabled={!meta.hasNext || isPlaceholderData}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            'rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6',
            !selectedId && 'hidden lg:block'
          )}
        >
          {!selected ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <EmptyState
                icon={<GitMerge size={56} strokeWidth={1.25} className="text-ghost" />}
                headline="Select a conflict"
                body="Pick one from the list to review the differences and resolve it."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1 lg:hidden" onClick={() => setSelectedId(null)}>
                    <ArrowLeft size={14} /> Back to list
                  </Button>
                  <h2 className="font-display text-lg font-bold text-ink">{selected.contentType} conflict</h2>
                  <p className="text-xs text-dim">
                    {selected.admin.displayName} attempted this edit {formatTimestamp(selected.createdAt)}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide', STATUS_TONE[selected.status])}>
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>

              {selected.status === 'PENDING' ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={mode === 'theirs' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('theirs')}>
                      Keep current version
                    </Button>
                    <Button variant={mode === 'mine' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('mine')}>
                      Keep attempted edit
                    </Button>
                    <Button variant={mode === 'merge' ? 'primary' : 'outline'} size="sm" onClick={() => setMode('merge')}>
                      Merge field-by-field
                    </Button>
                  </div>

                  <p className="text-xs text-dim">
                    {changedFields.length === 0
                      ? "The attempted change matches what's currently saved — nothing actually conflicts."
                      : mode === 'merge'
                        ? `Pick a side for each of the ${changedFields.length} differing field${changedFields.length === 1 ? '' : 's'} below.`
                        : `${changedFields.length} field${changedFields.length === 1 ? '' : 's'} differ — shown below for review.`}
                  </p>

                  <ConflictDiffView
                    fields={diffFields}
                    choices={mode === 'merge' ? fieldChoices : undefined}
                    onChoose={mode === 'merge' ? (key, choice) => setFieldChoices((prev) => ({ ...prev, [key]: choice })) : undefined}
                    mineLabel={`${selected.admin.displayName}'s edit`}
                    theirsLabel="Currently saved"
                  />

                  {resolveError && <p className="text-xs font-medium text-error">{resolveError}</p>}

                  <div className="flex justify-end border-t border-rim-subtle pt-4">
                    <Button onClick={handleResolve} disabled={isResolving || !mergeReady}>
                      {isResolving ? 'Resolving…' : 'Resolve conflict'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-dim">
                    Already resolved{selected.resolvedAt ? ` · ${formatTimestamp(selected.resolvedAt)}` : ''}.
                  </p>
                  <ConflictDiffView
                    fields={diffFields}
                    choices={historicalMergeChoices}
                    mineLabel={`${selected.admin.displayName}'s edit`}
                    theirsLabel="Was current at the time"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ConflictsPage() {
  // useSearchParams (to read ?id=) requires a Suspense boundary in the
  // App Router — without it, `next build` fails static generation for this
  // page. Matches the same pattern used in (auth)/reset-password/page.tsx.
  return (
    <Suspense fallback={null}>
      <ConflictsPageContent />
    </Suspense>
  )
}
