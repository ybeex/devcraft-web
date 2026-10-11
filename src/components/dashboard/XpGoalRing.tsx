'use client'

import { useQuery } from '@tanstack/react-query'
import { getRecentActivity } from '@/lib/api/progress'
import { useCountUp } from '@/lib/hooks/useCountUp'

/**
 * There is no "daily XP goal" concept in the backend — no such field exists
 * on the user or anywhere else. This is a frontend-only motivational UX
 * constant. "Today's XP" itself IS real data, computed by summing
 * `GET /progress/activity` events whose `createdAt` falls on today's date.
 * We request the max page size (50) so the sum is accurate for all
 * realistic daily usage; a user would need more than 50 XP-awarding
 * actions in one day to under-count, which does not happen in practice
 * given the AI-credit and lesson-pacing limits elsewhere in the product.
 */
const DAILY_GOAL_XP = 200 // ≈ two lesson completions — frontend constant, not backend-configured

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export function XpGoalRing() {
  const { data: activity } = useQuery({
    queryKey: ['recent-activity-daily-goal'],
    queryFn: () => getRecentActivity(50),
  })

  const todayXp = (activity ?? [])
    .filter((e) => isToday(e.createdAt))
    .reduce((sum, e) => sum + e.xpAwarded, 0)

  const animatedXp = useCountUp(todayXp)
  const percent = Math.min(100, Math.round((todayXp / DAILY_GOAL_XP) * 100))
  const circumference = 2 * Math.PI * 42
  const dashOffset = circumference * (1 - percent / 100)

  return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-6 shadow-elev-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ghost">Today&apos;s goal</p>
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
          <circle cx="48" cy="48" r="42" fill="none" stroke="var(--rim-subtle)" strokeWidth="8" />
          <circle
            cx="48" cy="48" r="42" fill="none" stroke="var(--brand)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-ink">{animatedXp}</span>
          <span className="text-[10px] text-ghost">of {DAILY_GOAL_XP} XP</span>
        </div>
      </div>
    </div>
  )
}
