import Link from 'next/link'
import type { LeaderboardEntry } from '@/lib/api/leaderboard'
import { cn } from '@/lib/utils'

const MEDAL_STYLE: Record<number, string> = {
  1: 'bg-gradient-to-br from-[#FFD873] to-[#E8A93B] text-[#5C3B00]',
  2: 'bg-gradient-to-br from-[#E4E7EB] to-[#B9C0C9] text-[#3A3F47]',
  3: 'bg-gradient-to-br from-[#E3A873] to-[#B97A44] text-[#4A2E12]',
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export function LeaderboardRow({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser: boolean }) {
  const medal = MEDAL_STYLE[entry.rank]
  const trackColor = entry.primaryTrack === 'FE' ? 'var(--track-fe)' : 'var(--track-be)'

  return (
    <Link
      href={`/p/${entry.username}`}
      className={cn(
        'flex items-center gap-4 rounded-[var(--radius-lg)] border px-4 py-3 transition-colors',
        isCurrentUser ? 'border-brand bg-brand-muted' : 'border-rim-subtle bg-card hover:border-rim'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          medal ?? 'bg-raised text-dim'
        )}
      >
        {entry.rank}
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-muted text-xs font-bold text-brand">
        {entry.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatar} alt={entry.displayName} className="h-full w-full object-cover" />
        ) : (
          initials(entry.displayName)
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{entry.displayName}</p>
        <p className="truncate text-xs text-ghost">@{entry.username}</p>
      </div>

      {entry.primaryTrack && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ color: trackColor, background: `color-mix(in srgb, ${trackColor} 14%, transparent)` }}
        >
          {entry.primaryTrack}
        </span>
      )}

      <span className="shrink-0 font-ui text-sm font-bold text-brand">{entry.xp.toLocaleString()} XP</span>
    </Link>
  )
}
