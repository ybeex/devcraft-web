'use client'

import { motion } from 'framer-motion'
import { FeatureIcon, type FeatureIconName } from '@/components/brand/FeatureIcon'
import { GradientText, RevealGroup, RevealItem, SectionHeading, SpotlightCard } from './primitives'
import { cn } from '@/lib/utils'

interface Feature {
  icon: FeatureIconName
  title: string
  description: string
  span?: string
}

const FEATURES: Feature[] = [
  {
    icon: 'aiTutor',
    title: 'An AI tutor that teaches, not just answers',
    description:
      'Socratic-method hints, plain-English error explanations, and structured code review — context-aware to the exact lesson and line you are stuck on.',
    span: 'lg:col-span-2',
  },
  {
    icon: 'codeWindow',
    title: 'A real Monaco editor',
    description: 'The same engine as VS Code, running right in your browser.',
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
    title: 'A built-in community',
    description: 'Q&A, showcases, and peer review — not a Discord link.',
  },
]

const TUTOR_EXCHANGE = {
  question: 'My useEffect runs twice in dev — is that a bug?',
  hint:
    "Great instinct to question it. Which part runs twice — the effect body, or the whole component? Try a console.log in both and tell me what you see.",
}

export function FeatureBento() {
  return (
    <section className="relative overflow-hidden bg-card px-6 py-24">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Everything, and nothing extra"
          title={
            <>
              Everything a serious platform needs. <GradientText>Nothing it doesn&apos;t.</GradientText>
            </>
          }
        />

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.09}>
          {FEATURES.map((feature) => (
            <RevealItem key={feature.title} className={cn('h-full', feature.span)}>
              <SpotlightCard className="h-full p-7">
                <FeatureIcon name={feature.icon} size={feature.span ? 56 : 46} />
                <h3
                  className={cn(
                    'mt-5 font-ui font-bold text-ink',
                    feature.span ? 'text-xl' : 'text-base'
                  )}
                >
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-dim">{feature.description}</p>

                {feature.icon === 'aiTutor' && <TutorPreview />}
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

function TutorPreview() {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-rim-subtle bg-canvas p-4">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--brand-muted)] px-4 py-2.5 text-sm text-ink">
        {TUTOR_EXCHANGE.question}
      </div>
      <div className="flex max-w-[92%] items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          <FeatureIcon name="aiTutor" size={26} />
        </div>
        <div className="rounded-2xl rounded-bl-sm border border-rim-subtle bg-card px-4 py-2.5 text-sm text-dim">
          {TUTOR_EXCHANGE.hint}
        </div>
      </div>
      <div className="flex items-center gap-1.5 pl-9">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-brand/60"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  )
}
