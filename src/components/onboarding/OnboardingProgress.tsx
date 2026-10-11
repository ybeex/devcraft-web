import { motion } from 'framer-motion'
import { easeOut } from '@/lib/motion/variants'

interface OnboardingProgressProps {
  step: number
  total: number
}

/** Direct implementation of the OnboardingProgress spec in Design Philosophy §15, with a text alternative for screen readers. */
export function OnboardingProgress({ step, total }: OnboardingProgressProps) {
  return (
    <div role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${total}`} className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="h-1.5 rounded-full"
          animate={{
            width: i === step ? 32 : 8,
            backgroundColor: i <= step ? '#fdfbf7' : 'rgba(255,255,255,0.4)',
          }}
          transition={{ duration: 0.3, ease: easeOut }}
        />
      ))}
    </div>
  )
}
