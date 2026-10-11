import { notFound } from 'next/navigation'

/** Scoped under /leaderboard — mirrors (platform)/dashboard's catch-all. */
export default function LeaderboardCatchAll(): never {
  notFound()
}
