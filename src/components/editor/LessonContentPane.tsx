'use client'

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Clock, CheckCircle2 } from 'lucide-react'
import { markdownComponents } from '@/lib/markdown/components'
import type { LessonDetail } from '@/lib/api/lessons'

export function LessonContentPane({ lesson }: { lesson: LessonDetail }) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-5 flex items-center gap-3">
        {lesson.progress.status === 'COMPLETED' && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--positive-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--positive-text)]">
            <CheckCircle2 size={12} /> Completed
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-ghost">
          <Clock size={12} /> {lesson.estimatedMins} min
        </span>
        <span className="text-xs font-semibold text-brand">+{lesson.xpReward} XP</span>
      </div>

      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {lesson.content}
      </Markdown>

      {lesson.conceptTags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-rim-subtle pt-5">
          {lesson.conceptTags.map((tag) => (
            <span key={tag} className="rounded-full bg-raised px-2.5 py-1 text-[11px] font-medium text-dim">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
