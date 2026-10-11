import { cn } from '@/lib/utils'

type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusDotProps {
  tone?: StatusTone
  label: string
  pulse?: boolean
  className?: string
}

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-success text-success',
  warning: 'bg-warning text-warning',
  error: 'bg-error text-error',
  info: 'bg-info text-info',
  neutral: 'bg-ghost text-dim',
}

/**
 * "Status is a color, not just a word" (Design Philosophy Principle III).
 * Direct lift from Oban's "● 137 active drivers" indicator.
 */
export function StatusDot({ tone = 'success', label, pulse = false, className }: StatusDotProps) {
  const cls = toneClasses[tone]
  const [bgCls, textCls] = cls.split(' ')

  return (
    <div className={cn('inline-flex items-center gap-2 text-sm font-semibold', textCls, className)}>
      <span className={cn('h-2 w-2 rounded-full', bgCls, pulse && 'animate-pulse')} />
      {label}
    </div>
  )
}
