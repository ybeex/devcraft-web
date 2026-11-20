'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { BrandedLoader } from '@/components/brand/BrandedLoader'
import { OnboardingProgress } from './OnboardingProgress'
import { TrackSelectStep } from './TrackSelectStep'
import { GoalsStep, type Goal } from './GoalsStep'
import { LevelStep } from './LevelStep'
import { MeetTutorStep } from './MeetTutorStep'
import { useAuthStore } from '@/stores/auth-store'
import { updateProfile } from '@/lib/api/users'
import { easeOut, pageTransition } from '@/lib/motion/variants'

const TOTAL_STEPS = 4

/**
 * The ambient wash behind the panel adopts the chosen track's discipline colour
 * (the same --track-fe / --track-be the marketing cards use). Picking a track
 * becomes a visible mood shift rather than a hard gradient swap, and it stays
 * theme-aware because it reads the runtime tokens rather than hard-coded hexes.
 */
function sceneGlow(track: 'FE' | 'BE' | null): string {
  const c = track === 'BE' ? 'var(--track-be)' : 'var(--track-fe)'
  return `radial-gradient(circle, color-mix(in srgb, ${c} 26%, transparent) 0%, transparent 68%)`
}

function trackFromParam(value: string | null): 'FE' | 'BE' | null {
  const v = value?.toLowerCase()
  return v === 'fe' ? 'FE' : v === 'be' ? 'BE' : null
}

const CHROME_BUTTON =
  'inline-flex items-center gap-1.5 rounded-full border border-rim-subtle bg-card/60 px-3.5 py-2 text-sm font-medium text-dim backdrop-blur transition-colors hover:border-brand/40 hover:text-ink'

export function OnboardingFlow() {
  const router = useRouter()
  const params = useSearchParams()
  const { hasHydrated, accessToken, user } = useAuthStore()
  const updateUser = useAuthStore((s) => s.updateUser)

  // A visitor who clicked "Start Backend track" on the marketing page has already chosen: skip that question.
  const fromMarketing = trackFromParam(params.get('track'))
  const [step, setStep] = useState(fromMarketing ? 1 : 0)
  const [selectedTrack, setSelectedTrack] = useState<'FE' | 'BE' | null>(fromMarketing)
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([])
  const [startModuleTitle, setStartModuleTitle] = useState<string | null>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No session: send them to log in. Already onboarded (finished or skipped): this flow is not shown again.
  useEffect(() => {
    if (!hasHydrated) return
    if (!accessToken) router.replace('/login')
    else if (user?.onboardedAt) router.replace('/dashboard')
  }, [hasHydrated, accessToken, user?.onboardedAt, router])

  /**
   * Record the track the moment it is known (picked in step 1, or carried from the marketing page) rather
   * than only at the very end. Closing the tab half way, or a failed final save, no longer leaves the
   * learner on a dashboard that asks for a track they already chose. Best effort: the final save repeats it.
   */
  const persistedTrack = useRef<string | null>(null)
  function persistTrack(track: 'FE' | 'BE') {
    if (persistedTrack.current === track) return
    persistedTrack.current = track
    updateProfile({ primaryTrack: track }).then(updateUser).catch(() => { persistedTrack.current = null })
  }
  useEffect(() => {
    if (hasHydrated && accessToken && fromMarketing && !user?.primaryTrack) persistTrack(fromMarketing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, accessToken])

  function toggleGoal(goal: Goal) {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  /** Save what was chosen and mark the flow done. On failure the learner is told, and can retry or go on. */
  async function save(): Promise<boolean> {
    try {
      const updated = await updateProfile({
        ...(selectedTrack && { primaryTrack: selectedTrack }),
        ...(selectedGoals.length > 0 && { goals: selectedGoals }),
        onboardingCompleted: true,
      })
      updateUser(updated) // without this the dashboard still thinks no track was chosen
      return true
    } catch {
      return false
    }
  }

  async function handleFinish() {
    setIsFinishing(true)
    setError(null)
    if (await save()) router.push('/dashboard')
    else {
      setError("We couldn't save your choices. Check your connection and try again. You can also pick a track from the dashboard.")
      setIsFinishing(false)
    }
  }

  /** Leave without finishing. A try is made to record that the flow was seen, but it never blocks leaving. */
  async function handleSkip() {
    await updateProfile({ onboardingCompleted: true }).then(updateUser).catch(() => undefined)
    router.push('/dashboard')
  }

  if (!hasHydrated || !accessToken || user?.onboardedAt) return <BrandedLoader />

  return (
    <div className="aurora aurora-animate grain relative flex min-h-screen flex-col overflow-hidden">
      {/* hairline grid, radially masked for depth — the same structure cue the marketing pages use */}
      <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-50" />

      {/* ambient wash, tinted to the chosen track */}
      <AnimatePresence>
        <motion.div
          key={selectedTrack ?? 'brand'}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: sceneGlow(selectedTrack) }}
        />
      </AnimatePresence>

      {/* brand watermark */}
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-16 hidden opacity-[0.06] lg:block">
        <DevCraftMark size={420} animate="wobble" />
      </div>

      {/* Top chrome: back · progress · skip */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <div className="flex w-[6rem] items-center">
          {step > 0 && (
            <button
              type="button"
              onClick={() => { setError(null); setStep((s) => (s === 3 && !selectedTrack ? 1 : s - 1)) }}
              className={CHROME_BUTTON}
            >
              <ArrowLeft size={15} aria-hidden /> Back
            </button>
          )}
        </div>
        <OnboardingProgress step={step} total={TOTAL_STEPS} />
        <div className="flex w-[6rem] items-center justify-end">
          {step < 3 && (
            <button type="button" onClick={handleSkip} className={CHROME_BUTTON}>
              Skip
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16">
        <div className="ring-gradient relative flex min-h-[26rem] w-full max-w-xl flex-col justify-center overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-card/70 p-8 shadow-elev-lg backdrop-blur-xl sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={pageTransition('forward')}
              initial="initial"
              animate="animate"
              exit="exit"
              className="[&_h1]:outline-none"
            >
              {step === 0 && (
                <TrackSelectStep selected={selectedTrack} onSelect={(t) => { setSelectedTrack(t); persistTrack(t) }} onContinue={() => setStep(1)} />
              )}
              {step === 1 && <GoalsStep selected={selectedGoals} onToggle={toggleGoal} onContinue={() => setStep(selectedTrack ? 2 : 3)} />}
              {step === 2 && selectedTrack && (
                <LevelStep
                  track={selectedTrack}
                  onDone={(r) => { setStartModuleTitle(r.startModule?.title ?? null); setStep(3) }}
                  onLater={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <MeetTutorStep
                  track={selectedTrack}
                  startModuleTitle={startModuleTitle}
                  emailVerified={user?.emailVerified}
                  email={user?.email}
                  isFinishing={isFinishing}
                  error={error}
                  onFinish={handleFinish}
                  onSkipSaving={() => router.push('/dashboard')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
