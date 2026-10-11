import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: ReactNode
  headline: string
  body: string
  action?: ReactNode
  className?: string
}

/**
 * Every empty state: icon (dimmed, from FeatureIcon with achieved=false),
 * one-line headline in UI font (not Playfair — empty states are conversational),
 * one sentence of context, and exactly one primary action.
 * Never zero actions (dead end), never more than one (decision paralysis).
 */
export function EmptyState({ icon, headline, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-16 text-center', className)}>
      <div>{icon}</div>
      <h3 className="font-ui text-lg font-semibold text-ink">{headline}</h3>
      <p className="max-w-sm text-sm text-dim">{body}</p>
      {action}
    </div>
  )
}
