import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ChipVariant = 'outline' | 'filled' | 'tonal'
type ChipTone = 'brand' | 'fe' | 'be' | 'success' | 'warning' | 'error' | 'info'

interface IconChipProps {
  icon: ReactNode
  label: string
  variant?: ChipVariant
  tone?: ChipTone
  className?: string
}

const toneVar: Record<ChipTone, string> = {
  brand: 'var(--brand)',
  fe: 'var(--track-fe)',
  be: 'var(--track-be)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--error)',
  info: 'var(--info)',
}

/**
 * The single most-repeated component in the design system (Design Philosophy §9).
 * A label never sits naked next to an icon — it sits inside this chip.
 * Direct lift from the Oban "Revenue" pill header and MAC IQ's colored stat squares.
 */
export function IconChip({ icon, label, variant = 'outline', tone = 'brand', className }: IconChipProps) {
  const color = toneVar[tone]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
        variant === 'outline' && 'border border-rim bg-transparent text-dim',
        variant === 'filled' && 'text-white',
        variant === 'tonal' && 'bg-[var(--chip-tonal-bg)] text-[var(--chip-tonal-fg)]',
        className
      )}
      style={
        variant === 'filled'
          ? { background: color }
          : variant === 'tonal'
            ? ({ '--chip-tonal-bg': `color-mix(in srgb, ${color} 14%, transparent)`, '--chip-tonal-fg': color } as React.CSSProperties)
            : undefined
      }
    >
      <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5 [&>img]:h-5 [&>img]:w-5">{icon}</span>
      {label}
    </div>
  )
}
