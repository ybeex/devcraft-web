'use client'

import type { ReactNode } from 'react'
import { useCountUp } from '@/lib/hooks/useCountUp'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  icon: ReactNode
  value: number
  label: string
  sublabel?: string
  suffix?: string
  /** Tints the icon well — used for Pending Conflicts when count > 0 so it reads as needing attention, not just informational. */
  tone?: 'default' | 'warning'
}

/** Same visual shape as dashboard/StatsGrid's StatCard, kept local since that one isn't exported. */
export function KpiCard({ icon, value, label, sublabel, suffix = '', tone = 'default' }: KpiCardProps) {
  const animated = useCountUp(value)

  return (
    <div className="flex items-center gap-3.5 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4 shadow-elev-sm">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
          tone === 'warning' ? 'bg-error/10 text-error' : 'bg-raised text-brand'
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-ink">
          {animated.toLocaleString()}
          {suffix}
        </p>
        <p className="truncate text-xs text-dim">{label}</p>
        {sublabel && <p className="truncate text-[11px] text-ghost">{sublabel}</p>}
      </div>
    </div>
  )
}
