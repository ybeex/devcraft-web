'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, RotateCw, Eye, Clock } from 'lucide-react'
import {
  getChallenge,
  getMyChallengeProgress,
  setChallengeStatus,
  clearChallengeStatus,
  type SDStatus,
  type ChallengeStage,
} from '@/lib/api/system-design'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiRequestError } from '@/lib/api/client'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

export function ChallengeDetail({ slug }: { slug: string }) {
  const queryClient = useQueryClient()
  const [statusPending, setStatusPending] = useState(false)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const {
    data: challenge,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['system-design-challenge', slug],
    queryFn: () => getChallenge(slug),
    retry: (count, err) => !(err instanceof ApiRequestError && err.statusCode === 404) && count < 2,
  })

  const { data: progress } = useQuery({
    queryKey: ['system-design-progress'],
    queryFn: getMyChallengeProgress,
  })
  const status = challenge ? progress?.find((p) => p.challengeId === challenge.id)?.status : undefined

  async function handleToggleStatus(clickedStatus: SDStatus) {
    if (!challenge) return
    setStatusPending(true)
    try {
      if (status === clickedStatus) {
        await clearChallengeStatus(challenge.id)
      } else {
        await setChallengeStatus(challenge.id, clickedStatus)
      }
      await queryClient.invalidateQueries({ queryKey: ['system-design-progress'] })
    } finally {
      setStatusPending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-6 h-9 w-2/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  if (error) {
    if (error instanceof ApiRequestError && error.statusCode === 404) notFound()
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="text-sm text-dim">Couldn&rsquo;t load this challenge. Try refreshing the page.</p>
      </div>
    )
  }

  if (!challenge) return null

  const trackColor = challenge.track === 'FE' ? 'var(--track-fe)' : 'var(--track-be)'

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link href="/interview" className="inline-flex items-center gap-1.5 text-sm font-medium text-dim hover:text-ink">
        <ArrowLeft size={14} /> Interview prep
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: easeOut }} className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', DIFFICULTY_STYLE[challenge.difficulty])}>
              {challenge.difficulty}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: trackColor, background: `color-mix(in srgb, ${trackColor} 14%, transparent)` }}
            >
              {challenge.track}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-ghost">
              <Clock size={11} /> {challenge.estimatedMins}m
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleToggleStatus('REVIEWED')}
              disabled={statusPending}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                status === 'REVIEWED' ? 'border-success/40 bg-success/10 text-success' : 'border-rim text-dim hover:text-ink'
              )}
            >
              <CheckCircle2 size={13} /> Reviewed
            </button>
            <button
              type="button"
              onClick={() => handleToggleStatus('NEEDS_PRACTICE')}
              disabled={statusPending}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                status === 'NEEDS_PRACTICE' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-rim text-dim hover:text-ink'
              )}
            >
              <RotateCw size={13} /> Needs practice
            </button>
          </div>
        </div>

        <h1 className="font-display mt-3 text-2xl font-bold text-ink sm:text-3xl">{challenge.title}</h1>

        <div className="mt-5 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5">
          <h3 className="font-ui text-xs font-semibold uppercase tracking-wide text-dim">The scenario</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{challenge.scenario}</p>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {challenge.stages.map((stage, i) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={i}
              isRevealed={!!revealed[stage.id]}
              onReveal={() => setRevealed((r) => ({ ...r, [stage.id]: true }))}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function StageCard({
  stage,
  index,
  isRevealed,
  onReveal,
}: {
  stage: ChallengeStage
  index: number
  isRevealed: boolean
  onReveal: () => void
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card">
      <div className="flex items-center gap-3 border-b border-rim-subtle bg-raised px-5 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand">
          {index + 1}
        </span>
        <h3 className="font-ui text-sm font-bold text-ink">{stage.title}</h3>
      </div>

      <div className="p-5">
        {stage.guidingQuestions.length > 0 && (
          <div className="mb-4">
            <p className="font-ui text-xs font-semibold uppercase tracking-wide text-dim">Think about</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {stage.guidingQuestions.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink">
                  <span className="text-ghost">•</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isRevealed ? (
          <button
            type="button"
            onClick={onReveal}
            className="flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-rim px-4 py-2.5 text-sm font-semibold text-brand hover:border-brand"
          >
            <Eye size={15} /> Reveal model answer
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-[var(--radius-md)] bg-raised p-4"
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-dim">{stage.modelAnswer}</p>
            {stage.diagramImageUrl && (
              <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
                <Image src={stage.diagramImageUrl} alt={`${stage.title} diagram`} fill className="object-contain" unoptimized />
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
