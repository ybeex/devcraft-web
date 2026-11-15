'use client'

import { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, RotateCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { MockInterviewPanel } from './MockInterviewPanel'
import {
  getInterviewQuestion,
  getMyInterviewProgress,
  setQuestionStatus,
  clearQuestionStatus,
  type ReviewStatus,
} from '@/lib/api/interview'
import { ApiRequestError } from '@/lib/api/client'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

const DIFFICULTY_STYLE: Record<string, string> = {
  BEGINNER: 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
  INTERMEDIATE: 'bg-warning/15 text-warning',
  ADVANCED: 'bg-error/15 text-error',
}

export function InterviewQuestionDetail({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const [statusPending, setStatusPending] = useState(false)

  const {
    data: question,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['interview-question', id],
    queryFn: () => getInterviewQuestion(id),
    retry: (count, err) => !(err instanceof ApiRequestError && err.statusCode === 404) && count < 2,
  })

  const { data: progress } = useQuery({
    queryKey: ['interview-progress'],
    queryFn: getMyInterviewProgress,
  })
  const status = progress?.find((p) => p.questionId === id)?.status

  async function handleToggleStatus(clickedStatus: ReviewStatus) {
    setStatusPending(true)
    try {
      if (status === clickedStatus) {
        await clearQuestionStatus(id)
      } else {
        await setQuestionStatus(id, clickedStatus)
      }
      await queryClient.invalidateQueries({ queryKey: ['interview-progress'] })
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
        <p className="text-sm text-dim">Couldn&rsquo;t load this question. Try refreshing the page.</p>
      </div>
    )
  }

  if (!question) return null

  const trackColor = question.track === 'FE' ? 'var(--track-fe)' : 'var(--track-be)'

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link href="/interview" className="inline-flex items-center gap-1.5 text-sm font-medium text-dim hover:text-ink">
        <ArrowLeft size={14} /> Interview prep
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="mt-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                DIFFICULTY_STYLE[question.difficulty]
              )}
            >
              {question.difficulty}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: trackColor, background: `color-mix(in srgb, ${trackColor} 14%, transparent)` }}
            >
              {question.track}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-ghost">{question.topic}</span>
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

        <h1 className="font-display mt-3 text-2xl font-bold text-ink sm:text-3xl">{question.title}</h1>

        <div className="mt-5 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5">
          <h3 className="font-ui text-xs font-semibold uppercase tracking-wide text-dim">Model answer</h3>
          <p className="mt-2 text-sm leading-relaxed text-dim">{question.answer}</p>
        </div>

        {question.codeExample && (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
            <div className="flex items-center gap-1.5 border-b border-rim-subtle bg-raised px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-error/60" />
              <span className="h-2 w-2 rounded-full bg-warning/60" />
              <span className="h-2 w-2 rounded-full bg-success/60" />
            </div>
            <pre className="overflow-x-auto bg-canvas p-4">
              <code className="font-mono text-[13px] leading-relaxed text-ink">{question.codeExample}</code>
            </pre>
          </div>
        )}

        <div className="mt-6">
          <MockInterviewPanel question={question} />
        </div>
      </motion.div>
    </div>
  )
}
