'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { Button } from '@/components/ui/Button'
import { Eyebrow, GradientText, SpotlightCard } from '@/components/marketing/primitives'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface TrackSelectStepProps {
  selected: 'FE' | 'BE' | null
  onSelect: (track: 'FE' | 'BE') => void
  onContinue: () => void
}

// Each card glows in its own track's discipline colour — Frontend stays orange,
// Backend goes blue — so the choice is legible before the copy is read.
const TRACKS = [
  { id: 'FE' as const, icon: 'trackFe' as const, accent: 'fe' as const, name: 'Frontend', desc: 'Interfaces people love using. HTML to production React.' },
  { id: 'BE' as const, icon: 'trackBe' as const, accent: 'be' as const, name: 'Backend', desc: 'Systems that scale. APIs, databases, infrastructure.' },
]

/** Choosing a card only selects it; Continue confirms. A stray tap used to commit the choice and move on. */
export function TrackSelectStep({ selected, onSelect, onContinue }: TrackSelectStepProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  // Land keyboard and screen-reader focus on the new step's heading when it appears.
  useEffect(() => { heading.current?.focus() }, [])
  return (
    <div className="flex flex-col items-center text-center">
      <Eyebrow>Step 1 · Pick your track</Eyebrow>
      <h1 ref={heading} tabIndex={-1} className="mt-5 font-display text-3xl font-bold sm:text-4xl">
        Which <GradientText>craft</GradientText> calls to you?
      </h1>
      <p className="mt-3 max-w-sm text-dim">Pick a track to start. You can explore the other one later.</p>

      <motion.div
        variants={cascadeContainer}
        initial="initial"
        animate="animate"
        role="radiogroup"
        aria-label="Track"
        className="mt-9 grid w-full gap-4 sm:grid-cols-2"
      >
        {TRACKS.map((track) => {
          const on = selected === track.id
          return (
            <motion.div key={track.id} variants={cascadeItem}>
              <SpotlightCard accent={track.accent} className={cn('h-full p-0', on && 'glow-brand')}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onSelect(track.id)}
                  className="relative flex h-full w-full flex-col items-center gap-3 rounded-[var(--radius-xl)] p-6 text-center"
                >
                  {on && (
                    <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-brand text-[#080d1c] shadow-elev-sm">
                      <Check size={14} aria-hidden />
                    </span>
                  )}
                  <span className={cn('transition-transform duration-300', on && 'scale-110')}>
                    <FeatureIcon name={track.icon} size={56} />
                  </span>
                  <span className="font-ui text-lg font-bold text-ink">{track.name}</span>
                  <span className="text-sm text-dim">{track.desc}</span>
                </button>
              </SpotlightCard>
            </motion.div>
          )
        })}
      </motion.div>

      <Button onClick={onContinue} disabled={!selected} className="shine glow-brand mt-9 w-full max-w-xs justify-center">
        Continue
      </Button>
    </div>
  )
}
