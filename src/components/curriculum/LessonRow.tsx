'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Lock } from 'lucide-react'
import type { LessonNodeData } from '@/lib/utils/curriculum-tree'
import { cn } from '@/lib/utils'

const DIFFICULTY_COLOR: Record<string, string> = {
  BEGINNER: 'bg-success',
  INTERMEDIATE: 'bg-warning',
  ADVANCED: 'bg-error',
}

export function LessonRow({ data, trackSlug }: { data: LessonNodeData; trackSlug: string }) {
  const { lesson, state } = data
  const isLocked = state === 'locked'
  const isCompleted = state === 'completed'

  const content = (
    <>
      <span className="shrink-0">
        {isLocked ? (
          <Lock size={16} className="text-ghost" />
        ) : isCompleted ? (
          <CheckCircle2 size={16} className="text-success" />
        ) : (
          <Circle size={16} className="text-ghost" />
        )}
      </span>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DIFFICULTY_COLOR[lesson.difficulty])} />
      <span className={cn('min-w-0 flex-1 truncate text-sm', isLocked ? 'text-ghost' : 'text-ink')}>
        {lesson.title}
      </span>
      <span className="shrink-0 text-xs text-ghost">{lesson.estimatedMins}m</span>
      <span className="shrink-0 text-xs font-semibold text-brand">+{lesson.xpReward}</span>
    </>
  )

  if (isLocked) {
    return (
      <div className="flex cursor-not-allowed items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 opacity-50">
        {content}
      </div>
    )
  }

  return (
    <Link
      href={`/learn/${trackSlug.toLowerCase()}/${lesson.slug}`}
      className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 transition-colors hover:bg-raised"
    >
      {content}
    </Link>
  )
}
