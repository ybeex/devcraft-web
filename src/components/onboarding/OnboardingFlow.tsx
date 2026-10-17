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
import { pageTransition } from '@/lib/motion/variants'

// Every stop is dark enough for white text to reach WCAG AA (4.5:1) with margin.
const BRAND_GRADIENT = 'linear-gradient(160deg, #8a5a2b 0%, #6b4226 55%, #4a2d1a 100%)'
const FE_GRADIENT = 'linear-gradient(160deg, #92400e 0%, #78350f 55%, #4a2208 100%)'
const BE_GRADIENT = 'linear-gradient(160deg, #6d28d9 0%, #5b21b6 55%, #3b1478 100%)'

function gradientFor(step: number, track: 'FE' | 'BE' | null): string {
  if (step === 0 || !track) return BRAND_GRADIENT
  return track === 'BE' ? BE_GRADIENT : FE_GRADIENT
}

function trackFromParam(value: string | null): 'FE' | 'BE' | null {
  const v = value?.toLowerCase()
  return v === 'fe' ? 'FE' : v === 'be' ? 'BE' : null
}

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
    <div className="onboarding-scene relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12 text-white">
      <div className="fixed inset-0 -z-10">
        <AnimatePresence>
          <motion.div
            key={gradientFor(step, selectedTrack)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
            style={{ background: gradientFor(step, selectedTrack) }}
          />
        </AnimatePresence>
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.14 }} transition={{ duration: 0.8 }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <DevCraftMark size={420} animate="wobble" />
          </motion.div>
        )}
      </div>

      <div className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-6 sm:px-10">
        {step > 0 ? (
          <button type="button" onClick={() => { setError(null); setStep((s) => (s === 3 && !selectedTrack ? 1 : s - 1)) }} className="flex items-center gap-1.5 text-sm font-medium text-white/90 underline-offset-4 hover:text-white hover:underline">
            <ArrowLeft size={16} aria-hidden /> Back
          </button>
        ) : (
          <span />
        )}
        <OnboardingProgress step={step} total={4} />
        {step < 3 ? (
          <button type="button" onClick={handleSkip} className="text-sm font-medium text-white/90 underline-offset-4 hover:text-white hover:underline">
            Skip for now
          </button>
        ) : (
          <span className="w-[5.5rem]" />
        )}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div key={step} variants={pageTransition('forward')} initial="initial" animate="animate" exit="exit" className="[&_h1]:outline-none">
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
    </div>
  )
}
