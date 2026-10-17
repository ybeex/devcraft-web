'use client'

import { useQuery } from '@tanstack/react-query'
import { getJourney, type JourneyStep } from '@/lib/api/admin-analytics'
import { SectionCard } from './SectionCard'
import { Skeleton } from '@/components/ui/Skeleton'

function Steps({ title, steps, testId }: { title: string; steps: JourneyStep[]; testId: string }) {
  const max = Math.max(1, ...steps.map((s) => s.count))
  return (
    <div data-testid={testId}>
      <h3 className="mb-3 font-ui text-xs font-semibold uppercase tracking-wide text-dim">{title}</h3>
      <ul className="flex flex-col gap-2.5">
        {steps.map((s) => (
          <li key={s.key} data-step={s.key}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink">{s.label}</span>
              <span className="tabular-nums text-dim">
                <strong className="text-ink">{s.count.toLocaleString()}</strong>
                {s.rate !== null && <> · {Math.round(s.rate * 100)}%</>}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-raised" aria-hidden>
              <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${(s.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Onboarding, placement and Pro funnels for the learners who signed up in the window. */
export function JourneySection({ days }: { days: number }) {
  const { data, isLoading } = useQuery({ queryKey: ['an-journey', days], queryFn: () => getJourney(days) })
  return (
    <SectionCard
      title="Learner journey"
      description={`Learners who signed up in the last ${days} days${data ? ` (${data.cohort.toLocaleString()})` : ''}. Percentages are of signups, except placement (of those who started) and Pro steps (of trials started).`}
    >
      {isLoading || !data ? (
        <Skeleton className="h-[260px] w-full rounded-[var(--radius-md)]" />
      ) : data.cohort === 0 ? (
        <p className="py-6 text-center text-sm text-dim">Nobody signed up in this window. Try a wider date range.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <Steps title="Onboarding and placement" steps={data.onboarding} testId="journey-onboarding" />
          <Steps title="Pro" steps={data.pro} testId="journey-pro" />
        </div>
      )}
    </SectionCard>
  )
}
