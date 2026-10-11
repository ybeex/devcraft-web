'use client'

import { useQuery } from '@tanstack/react-query'
import { BookCheck, FolderCheck, Hash } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { getUserStats } from '@/lib/api/progress'
import { getMyRank } from '@/lib/api/leaderboard'
import { useCountUp } from '@/lib/hooks/useCountUp'
import { Skeleton } from '@/components/ui/Skeleton'

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4 shadow-elev-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-raised">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold leading-tight text-ink">{value}</p>
        <p className="text-xs text-dim">{label}</p>
      </div>
    </div>
  )
}

export function StatsGrid() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: getUserStats,
  })

  const { data: rank, isLoading: loadingRank } = useQuery({
    queryKey: ['my-rank', 'weekly'],
    queryFn: () => getMyRank('weekly'),
  })

  const lessonsCount = useCountUp(stats?.lessonsCompleted ?? 0)
  const projectsCount = useCountUp(stats?.projectsSubmitted ?? 0)
  const streakCount = useCountUp(stats?.currentStreak ?? 0)

  if (loadingStats || loadingRank) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={<BookCheck size={20} className="text-brand" />} value={lessonsCount} label="Lessons completed" />
      <StatCard icon={<FolderCheck size={20} className="text-info" />} value={projectsCount} label="Projects built" />
      <StatCard icon={<FeatureIcon name="streak" size={22} />} value={`${streakCount}d`} label="Current streak" />
      <StatCard
        icon={<Hash size={20} className="text-warning" />}
        value={rank?.rank ? `#${rank.rank}` : '—'}
        label="Weekly rank"
      />
    </div>
  )
}
