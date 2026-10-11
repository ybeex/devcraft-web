import { authFetch } from './auth-fetch'
import { apiFetch } from './client'

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time'
export type LeaderboardTrack = 'FE' | 'BE'

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName: string
  avatar: string | null
  tier: 'FREE' | 'PRO' | 'TEAM'
  primaryTrack: 'FE' | 'BE' | null
  xp: number
}

export interface MyRank {
  rank: number | null
  xp: number
  userId: string
}

/**
 * Public endpoint. When track is provided, ranking is scoped to that track
 * — rank 1 means 1st among that track's builders, not a filtered-down
 * position from the global ranking (the backend re-ranks within the
 * filtered set rather than filtering an already-ranked list).
 */
export function getLeaderboard(
  period: LeaderboardPeriod = 'weekly',
  limit = 100,
  track?: LeaderboardTrack
): Promise<LeaderboardEntry[]> {
  const qs = new URLSearchParams({ period, limit: String(limit) })
  if (track) qs.set('track', track)
  return apiFetch<LeaderboardEntry[]>(`/leaderboard?${qs.toString()}`)
}

/** Requires auth — rank is null if the user isn't in the top 1000 for that period/track. */
export function getMyRank(period: LeaderboardPeriod = 'weekly', track?: LeaderboardTrack): Promise<MyRank> {
  const qs = new URLSearchParams({ period })
  if (track) qs.set('track', track)
  return authFetch<MyRank>(`/leaderboard/me?${qs.toString()}`)
}
