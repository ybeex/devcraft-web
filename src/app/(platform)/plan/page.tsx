'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GOALS } from '@/components/onboarding/GoalsStep'
import { ProLockNote } from '@/components/dashboard/ContinueLearningCard'
import { PlacementFlow } from '@/components/placement/PlacementFlow'
import { getTrackCurriculum } from '@/lib/api/curriculum'
import { getSuggestions } from '@/lib/api/suggestions'
import { getMe, updateProfile } from '@/lib/api/users'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

type GoalId = (typeof GOALS)[number]['id']

const LEVEL_WORDS = { beginner: 'from the fundamentals', intermediate: 'a little further in', advanced: 'where it gets challenging' } as const

export default function PlanPage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const queryClient = useQueryClient()
  const track = user?.primaryTrack ?? null
  const goals = (user?.goals ?? []) as GoalId[]
  const placement = track ? user?.placement?.[track] ?? null : null

  const [saveError, setSaveError] = useState<string | null>(null)
  const [retaking, setRetaking] = useState(false)

  const { data: curriculum } = useQuery({ queryKey: ['curriculum-track', track], queryFn: () => getTrackCurriculum(track!), enabled: !!track })
  const { data: queue } = useQuery({
    queryKey: ['suggestions', track, goals.join(','), placement?.startModuleSlug ?? null, 'plan'],
    queryFn: () => getSuggestions(6),
    enabled: !!track,
  })

  const placedModule = curriculum?.modules.find((m) => m.slug === placement?.startModuleSlug)

  /** Optimistic: the chip flips at once, and flips back with a message if the server refuses. */
  async function toggleGoal(id: GoalId) {
    const next = goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id]
    const before = goals
    setSaveError(null)
    updateUser({ goals: next })
    try {
      updateUser(await updateProfile({ goals: next }))
    } catch {
      updateUser({ goals: before })
      setSaveError('We couldn’t save that change. Check your connection and try again.')
    }
  }

  async function afterRetake() {
    setRetaking(false)
    try { updateUser(await getMe()) } catch { /* the next profile sync picks it up */ }
    await queryClient.invalidateQueries({ queryKey: ['suggestions'] })
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
        <h1 className="font-display text-2xl font-bold text-ink">Your learning plan</h1>
        <p className="mt-2 text-sm text-dim">Choose a track on your dashboard first, and your plan appears here.</p>
        <Link href="/dashboard" className="btn-3d mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white">Go to dashboard <ArrowRight size={16} /></Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-8 sm:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Your learning plan</h1>
        <p className="mt-1 text-sm text-dim">Your goals and your starting point decide which lessons come first.</p>
      </div>

      <section aria-labelledby="goals-h" className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-6">
        <h2 id="goals-h" className="font-display text-lg font-bold text-ink">Your goals</h2>
        <p className="mt-1 text-sm text-dim">Pick any that fit. Changes save straight away.</p>
        <div role="group" aria-labelledby="goals-h" className="mt-4 flex flex-wrap gap-3">
          {GOALS.map(({ id, label, icon: Icon }) => {
            const on = goals.includes(id)
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => void toggleGoal(id)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors',
                  on ? 'border-ink bg-ink text-white' : 'border-rim bg-transparent text-ink hover:border-ink',
                )}
              >
                {on ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}
                {label}
              </button>
            )
          })}
        </div>
        {saveError && <p role="alert" className="mt-3 text-sm font-medium text-[var(--negative-text)]">{saveError}</p>}
      </section>

      <section aria-labelledby="start-h" className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-6">
        <h2 id="start-h" className="font-display text-lg font-bold text-ink">Where you start</h2>
        {retaking ? (
          <div className="mt-4">
            <PlacementFlow track={track} tone="app" onDone={() => void afterRetake()} doneLabel="Update my plan" />
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-dim">
              {placement
                ? `You start at ${placedModule?.title ?? 'the module we placed you in'}, ${LEVEL_WORDS[placement.level]}.`
                : 'You haven’t taken the placement check, so your lessons start at the beginning of the track.'}
            </p>
            {queue?.lockedFrom && <ProLockNote moduleTitle={queue.lockedFrom.moduleTitle} className="mt-4" />}
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setRetaking(true)}>
              {placement ? 'Retake the check' : 'Take the check'}
            </Button>
          </>
        )}
      </section>

      <section aria-labelledby="queue-h">
        <h2 id="queue-h" className="font-display text-lg font-bold text-ink">What’s queued</h2>
        {!queue ? (
          <div className="mt-3 h-32 animate-pulse rounded-[var(--radius-xl)] border border-rim-subtle bg-card" />
        ) : queue.items.length === 0 ? (
          <p className="mt-2 text-sm text-dim">Nothing is queued right now.</p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2">
            {queue.items.map((item, i) => (
              <li key={item.id}>
                <Link href={`/learn/${track.toLowerCase()}/${item.slug}`} className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-4 py-3 hover:border-rim">
                  <span aria-hidden className="w-5 text-center text-sm font-semibold text-dim">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                    <span className="block truncate text-xs text-dim">{item.reason} · {item.moduleTitle} · {item.estimatedMins} min</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-dim" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
