import { notFound } from 'next/navigation'

/** Scoped under /admin — mirrors (platform)/leaderboard's catch-all. */
export default function AdminCatchAll(): never {
  notFound()
}
