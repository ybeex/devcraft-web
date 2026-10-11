'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, RotateCcw, CheckCircle2, RotateCw } from 'lucide-react'
import type { InterviewQuestion, ReviewStatus } from '@/lib/api/interview'
import { hoverLift } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

interface QuestionFlashcardProps {
  question: InterviewQuestion
  /** undefined = unreviewed (no explicit user action yet) */
  status?: ReviewStatus
  onToggleStatus: (questionId: string, status: ReviewStatus) => void
  statusPending?: boolean
}

export function QuestionFlashcard({ question, status, onToggleStatus, statusPending }: QuestionFlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const trackColor = question.track === 'FE' ? 'var(--track-fe)' : 'var(--track-be)'

  return (
    <motion.div
      {...hoverLift}
      className={cn(
        'flex h-full flex-col rounded-[var(--radius-xl)] border bg-card p-5 shadow-elev-sm',
        status === 'REVIEWED' ? 'border-success/30' : status === 'NEEDS_PRACTICE' ? 'border-warning/30' : 'border-rim-subtle'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
            DIFFICULTY_STYLE[question.difficulty]
          )}
        >
          {question.difficulty}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleStatus(question.id, 'REVIEWED')}
            disabled={statusPending}
            title={status === 'REVIEWED' ? 'Reviewed — click to clear' : 'Mark as reviewed'}
            className={cn(
              'rounded-full p-1 transition-colors disabled:opacity-50',
              status === 'REVIEWED' ? 'bg-success/15 text-success' : 'text-ghost hover:text-dim'
            )}
          >
            <CheckCircle2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onToggleStatus(question.id, 'NEEDS_PRACTICE')}
            disabled={statusPending}
            title={status === 'NEEDS_PRACTICE' ? 'Needs practice — click to clear' : 'Mark as needing more practice'}
            className={cn(
              'rounded-full p-1 transition-colors disabled:opacity-50',
              status === 'NEEDS_PRACTICE' ? 'bg-warning/15 text-warning' : 'text-ghost hover:text-dim'
            )}
          >
            <RotateCw size={14} />
          </button>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: trackColor, background: `color-mix(in srgb, ${trackColor} 14%, transparent)` }}
          >
            {question.track}
          </span>
        </div>
      </div>

      <p className="mt-2.5 text-[11px] font-medium uppercase tracking-wide text-ghost">{question.topic}</p>

      <button onClick={() => setFlipped((f) => !f)} className="mt-2 flex-1 text-left">
        {!flipped ? (
          <h3 className="font-ui text-base font-bold text-ink">{question.title}</h3>
        ) : (
          <p className="line-clamp-6 text-sm leading-relaxed text-dim">{question.answer}</p>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between border-t border-rim-subtle pt-3.5">
        <button
          onClick={() => setFlipped((f) => !f)}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          <RotateCcw size={12} /> {flipped ? 'Show question' : 'Reveal answer'}
        </button>
        <Link href={`/interview/${question.id}`} className="flex items-center gap-1 text-xs font-medium text-dim hover:text-ink">
          Practice <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  )
}
