'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, TrendingUp, Compass, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Eyebrow, GradientText } from '@/components/marketing/primitives'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

export type Goal = 'job-ready' | 'level-up' | 'curious' | 'career-switch'

interface GoalsStepProps {
  selected: Goal[]
  onToggle: (goal: Goal) => void
  onContinue: () => void
}

export const GOALS = [
  { id: 'job-ready' as const, label: 'Get job-ready', icon: Briefcase },
  { id: 'level-up' as const, label: 'Level up at my job', icon: TrendingUp },
  { id: 'curious' as const, label: 'Just curious', icon: Compass },
  { id: 'career-switch' as const, label: 'Switch careers', icon: RefreshCw },
]

/** Optional: Continue works with nothing picked, so this step never blocks anyone. */
export function GoalsStep({ selected, onToggle, onContinue }: GoalsStepProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  // Land keyboard and screen-reader focus on the new step's heading when it appears.
  useEffect(() => { heading.current?.focus() }, [])
  return (
    <div className="flex flex-col items-center text-center">
      <Eyebrow>Step 2 · Your goals</Eyebrow>
      <h1 ref={heading} tabIndex={-1} className="mt-5 font-display text-3xl font-bold sm:text-4xl">
        What <GradientText>brings you</GradientText> here?
      </h1>
      <p className="mt-3 max-w-sm text-dim">Pick any that fit. We use it to decide which lessons come first. You can change it later.</p>

      <motion.div
        variants={cascadeContainer}
        initial="initial"
        animate="animate"
        role="group"
        aria-label="Your goals"
        className="mt-9 flex w-full max-w-sm flex-wrap justify-center gap-3"
      >
        {GOALS.map(({ id, label, icon: Icon }) => {
          const on = selected.includes(id)
          return (
            <motion.button
              key={id}
              type="button"
              aria-pressed={on}
              variants={cascadeItem}
              onClick={() => onToggle(id)}
              className={cn(
                'pill-pop flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium',
                on
                  ? 'glow-brand border-brand/50 bg-brand-muted text-ink'
                  : 'border-rim-subtle bg-card text-dim hover:border-brand/30 hover:text-ink'
              )}
            >
              {on ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}
              {label}
            </motion.button>
          )
        })}
      </motion.div>

      <Button onClick={onContinue} className="shine glow-brand mt-9 w-full max-w-xs justify-center">
        {selected.length === 0 ? 'Skip this question' : 'Continue'}
      </Button>
    </div>
  )
}
