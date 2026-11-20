'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import { RevealItem, RevealGroup, SectionHeading, SpotlightCard, GradientText } from './primitives'
import { cn } from '@/lib/utils'

const FE_TECH = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js']
const BE_TECH = ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'REST', 'System Design']

const TRACKS = [
  {
    name: 'Frontend Engineering',
    href: '/fe',
    icon: 'trackFe' as const,
    accent: 'fe' as const,
    tagline: 'Interface craft, from markup to production React.',
    description:
      'From semantic HTML to production React applications, with performance and testing built in from day one.',
    outcomes: ['Accessible component systems', 'Data-driven React apps', 'Web performance audits'],
    tech: FE_TECH,
  },
  {
    name: 'Backend Engineering',
    href: '/be',
    icon: 'trackBe' as const,
    accent: 'be' as const,
    tagline: 'Server-side systems that hold up under load.',
    description:
      'Build robust, scalable server-side systems — from Node fundamentals to distributed system design.',
    outcomes: ['REST + GraphQL APIs', 'Relational data modelling', 'Auth, caching & system design'],
    tech: BE_TECH,
  },
]

export function TracksSection() {
  return (
    <section id="tracks" className="relative overflow-hidden px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Two disciplines, zero filler"
          title={
            <>
              Two tracks. <GradientText>Done with depth.</GradientText>
            </>
          }
          subtitle="No data-science tangents, no ML detours. Razor-focused on the two disciplines that power the modern web."
        />

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2" stagger={0.12}>
          {TRACKS.map((track) => (
            <RevealItem key={track.name} className="h-full">
              <SpotlightCard accent={track.accent} className="h-full p-8">
                <div
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-[var(--radius-xl)] opacity-70',
                    track.accent === 'fe'
                      ? 'bg-[radial-gradient(80%_100%_at_20%_0%,rgba(255,121,0,.16),transparent_70%)]'
                      : 'bg-[radial-gradient(80%_100%_at_20%_0%,rgba(57,133,255,.16),transparent_70%)]'
                  )}
                />
                <div className="relative flex items-start justify-between">
                  <FeatureIcon name={track.icon} size={60} />
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                      track.accent === 'fe'
                        ? 'border-fe/30 bg-[rgba(255,121,0,.1)] text-fe'
                        : 'border-be/30 bg-[rgba(57,133,255,.1)] text-be'
                    )}
                  >
                    {track.accent === 'fe' ? 'UI & React' : 'APIs & Scale'}
                  </span>
                </div>

                <h3 className="relative mt-6 font-display text-2xl font-bold text-ink">{track.name}</h3>
                <p
                  className={cn(
                    'relative mt-1 text-sm font-semibold',
                    track.accent === 'fe' ? 'text-fe' : 'text-be'
                  )}
                >
                  {track.tagline}
                </p>
                <p className="relative mt-3 text-sm text-dim">{track.description}</p>

                <ul className="relative mt-6 flex flex-col gap-2">
                  {track.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-center gap-2 text-sm text-ink">
                      <ArrowRight
                        size={14}
                        className={track.accent === 'fe' ? 'text-fe' : 'text-be'}
                      />
                      {outcome}
                    </li>
                  ))}
                </ul>

                <div className="relative mt-6 flex flex-wrap gap-2">
                  {track.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-rim-subtle bg-raised px-3 py-1 text-xs font-medium text-dim"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div
                  className={cn(
                    'relative mt-8 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1',
                    track.accent === 'fe' ? 'text-fe' : 'text-be'
                  )}
                >
                  Start the {track.name.split(' ')[0]} track <ArrowRight size={14} />
                </div>

                <Link href={track.href} className="absolute inset-0 z-[2]" aria-label={`Go to ${track.name}`} />
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
