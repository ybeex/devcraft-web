'use client'

import { motion } from 'framer-motion'
import { FeatureIcon, type FeatureIconName } from '@/components/brand/FeatureIcon'
import { cascadeContainer, cascadeItem, hoverLift } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface Feature {
  icon: FeatureIconName
  title: string
  description: string
  large?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: 'aiTutor',
    title: 'AI tutor that teaches, not just answers',
    description:
      'Socratic-method hints, plain-English error explanations, and structured code review — context-aware to the exact lesson and line you\'re stuck on.',
    large: true,
  },
  {
    icon: 'codeWindow',
    title: 'Real Monaco editor',
    description: 'The same engine as VS Code, right in your browser.',
  },
  {
    icon: 'projectRocket',
    title: 'Ship real projects',
    description: 'Every module ends in a portfolio-ready capstone.',
  },
  {
    icon: 'certificate',
    title: 'Verified certificates',
    description: 'Public, employer-checkable completion proof.',
  },
  {
    icon: 'community',
    title: 'Built-in community',
    description: 'Q&A, showcases, and peer review — not a Discord link.',
  },
]

export function FeatureBento() {
  return (
    <section className="bg-card px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Everything a serious platform needs. Nothing it doesn't.
          </h2>
        </div>

        <motion.div
          variants={cascadeContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={cascadeItem}
              {...hoverLift}
              className={cn(
                'rounded-[var(--radius-xl)] border border-rim-subtle bg-canvas p-7 shadow-elev-sm transition-shadow hover:shadow-elev-md',
                f.large && 'sm:col-span-2 lg:row-span-2 lg:col-span-1'
              )}
            >
              <FeatureIcon name={f.icon} size={f.large ? 64 : 48} />
              <h3 className={cn('mt-5 font-ui font-bold text-ink', f.large ? 'text-xl' : 'text-base')}>
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-dim">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
