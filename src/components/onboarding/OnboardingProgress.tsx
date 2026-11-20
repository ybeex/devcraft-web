import { motion } from 'framer-motion'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface OnboardingProgressProps {
  step: number
  total: number
  className?: string
}

/** Direct implementation of the OnboardingProgress spec in Design Philosophy §15, with a text alternative for screen readers. */
export function OnboardingProgress({ step, total, className }: OnboardingProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step + 1}
      aria-valuetext={`Step ${step + 1} of ${total}`}
      className={cn('flex items-center gap-1.5', className)}
    >
      {Array.from({ length: total }).map((_, i) => {
        const reached = i <= step
        return (
          <motion.span
            key={i}
            aria-hidden
            className={cn('block h-1.5 rounded-full', reached && 'glow-brand')}
            animate={{ width: i === step ? 30 : 8 }}
            transition={{ duration: 0.35, ease: easeOut }}
            style={{
              background: reached
                ? 'linear-gradient(90deg, var(--brand), var(--brand-2))'
                : 'var(--rim)',
            }}
          />
        )
      })}
    </div>
  )
}
