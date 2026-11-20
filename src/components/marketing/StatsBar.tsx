'use client'

import { AnimatedStat, RevealGroup, RevealItem } from './primitives'
import { cn } from '@/lib/utils'

const STATS = [
  { value: 12400, suffix: '+', label: 'Learners', decimals: 0, divisor: 1 },
  { value: 200, suffix: '+', label: 'Lessons shipped', decimals: 0, divisor: 1 },
  { value: 48, suffix: '', label: 'Real-world projects', decimals: 0, divisor: 1 },
  { value: 49, suffix: '/5', label: 'Average rating', decimals: 1, divisor: 10 },
]

export function StatsBar() {
  return (
    <section className="relative overflow-hidden border-y border-rim-subtle bg-card/60 px-6 py-14">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
      <RevealGroup className="relative mx-auto grid max-w-5xl grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0">
        {STATS.map((stat, i) => (
          <RevealItem
            key={stat.label}
            className={cn(
              'px-4',
              // Mobile (2-up): divide the two columns. Desktop: a single linear row.
              (i === 1 || i === 3) && 'border-l border-rim-subtle',
              i !== 0 && 'sm:border-l sm:border-rim-subtle',
              i === 0 && 'sm:border-l-0'
            )}
          >
            <AnimatedStat
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              decimals={stat.decimals}
              divisor={stat.divisor}
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}
