'use client'

import { motion } from 'framer-motion'
import { BookOpen, Hammer, BadgeCheck } from 'lucide-react'
import { GradientText, RevealGroup, RevealItem, SectionHeading } from './primitives'

const STEPS = [
  {
    icon: BookOpen,
    step: '01',
    title: 'Learn the fundamentals',
    body: 'Guided lessons in a real editor, with an AI tutor that explains the why — never just handing you the answer.',
  },
  {
    icon: Hammer,
    step: '02',
    title: 'Build real projects',
    body: 'Every module ends in a portfolio-ready capstone, reviewed the way a senior engineer would review it.',
  },
  {
    icon: BadgeCheck,
    step: '03',
    title: 'Prove your skill',
    body: 'Earn verified certificates, publish a public portfolio, and rehearse with AI mock interviews.',
  },
]

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From zero to shipped, <GradientText>in three moves.</GradientText>
            </>
          }
          subtitle="A loop built for momentum: understand it, build it, prove it. Then repeat with something harder."
        />

        <RevealGroup className="relative mt-16 grid gap-8 sm:grid-cols-3" stagger={0.14}>
          {/* connecting gradient rail */}
          <div
            aria-hidden
            className="divider-glow absolute left-[16%] right-[16%] top-7 hidden sm:block"
          />
          {STEPS.map((step) => (
            <RevealItem key={step.step} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-rim-subtle bg-canvas shadow-elev-md">
                <span aria-hidden className="absolute inset-0 rounded-2xl bg-[radial-gradient(60%_60%_at_50%_0%,var(--glow),transparent_75%)] opacity-70" />
                <step.icon size={24} className="relative text-brand" />
              </div>
              <span className="mt-5 font-mono text-xs font-semibold tracking-widest text-ghost">{step.step}</span>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-dim">{step.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-14 max-w-lg text-center text-sm text-ghost"
        >
          The whole loop is designed so you never spend two sessions wondering what to build next.
        </motion.p>
      </div>
    </section>
  )
}
