'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { hoverLift, cascadeContainer, cascadeItem } from '@/lib/motion/variants'

const FE_TECH = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Testing', 'Performance']
const BE_TECH = ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'REST', 'GraphQL', 'Auth', 'System Design']

function TrackCard({
  trackName,
  href,
  icon,
  accent,
  description,
  tech,
}: {
  trackName: string
  href: string
  icon: 'trackFe' | 'trackBe'
  accent: 'fe' | 'be'
  description: string
  tech: string[]
}) {
  return (
    <motion.div variants={cascadeItem} {...hoverLift}>
      <Link
        href={href}
        className="group block h-full rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-8 shadow-elev-sm transition-shadow hover:shadow-elev-md"
      >
        <div className="flex items-start justify-between">
          <FeatureIcon name={icon} size={56} />
          <ArrowRight
            size={20}
            className={
              accent === 'fe'
                ? 'text-fe -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100'
                : 'text-be -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100'
            }
          />
        </div>
        <h3 className="mt-6 font-display text-2xl font-bold text-ink">{trackName}</h3>
        <p className="mt-2 text-sm text-dim">{description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {tech.map((t) => (
            <span
              key={t}
              className="rounded-full border border-rim-subtle bg-raised px-3 py-1 text-xs font-medium text-dim"
            >
              {t}
            </span>
          ))}
        </div>

        <div
          className={
            accent === 'fe'
              ? 'mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-fe'
              : 'mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-be'
          }
        >
          Start {trackName.split(' ')[0]} track <ArrowRight size={14} />
        </div>
      </Link>
    </motion.div>
  )
}

export function TracksSection() {
  return (
    <section id="tracks" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Two tracks. Done with depth.</h2>
          <p className="mt-3 text-dim">
            No data science tangents, no Python ML detours. Razor-focused on the two
            disciplines that power the modern web stack.
          </p>
        </div>

        <motion.div
          variants={cascadeContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-6 sm:grid-cols-2"
        >
          <TrackCard
            trackName="Frontend Engineering"
            href="/fe"
            icon="trackFe"
            accent="fe"
            description="From semantic HTML to production React applications, with performance and testing built in from day one."
            tech={FE_TECH}
          />
          <TrackCard
            trackName="Backend Engineering"
            href="/be"
            icon="trackBe"
            accent="be"
            description="Build robust, scalable server-side systems — from Node fundamentals to distributed system design."
            tech={BE_TECH}
          />
        </motion.div>
      </div>
    </section>
  )
}
