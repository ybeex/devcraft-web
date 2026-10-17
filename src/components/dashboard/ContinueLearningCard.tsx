'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Lock, Sparkles } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { getSuggestions } from '@/lib/api/suggestions'
import { GOALS } from '@/components/onboarding/GoalsStep'
import { useAuthStore } from '@/stores/auth-store'
import { updateProfile } from '@/lib/api/users'
import { useState } from 'react'
import { easeOut } from '@/lib/motion/variants'

/**
 * The primary job of the dashboard (PRD §11 UX notes): the most visually dominant element.
 * What it shows comes from GET /suggestions, which ranks the learner's unfinished lessons by their goals
 * and by where the placement check started them, so the reason for each pick can be shown.
 */
export function ContinueLearningCard() {
  const track = useAuthStore((s) => s.user?.primaryTrack)
  const goalsKey = useAuthStore((s) => (s.user?.goals ?? []).join(','))
  const placedAt = useAuthStore((s) => (s.user?.primaryTrack ? s.user.placement?.[s.user.primaryTrack]?.startModuleSlug ?? null : null))

  // Changing goals or retaking the check changes the key, so the queue refreshes by itself.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['suggestions', track, goalsKey, placedAt],
    queryFn: () => getSuggestions(4),
    enabled: !!track,
  })

  const ready = useAuthStore((s) => s.hasHydrated)
  // Until the saved session is loaded the track is unknown, not missing: never flash the picker at someone who has one.
  if (!ready) return <div className="h-44 animate-pulse rounded-[var(--radius-xl)] border border-rim-subtle bg-card" />
  if (!track) return <TrackPicker />

  if (isLoading) {
    return <div className="h-44 animate-pulse rounded-[var(--radius-xl)] border border-rim-subtle bg-card" />
  }

  if (isError || !data) {
    return (
      <EmptyContinueCard
        headline="We couldn't load your next lesson"
        body="Your progress is safe. You can still pick a lesson from the curriculum."
        ctaHref={`/learn/${track.toLowerCase()}`}
        ctaLabel="Browse lessons"
      />
    )
  }

  const [next, ...rest] = data.items
  if (!next && data.lockedFrom) {
    return (
      <EmptyContinueCard
        headline="You've finished the free lessons"
        body={`The next step is ${data.lockedFrom.moduleTitle}, which is part of Pro. Meanwhile, try a project or review your interview prep.`}
        ctaHref="/pricing"
        ctaLabel="See Pro plans"
      />
    )
  }
  if (!next) {
    return (
      <EmptyContinueCard
        headline="You're all caught up"
        body="Nothing new is queued right now. Try a project or review your interview prep."
        ctaHref="/projects"
        ctaLabel="Browse projects"
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-7 shadow-elev-md"
    >
      {data.lockedFrom && <ProLockNote moduleTitle={data.lockedFrom.moduleTitle} className="relative z-10 mb-5" />}
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <FeatureIcon name={track === 'BE' ? 'trackBe' : 'trackFe'} size={52} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ghost">
              {next.status === 'IN_PROGRESS' ? 'Continue' : 'Up next'} · {next.moduleTitle}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold text-ink">{next.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-dim">
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {next.estimatedMins} min
              </span>
              <span className="capitalize">{next.difficulty.toLowerCase()}</span>
              <span className="flex items-center gap-1 font-semibold text-brand">+{next.xpReward} XP</span>
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-ink">
              <Sparkles size={12} className="text-brand" aria-hidden /> {next.reason}
            </p>
          </div>
        </div>

        <Link
          href={`/learn/${track.toLowerCase()}/${next.slug}`}
          className="btn-3d flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
        >
          {next.status === 'IN_PROGRESS' ? 'Resume' : 'Start'} <ArrowRight size={16} />
        </Link>
      </div>

      {rest.length > 0 && (
        <div className="relative z-10 mt-6 border-t border-rim-subtle pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ghost">Then</h3>
          <ul className="mt-2 grid gap-1 sm:grid-cols-3">
            {rest.map((item) => (
              <li key={item.id}>
                <Link href={`/learn/${track.toLowerCase()}/${item.slug}`} className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-brand-muted">
                  <span className="block truncate text-sm font-semibold text-ink">{item.title}</span>
                  <span className="block truncate text-xs text-dim">{item.reason}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="relative z-10 mt-4 text-xs text-dim">
        {data.basis.goals.length > 0 ? `Tailored to ${goalNames(data.basis.goals)}. ` : 'In track order. '}
        <Link href="/plan" className="font-semibold text-ink underline underline-offset-4 hover:no-underline">Adjust your plan</Link>
      </p>
    </motion.div>
  )
}

/** Shown when a free learner's next lessons are all Pro: say what is locked and why they are seeing something else. */
export function ProLockNote({ moduleTitle, className = '' }: { moduleTitle: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-3 rounded-[var(--radius-lg)] border border-rim bg-brand-muted px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p>
        <Lock size={14} className="mr-1.5 inline -translate-y-px text-brand" aria-hidden />
        You placed into <strong>{moduleTitle}</strong>, which is part of Pro. Until then, here is the free material to build on.
      </p>
      <span className="flex shrink-0 gap-4">
        <Link href="/pro" className="font-semibold text-ink underline underline-offset-4 hover:no-underline">Redeem a code</Link>
        <Link href="/pricing" className="font-semibold text-ink underline underline-offset-4 hover:no-underline">See Pro plans</Link>
      </span>
    </div>
  )
}

function goalNames(ids: string[]): string {
  return ids.map((id) => GOALS.find((g) => g.id === id)?.label.toLowerCase() ?? id).join(', ')
}

function EmptyContinueCard({
  headline,
  body,
  ctaHref,
  ctaLabel,
}: {
  headline: string
  body: string
  ctaHref: string
  ctaLabel: string
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-dashed border-rim bg-card p-7 text-center">
      <h2 className="font-display text-xl font-bold text-ink">{headline}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-dim">{body}</p>
      <Link
        href={ctaHref}
        className="btn-3d mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white"
      >
        {ctaLabel} <ArrowRight size={16} />
      </Link>
    </div>
  )
}

/**
 * Shown when no track is chosen (onboarding was skipped, or saving the choice failed). Picks the track
 * right here instead of sending a signed-in learner to the public marketing page.
 */
function TrackPicker() {
  const updateUser = useAuthStore((s) => s.updateUser)
  const [busy, setBusy] = useState<'FE' | 'BE' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function choose(track: 'FE' | 'BE') {
    setBusy(track)
    setError(null)
    try {
      updateUser(await updateProfile({ primaryTrack: track }))
    } catch {
      setError('Could not save your choice. Please try again.')
      setBusy(null)
    }
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-dashed border-rim bg-card p-7 text-center">
      <h2 className="font-display text-xl font-bold text-ink">Choose your track to get started</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-dim">Pick one and your first lesson appears here. You can explore the other track later.</p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        {(['FE', 'BE'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => choose(t)}
            disabled={busy !== null}
            className="btn-3d inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === t ? 'Saving…' : t === 'FE' ? 'Frontend' : 'Backend'} <ArrowRight size={16} />
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-error">{error}</p>}
    </div>
  )
}
