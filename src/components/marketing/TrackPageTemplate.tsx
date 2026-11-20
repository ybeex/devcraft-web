'use client'

import Link from 'next/link'
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FeatureIcon, type FeatureIconName } from '@/components/brand/FeatureIcon'
import {
  Eyebrow,
  GradientText,
  Reveal,
  RevealGroup,
  RevealItem,
  SectionHeading,
  SpotlightCard,
} from '@/components/marketing/primitives'

export interface TrackModule {
  title: string
  lessonCount: number
  estimatedHours: number
  isPremium?: boolean
}

export interface TrackPageData {
  accent: 'fe' | 'be'
  trackIcon: FeatureIconName
  trackName: string
  tagline: string
  description: string
  techStack: string[]
  modules: TrackModule[]
  audiences: { title: string; description: string }[]
  featuredProjectTitles: string[]
}

export function TrackPageTemplate({ data }: { data: TrackPageData }) {
  const accentClass = data.accent === 'fe' ? 'text-fe' : 'text-be'
  const accentVar = data.accent === 'fe' ? 'var(--track-fe)' : 'var(--track-be)'

  const totalLessons = data.modules.reduce((sum, m) => sum + m.lessonCount, 0)
  const totalHours = data.modules.reduce((sum, m) => sum + m.estimatedHours, 0)

  const STATS = [
    { icon: <Clock size={16} />, label: `${totalHours}+ hours` },
    { icon: <CheckCircle2 size={16} />, label: `${totalLessons} lessons` },
    { icon: <FeatureIcon name="certificate" size={16} />, label: 'Verified certificate' },
  ]

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="aurora aurora-animate grain relative overflow-hidden px-6 pb-16 pt-24">
        <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-[2] mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="relative mx-auto inline-block">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 blur-2xl"
                style={{ background: `radial-gradient(closest-side, ${accentVar}, transparent 75%)`, opacity: 0.4 }}
              />
              <span className="animate-float inline-block">
                <FeatureIcon name={data.trackIcon} size={72} />
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-7 text-balance font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
              {data.trackName}
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className={`mt-3 text-lg font-semibold ${accentClass}`}>{data.tagline}</p>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mx-auto mt-5 max-w-xl text-balance text-dim">{data.description}</p>
          </Reveal>

          <Reveal delay={0.24}>
            <div
              className="mx-auto mt-9 grid max-w-lg grid-cols-1 divide-y divide-rim-subtle overflow-hidden rounded-2xl border border-rim-subtle bg-card/70 shadow-elev-sm backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-ink">
                  <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" style={{ color: accentVar }}>
                    {stat.icon}
                  </span>
                  {stat.label}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-9">
              <Link href={`/register?track=${data.accent}`}>
                <Button size="lg" className="shine glow-brand group">
                  Start {data.trackName.split(' ')[0]} track
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Tech stack strip ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-rim-subtle bg-card px-6 py-10">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-[2] mx-auto max-w-4xl">
          <Reveal className="mb-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ghost">The tools you&apos;ll master</p>
          </Reveal>
          <RevealGroup className="flex flex-wrap items-center justify-center gap-3" stagger={0.04}>
            {data.techStack.map((tech) => (
              <RevealItem key={tech}>
                <span className="pill-pop group flex items-center gap-2 rounded-full border border-rim-subtle bg-canvas px-4 py-2 text-sm font-medium text-dim shadow-elev-sm hover:border-brand/40 hover:text-ink">
                  <span className="h-1.5 w-1.5 rounded-full transition-colors" style={{ background: accentVar, opacity: 0.6 }} />
                  {tech}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─── Curriculum tree preview ──────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Curriculum"
            title={<>From fundamentals to <GradientText>production-grade.</GradientText></>}
            subtitle={`${data.modules.length} modules, each ending in something you actually ship.`}
          />

          <RevealGroup className="relative mt-14 flex flex-col gap-3" stagger={0.07}>
            <div
              aria-hidden
              className="absolute bottom-8 left-6 top-8 w-px"
              style={{ background: `linear-gradient(to bottom, transparent, ${accentVar}, transparent)`, opacity: 0.4 }}
            />
            {data.modules.map((mod, i) => (
              <RevealItem key={mod.title} className="relative">
                <SpotlightCard accent={data.accent} className="py-4 pl-4 pr-6">
                  <div className="flex items-center gap-5">
                    <div
                      className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-elev-md"
                      style={{ background: accentVar }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-ui text-base font-semibold text-ink">{mod.title}</h3>
                        {mod.isPremium && (
                          <span className="rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                            Pro
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-dim">
                        {mod.lessonCount} lessons · {mod.estimatedHours}h
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─── Who this is for ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-rim-subtle bg-card px-6 py-24">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-[2] mx-auto max-w-5xl">
          <SectionHeading eyebrow="Audience" title="Who this track is for" />
          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-3" stagger={0.1}>
            {data.audiences.map((a) => (
              <RevealItem key={a.title} className="h-full">
                <SpotlightCard accent={data.accent} className="h-full p-6">
                  <h3 className="font-ui text-base font-semibold text-ink">{a.title}</h3>
                  <p className="mt-2 text-sm text-dim">{a.description}</p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─── Featured projects ────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="Portfolio"
            title="Featured projects"
            subtitle="Build these, ship them, put them in your portfolio."
          />

          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-3" stagger={0.1}>
            {data.featuredProjectTitles.map((title) => (
              <RevealItem key={title} className="h-full">
                <SpotlightCard accent={data.accent} className="h-full p-6 text-center">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-24"
                    style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accentVar}, transparent 75%)`, opacity: 0.14 }}
                  />
                  <FeatureIcon name="projectRocket" size={40} className="mx-auto" />
                  <h3 className="mt-4 font-ui text-sm font-semibold text-ink">{title}</h3>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-28 pt-8">
        <div
          className="aurora aurora-animate grain relative mx-auto max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle px-6 py-14 shadow-elev-lg sm:px-12 sm:py-16"
        >
          <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative z-[2] mx-auto max-w-2xl text-center">
            <Reveal>
              <Eyebrow>Free to start</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 text-balance font-display text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">
                Ready to start the <GradientText>{data.trackName.split(' ')[0]}</GradientText> track?
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-3 text-dim">Core curriculum is free. No credit card required.</p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8">
                <Link href={`/register?track=${data.accent}`}>
                  <Button size="lg" className="shine glow-brand group">
                    Start learning
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
