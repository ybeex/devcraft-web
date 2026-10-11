'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow'
import { getLeaderboard, getMyRank, type LeaderboardPeriod, type LeaderboardTrack } from '@/lib/api/leaderboard'
import { useAuthStore } from '@/stores/auth-store'
import { rewardPulse, cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const PERIOD_OPTIONS = ['Weekly', 'Monthly', 'All-time']
const TRACK_OPTIONS = ['All', 'Frontend', 'Backend']

function toApiPeriod(label: string): LeaderboardPeriod {
  if (label === 'Monthly') return 'monthly'
  if (label === 'All-time') return 'all-time'
  return 'weekly'
}

function toApiTrack(label: string): LeaderboardTrack | undefined {
  if (label === 'Frontend') return 'FE'
  if (label === 'Backend') return 'BE'
  return undefined
}

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user)
  const [periodLabel, setPeriodLabel] = useState('Weekly')
  const [trackLabel, setTrackLabel] = useState('All')
  const period = toApiPeriod(periodLabel)
  const track = toApiTrack(trackLabel)
  const [showRankUp, setShowRankUp] = useState(false)
  const previousRankRef = useRef<{ key: string; rank: number | null } | null>(null)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['leaderboard', period, track],
    queryFn: () => getLeaderboard(period, 100, track),
    refetchInterval: 60_000,
  })

  const { data: myRank } = useQuery({
    queryKey: ['my-rank', period, track],
    queryFn: () => getMyRank(period, track),
    refetchInterval: 60_000,
  })

  // Rank-up detection is a frontend-only heuristic (no "previous rank" concept
  // exists server-side): we diff each successful fetch against the last one
  // seen for the SAME period+track combination, so switching either filter
  // never reads as a rank change.
  useEffect(() => {
    if (!myRank) return
    const key = `${period}:${track ?? 'all'}`
    const prev = previousRankRef.current
    if (prev && prev.key === key && prev.rank !== null && myRank.rank !== null && myRank.rank < prev.rank) {
      setShowRankUp(true)
      const t = setTimeout(() => setShowRankUp(false), 4000)
      previousRankRef.current = { key, rank: myRank.rank }
      return () => clearTimeout(t)
    }
    previousRankRef.current = { key, rank: myRank.rank }
  }, [myRank, period, track])

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Leaderboard</h1>
          <p className="mt-1 text-sm text-dim">See how you stack up against other builders.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl options={TRACK_OPTIONS} value={trackLabel} onChange={setTrackLabel} />
          <SegmentedControl options={PERIOD_OPTIONS} value={periodLabel} onChange={setPeriodLabel} />
        </div>
      </div>

      {myRank && (
        <div className="mt-6 flex items-center gap-4 rounded-[var(--radius-xl)] border border-brand bg-brand-muted px-5 py-4">
          <FeatureIcon name="leaderboardTrophy" size={40} />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Your rank</p>
            <p className="mt-0.5 font-display text-xl font-bold text-ink">
              {myRank.rank !== null ? `#${myRank.rank}` : 'Unranked'}
            </p>
          </div>
          <p className="font-ui text-lg font-bold text-brand">{myRank.xp.toLocaleString()} XP</p>
        </div>
      )}

      {myRank?.rank === null && (
        <p className="mt-2 text-xs text-ghost">Keep earning XP — you&rsquo;ll appear here once you crack the top 1,000.</p>
      )}

      {isLoading && (
        <div className="mt-8 flex flex-col gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      )}

      {!isLoading && entries && entries.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<FeatureIcon name="leaderboardTrophy" size={56} achieved={false} />}
            headline="No rankings yet"
            body={
              track
                ? `Be the first ${track === 'FE' ? 'frontend' : 'backend'} builder to earn XP this period.`
                : 'Be the first to earn XP this period and claim the top spot.'
            }
          />
        </div>
      )}

      {!isLoading && entries && entries.length > 0 && (
        <motion.div
          variants={cascadeContainer}
          initial="initial"
          animate="animate"
          className="mt-8 flex flex-col gap-2.5"
        >
          {entries.map((entry) => (
            <motion.div key={entry.userId} variants={cascadeItem}>
              <LeaderboardRow entry={entry} isCurrentUser={entry.userId === user?.id} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showRankUp && myRank && (
          <motion.div
            variants={rewardPulse}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--radius-xl)] border border-rim-subtle bg-card px-6 py-4 text-center shadow-elev-lg"
          >
            <FeatureIcon name="leaderboardTrophy" size={40} className="mx-auto" />
            <p className="mt-2 font-ui text-sm font-bold text-ink">Rank up! You&rsquo;re now #{myRank.rank}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
