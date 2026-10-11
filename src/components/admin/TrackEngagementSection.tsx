'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingDown, Users as UsersIcon, Layers } from 'lucide-react'
import { getTrackEngagement } from '@/lib/api/admin'
import { SectionCard } from './SectionCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

/** Starts at chart-2, not chart-1 — chart-1 is already the funnel's color, one section up. */
const CHART_COLORS = ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-1)']

interface TrackEngagementSectionProps {
  days: number
}

export function TrackEngagementSection({ days }: TrackEngagementSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-track-engagement', days],
    queryFn: () => getTrackEngagement(days),
  })

  return (
    <SectionCard title="Track engagement" description={`Active learners & completion, last ${days} days`}>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-[var(--radius-md)]" />
          <Skeleton className="h-32 rounded-[var(--radius-md)]" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Layers size={56} strokeWidth={1.25} className="text-ghost" />}
          headline="No published tracks"
          body="Publish a track to start seeing engagement data here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((track, i) => (
            <div key={track.trackSlug} className="rounded-[var(--radius-md)] border border-rim-subtle bg-canvas p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{track.trackName}</h3>
                <span className="flex shrink-0 items-center gap-1 text-xs text-dim">
                  <UsersIcon size={13} />
                  {track.activeLearners.toLocaleString()} active
                </span>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-dim">
                  <span>Avg. completion</span>
                  <span className="font-semibold text-ink">{track.avgCompletionPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${Math.min(track.avgCompletionPercent, 100)}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>

              {track.highestDropoffLesson && (
                <div className="mt-3 flex items-start gap-1.5 rounded-[var(--radius-sm)] bg-[var(--negative-bg)] px-2.5 py-2 text-xs text-[var(--negative-text)]">
                  <TrendingDown size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Biggest drop-off: <strong>{track.highestDropoffLesson.title}</strong>{' '}
                    ({track.highestDropoffLesson.dropoffRatio.toFixed(0)}% leave here mid-lesson)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
