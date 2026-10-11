'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { getRecentActivity, type XpEvent } from '@/lib/api/progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const EVENT_ICON: Record<string, 'xpGem' | 'streak' | 'certificate' | 'projectRocket' | 'community'> = {
  LESSON_COMPLETE: 'xpGem',
  STREAK_BONUS: 'streak',
  PROJECT_SUBMIT: 'projectRocket',
  PEER_REVIEW: 'community',
  QUESTION_ANSWERED: 'community',
  FIRST_LOGIN: 'xpGem',
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityFeed() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ['recent-activity-feed'],
    queryFn: () => getRecentActivity(8),
  })

  return (
    <div className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
      <h3 className="font-ui text-sm font-semibold text-ink">Recent activity</h3>

      {isLoading && (
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}

      {!isLoading && activity && activity.length === 0 && (
        <EmptyState
          icon={<FeatureIcon name="xpGem" size={40} achieved={false} />}
          headline="Nothing yet"
          body="Complete a lesson and it'll show up here."
          className="py-8"
        />
      )}

      {!isLoading && activity && activity.length > 0 && (
        <motion.ul variants={cascadeContainer} initial="initial" animate="animate" className="mt-3 flex flex-col">
          {activity.map((event: XpEvent) => (
            <motion.li
              key={event.id}
              variants={cascadeItem}
              className="flex items-center gap-3 border-b border-rim-subtle py-3 last:border-0"
            >
              <FeatureIcon name={EVENT_ICON[event.eventType] ?? 'xpGem'} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{event.description ?? event.eventType}</p>
                <p className="text-xs text-ghost">{timeAgo(event.createdAt)}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand">+{event.xpAwarded}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  )
}
