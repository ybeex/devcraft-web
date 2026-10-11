'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem, hoverLift } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface TrackSelectStepProps {
  selected: 'FE' | 'BE' | null
  onSelect: (track: 'FE' | 'BE') => void
  onContinue: () => void
}

const TRACKS = [
  { id: 'FE' as const, icon: 'trackFe' as const, name: 'Frontend', desc: 'Interfaces people love using. HTML to production React.' },
  { id: 'BE' as const, icon: 'trackBe' as const, name: 'Backend', desc: 'Systems that scale. APIs, databases, infrastructure.' },
]

/** Choosing a card only selects it; Continue confirms. A stray tap used to commit the choice and move on. */
export function TrackSelectStep({ selected, onSelect, onContinue }: TrackSelectStepProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  // Land keyboard and screen-reader focus on the new step's heading when it appears.
  useEffect(() => { heading.current?.focus() }, [])
  return (
    <div className="flex flex-col items-center text-center">
      <h1 ref={heading} tabIndex={-1} className="font-display text-3xl font-bold sm:text-4xl">Which craft calls to you?</h1>
      <p className="mt-3 max-w-sm text-white/90">Pick a track to start. You can explore the other one later.</p>

      <motion.div variants={cascadeContainer} initial="initial" animate="animate" role="radiogroup" aria-label="Track" className="mt-10 grid w-full max-w-md gap-4 sm:grid-cols-2">
        {TRACKS.map((track) => {
          const on = selected === track.id
          return (
            <motion.button
              key={track.id}
              type="button"
              role="radio"
              aria-checked={on}
              variants={cascadeItem}
              {...hoverLift}
              onClick={() => onSelect(track.id)}
              className={cn(
                'relative flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border p-6 backdrop-blur-sm transition-colors',
                on ? 'border-white bg-white/25' : 'border-white/30 bg-white/10 hover:bg-white/15',
              )}
            >
              {on && <Check size={18} className="absolute right-3 top-3 text-white" aria-hidden />}
              <FeatureIcon name={track.icon} size={56} />
              <span className="font-ui text-lg font-bold">{track.name}</span>
              <span className="text-sm text-white/90">{track.desc}</span>
            </motion.button>
          )
        })}
      </motion.div>

      <Button onClick={onContinue} disabled={!selected} className="mt-10 w-full max-w-xs justify-center">Continue</Button>
    </div>
  )
}
