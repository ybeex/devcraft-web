'use client'

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'
import { getContentHealth } from '@/lib/api/admin'
import { SectionCard } from './SectionCard'
import { SkeletonTableRow } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'

const TYPE_LABEL: Record<string, string> = {
  MODULE: 'Module',
  LESSON: 'Lesson',
  INTERVIEW_QUESTION: 'Interview Q',
}

const PAGE_SIZE = 10

export function ContentHealthSection() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-content-health', page],
    queryFn: () => getContentHealth(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  })

  const issues = data?.issues ?? []
  const meta = data?.meta

  return (
    <SectionCard title="Content health" description="Empty modules, thin lessons, and short interview answers">
      {isLoading ? (
        <div className="-mx-5 sm:-mx-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 py-10 text-center">
          <PartyPopper size={40} strokeWidth={1.25} className="text-success" />
          <p className="text-sm font-semibold text-ink">No content health issues</p>
          <p className="max-w-xs text-xs text-dim">Every module, lesson, and interview question clears the bar.</p>
        </div>
      ) : (
        <>
          <ul className="-mx-5 divide-y divide-rim-subtle sm:-mx-6">
            {issues.map((issue) => (
              <li key={`${issue.contentType}-${issue.id}`} className="flex items-start gap-3 px-5 py-3 sm:px-6">
                <span className="mt-0.5 shrink-0 rounded-full bg-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-dim">
                  {TYPE_LABEL[issue.contentType] ?? issue.contentType}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{issue.title}</p>
                  <p className="text-xs text-dim">{issue.issue}</p>
                </div>
              </li>
            ))}
          </ul>

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-rim-subtle pt-3">
              <p className="text-xs text-dim">
                Page {meta.page} of {meta.totalPages} · {meta.total.toLocaleString()} issue{meta.total === 1 ? '' : 's'}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2.5"
                  disabled={!meta.hasPrev || isPlaceholderData}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2.5"
                  disabled={!meta.hasNext || isPlaceholderData}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </SectionCard>
  )
}
