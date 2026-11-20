'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Flame, BookOpen, Sparkles, AlertCircle } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Button } from '@/components/ui/Button'
import { Eyebrow, GradientText } from '@/components/marketing/primitives'
import { easeOut } from '@/lib/motion/variants'

interface MeetTutorStepProps {
  track: 'FE' | 'BE' | null
  /** Title of the module the placement check chose, when the learner took it. */
  startModuleTitle?: string | null
  emailVerified: boolean | undefined
  email: string | undefined
  isFinishing: boolean
  error: string | null
  onFinish: () => void
  onSkipSaving: () => void
}

export function MeetTutorStep({ track, startModuleTitle, emailVerified, email, isFinishing, error, onFinish, onSkipSaving }: MeetTutorStepProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  // Land keyboard and screen-reader focus on the new step's heading when it appears.
  useEffect(() => { heading.current?.focus() }, [])
  const trackLabel = track === 'BE' ? 'Backend' : 'Frontend'
  // Only claim what is true: the first lesson exists, a streak starts with the first lesson, and AI hints need a verified address.
  const pills = [
    { icon: BookOpen, label: startModuleTitle ? `You start at ${startModuleTitle}` : `Your first ${trackLabel} lesson is ready` },
    { icon: Flame, label: 'Your streak starts with lesson one' },
    { icon: Sparkles, label: emailVerified === false ? 'AI hints unlock when you verify your email' : 'AI hints are ready' },
  ]

  return (
    <div className="flex flex-col items-center text-center">
      <Eyebrow>Step 4 · Meet your tutor</Eyebrow>

      <div className="mt-6 flex flex-col items-center gap-4">
        <FeatureIcon name="aiTutor" size={72} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: easeOut }}
          className="ring-gradient w-full max-w-xs rounded-2xl rounded-tl-sm border border-rim-subtle bg-card p-3.5 text-left shadow-elev-md"
        >
          <p className="text-sm font-medium text-ink">Hi! I&apos;m your AI tutor. When you&apos;re stuck, I&apos;ll nudge you toward the answer instead of handing it over.</p>
        </motion.div>
      </div>

      <h1 ref={heading} tabIndex={-1} className="mt-8 font-display text-3xl font-bold sm:text-4xl">
        Just ask. <GradientText>I&apos;ll help.</GradientText>
      </h1>
      <p className="mt-3 max-w-sm text-dim">Hints, not answers: that&apos;s how it sticks.</p>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } }}
        className="mt-7 flex w-full max-w-md flex-col gap-2.5 text-left"
      >
        {pills.map(({ icon: Icon, label }) => (
          <motion.div
            key={label}
            variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
            className="ring-gradient flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-4 py-3 text-sm font-medium text-ink"
          >
            <Icon size={16} className="shrink-0 text-[var(--brand)]" aria-hidden />
            {label}
          </motion.div>
        ))}
      </motion.div>

      {emailVerified === false && email && (
        <p className="mt-4 max-w-sm text-sm text-dim">We sent a verification link to {email}.</p>
      )}

      {error && (
        <div role="alert" className="mt-6 flex w-full max-w-sm items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--negative-bg)] bg-[var(--negative-bg)] px-4 py-3 text-left text-sm font-medium text-[var(--negative-text)]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <Button onClick={onFinish} disabled={isFinishing} className="shine glow-brand mt-8 w-full max-w-xs justify-center">
        {isFinishing ? 'Setting up…' : error ? 'Try again' : 'Start learning'}
      </Button>
      {error && (
        <button type="button" onClick={onSkipSaving} className="mt-3 text-sm font-medium text-dim underline underline-offset-4 hover:text-ink hover:no-underline">
          Continue without saving
        </button>
      )}
    </div>
  )
}
