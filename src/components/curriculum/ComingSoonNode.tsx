'use client'

import { Hourglass, Clock } from 'lucide-react'
import type { ComingSoonModule } from '@/lib/api/curriculum'

/**
 * A module of the learning path that is planned but not available yet. It is deliberately NOT a button: there is
 * nothing to open, so it must not look or behave like something clickable. It tells the learner what is coming and
 * what they will be able to do, so the path reads as one journey rather than a list with holes in it.
 */
export function ComingSoonNode({ module }: { module: ComingSoonModule }) {
  const outcomes = module.outcomes.slice(0, 3)
  return (
    <div
      role="group"
      aria-label={`${module.title}, coming soon`}
      data-testid="coming-soon-module"
      data-slug={module.slug}
      className="flex w-full items-start gap-4 rounded-[var(--radius-xl)] border border-dashed border-rim-subtle bg-card/60 p-5 text-left"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-raised text-ghost" aria-hidden>
        <Hourglass size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-ui text-base font-bold text-dim">{module.title}</h3>
          <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-dim">Coming soon</span>
          {module.isPremium && (
            <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">Pro</span>
          )}
        </div>
        <p className="mt-1 text-sm text-dim">{module.description}</p>
        {outcomes.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-dim">
            {outcomes.map((o) => <li key={o}>{o}</li>)}
          </ul>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-dim">
          <span className="flex items-center gap-1"><Clock size={12} aria-hidden /> about {module.estimatedHours}h</span>
          <span>Not available yet</span>
        </div>
      </div>
    </div>
  )
}
