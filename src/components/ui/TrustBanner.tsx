import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TrustBannerProps {
  icon: ReactNode
  tone?: 'success' | 'info'
  children: ReactNode
  className?: string
}

/** Tonal banner with shield icon — lift from the booking-flow trust banner reference. */
export function TrustBanner({ icon, tone = 'success', children, className }: TrustBannerProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-medium',
        tone === 'success' && 'bg-[var(--positive-bg)] text-[var(--positive-text)]',
        tone === 'info' && 'bg-brand-muted text-brand',
        className
      )}
    >
      <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      {children}
    </div>
  )
}

interface GuidanceCardProps {
  icon: ReactNode
  title: string
  body: string
  className?: string
}

/**
 * "What's next?" guidance card — used after project submission, certificate
 * issuance, track completion, mock interview results. Direct lift from the
 * Laura Keen Kitchens booking-flow reference.
 */
export function GuidanceCard({ icon, title, body, className }: GuidanceCardProps) {
  return (
    <div className={cn('flex items-start gap-4 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5', className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-raised">
        {icon}
      </div>
      <div>
        <h4 className="font-ui text-base font-semibold text-ink">{title}</h4>
        <p className="mt-1 text-sm text-dim">{body}</p>
      </div>
    </div>
  )
}
