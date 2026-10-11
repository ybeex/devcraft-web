import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** Consistent boxed-panel chrome for every Overview dashboard section. */
export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <section className={cn('rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm sm:p-6', className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-dim">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
