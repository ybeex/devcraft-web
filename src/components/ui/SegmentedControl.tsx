'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SegmentedControlProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  trailingSlot?: React.ReactNode
  className?: string
}

/** Direct lift from Oban's Today / 2D / 7D / 14D / 30D date-range control. */
export function SegmentedControl({ options, value, onChange, trailingSlot, className }: SegmentedControlProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border border-rim-subtle bg-card p-1', className)}>
      {options.map((opt) => {
        const active = opt === value
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'relative rounded-full px-4 py-2 text-sm transition-colors',
              active ? 'font-semibold text-ink' : 'text-dim hover:text-ink'
            )}
          >
            {active && (
              <motion.span
                layoutId="segmented-active"
                className="absolute inset-0 rounded-full bg-raised shadow-elev-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{opt}</span>
          </button>
        )
      })}
      {trailingSlot && <div className="ml-1 border-l border-rim-subtle pl-1">{trailingSlot}</div>}
    </div>
  )
}
