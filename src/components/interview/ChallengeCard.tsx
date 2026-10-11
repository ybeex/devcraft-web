'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, CheckCircle2, RotateCw } from 'lucide-react'
import type { ChallengeSummary, SDStatus } from '@/lib/api/system-design'
import { hoverLift } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

interface ChallengeCardProps {
  challenge: ChallengeSummary
  status?: SDStatus
}

/** Same visual language as QuestionFlashcard (badges, track color-mix trick, status border) — no flip mechanic here, since there's no short answer to preview the way a Q&A card has; the scenario only makes sense read in full on the practice page. */
export function ChallengeCard({ challenge, status }: ChallengeCardProps) {
  const trackColor = challenge.track === 'FE' ? 'var(--track-fe)' : 'var(--track-be)'

  return (
    <motion.div
      {...hoverLift}
      className={cn(
        'flex h-full flex-col rounded-[var(--radius-xl)] border bg-card p-5 shadow-elev-sm',
        status === 'REVIEWED' ? 'border-success/30' : status === 'NEEDS_PRACTICE' ? 'border-warning/30' : 'border-rim-subtle'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', DIFFICULTY_STYLE[challenge.difficulty])}>
          {challenge.difficulty}
        </span>
        <div className="flex items-center gap-1.5">
          {status === 'REVIEWED' && <CheckCircle2 size={14} className="text-success" />}
          {status === 'NEEDS_PRACTICE' && <RotateCw size={14} className="text-warning" />}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: trackColor, background: `color-mix(in srgb, ${trackColor} 14%, transparent)` }}
          >
            {challenge.track}
          </span>
        </div>
      </div>

      <h3 className="font-ui mt-3 flex-1 text-base font-bold text-ink">{challenge.title}</h3>

      <div className="mt-4 flex items-center justify-between border-t border-rim-subtle pt-3.5">
        <span className="flex items-center gap-1 text-xs text-dim">
          <Clock size={12} /> {challenge.estimatedMins}m
        </span>
        <Link href={`/interview/system-design/${challenge.slug}`} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
          Start <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  )
}
