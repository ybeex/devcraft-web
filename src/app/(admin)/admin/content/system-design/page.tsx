'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Network } from 'lucide-react'
import { listAdminChallenges, type ContentDifficulty } from '@/lib/api/admin'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const DIFFICULTY_TONE: Record<ContentDifficulty, string> = {
  BEGINNER: 'bg-success/15 text-success',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

export default function AdminSystemDesignPage() {
  const [track, setTrack] = useState<'FE' | 'BE' | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-challenges', page, track],
    queryFn: () => listAdminChallenges({ page, limit: PAGE_SIZE, track: track === 'ALL' ? undefined : track }),
    placeholderData: keepPreviousData,
  })

  const challenges = data?.challenges ?? []
  const meta = data?.meta

  return (
    <motion.div
      variants={cascadeContainer}
      initial="initial"
      animate="animate"
      className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 sm:px-8"
    >
      <motion.div variants={cascadeItem} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">System design challenges</h1>
          <p className="mt-1 text-sm text-dim">{meta ? `${meta.total.toLocaleString()} total` : 'Loading…'}</p>
        </div>
        <Link
          href="/admin/content/system-design/new"
          className="btn-3d inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
        >
          + Add challenge
        </Link>
      </motion.div>

      <motion.div variants={cascadeItem} className="flex gap-2">
        {(['ALL', 'FE', 'BE'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTrack(t)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              track === t ? 'bg-brand-muted text-brand' : 'text-dim hover:bg-raised hover:text-ink'
            )}
          >
            {t === 'ALL' ? 'All tracks' : t}
          </button>
        ))}
      </motion.div>

      <motion.div variants={cascadeItem} className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
        {isLoading ? (
          <div className="p-5">
            <Skeleton className="h-16 w-full rounded-[var(--radius-md)]" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="p-2">
            <EmptyState
              icon={<Network size={56} strokeWidth={1.25} className="text-ghost" />}
              headline="No challenges yet"
              body="Add the first system design challenge for this track."
            />
          </div>
        ) : (
          <ul className="divide-y divide-rim-subtle">
            {challenges.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/content/system-design/${c.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-raised/50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      #{c.order} {c.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-bold text-dim">{c.track}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', DIFFICULTY_TONE[c.difficulty])}>
                        {c.difficulty}
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', c.isPublished ? 'bg-success/15 text-success' : 'bg-raised text-dim')}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-[11px] text-dim">{c.estimatedMins}m</span>
                    </div>
                  </div>
                </Link>
              </li>
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
