'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, TrendingUp, Compass, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
      <h1 ref={heading} tabIndex={-1} className="font-display text-3xl font-bold sm:text-4xl">What brings you here?</h1>
      <p className="mt-3 max-w-sm text-white/90">Pick any that fit. We use it to decide which lessons come first. You can change it later.</p>

      <motion.div variants={cascadeContainer} initial="initial" animate="animate" role="group" aria-label="Your goals" className="mt-10 flex w-full max-w-sm flex-wrap justify-center gap-3">
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
                'flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-colors',
                on ? 'border-white bg-white text-ink' : 'border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15',
              )}
            >
              {on ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}
              {label}
            </motion.button>
          )
        })}
      </motion.div>

      <Button onClick={onContinue} className="mt-10 w-full max-w-xs justify-center">
        {selected.length === 0 ? 'Skip this question' : 'Continue'}
      </Button>
    </div>
  )
}
