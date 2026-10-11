'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FeatureIcon, type FeatureIconName } from '@/components/brand/FeatureIcon'
import { IconChip } from '@/components/ui/IconChip'
import { cascadeContainer, cascadeItem, hoverLift, easeOut } from '@/lib/motion/variants'

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
  const accentBg = data.accent === 'fe' ? 'bg-fe' : 'bg-be'

  const totalLessons = data.modules.reduce((sum, m) => sum + m.lessonCount, 0)
  const totalHours = data.modules.reduce((sum, m) => sum + m.estimatedHours, 0)

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="mesh-bg mesh-animate relative overflow-hidden px-6 pb-16 pt-20">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="mx-auto mb-6 inline-block"
          >
            <FeatureIcon name={data.trackIcon} size={72} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
            className="font-display text-4xl font-bold text-ink sm:text-5xl"
          >
            {data.trackName}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
            className={`mt-3 text-lg font-semibold ${accentClass}`}
          >
            {data.tagline}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
            className="mx-auto mt-5 max-w-xl text-dim"
          >
            {data.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <IconChip
              icon={<Clock size={16} />}
              label={`${totalHours}+ hours`}
              variant="outline"
            />
            <IconChip
              icon={<CheckCircle2 size={16} />}
              label={`${totalLessons} lessons`}
              variant="outline"
            />
            <IconChip
              icon={<FeatureIcon name="certificate" size={16} />}
              label="Verified certificate"
              variant="outline"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
            className="mt-9"
          >
            <Link href={`/register?track=${data.accent}`}>
              <Button size="lg">
                Start {data.trackName.split(' ')[0]} track <ArrowRight size={16} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Tech stack strip ─────────────────────────────────────────────── */}
      <section className="border-y border-rim-subtle bg-card px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
          {data.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-rim-subtle bg-raised px-4 py-1.5 text-sm font-medium text-dim"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Curriculum tree preview ──────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-ink">Curriculum</h2>
          <p className="mt-2 text-center text-dim">
            {data.modules.length} modules, building from fundamentals to production-grade systems.
          </p>

          <motion.div
            variants={cascadeContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="relative mt-12 flex flex-col gap-3"
          >
            {/* connecting line */}
            <div
              className="absolute bottom-6 left-6 top-6 w-px"
              style={{ background: 'var(--rim)' }}
              aria-hidden
            />

            {data.modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                variants={cascadeItem}
                {...hoverLift}
                className="relative flex items-center gap-5 rounded-[var(--radius-lg)] border border-rim-subtle bg-card py-4 pl-4 pr-6 shadow-elev-sm"
              >
                <div
                  className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${accentBg}`}
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Who this is for ──────────────────────────────────────────────── */}
      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-display text-3xl font-bold text-ink">Who this is for</h2>
          <motion.div
            variants={cascadeContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-10 grid gap-5 sm:grid-cols-3"
          >
            {data.audiences.map((a) => (
              <motion.div
                key={a.title}
                variants={cascadeItem}
                {...hoverLift}
                className="rounded-[var(--radius-lg)] border border-rim-subtle bg-canvas p-6 shadow-elev-sm"
              >
                <h3 className="font-ui text-base font-semibold text-ink">{a.title}</h3>
                <p className="mt-2 text-sm text-dim">{a.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Featured projects ────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl font-bold text-ink">Featured projects</h2>
          <p className="mt-2 text-center text-dim">Build these, ship them, put them in your portfolio.</p>

          <motion.div
            variants={cascadeContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-10 grid gap-5 sm:grid-cols-3"
          >
            {data.featuredProjectTitles.map((title) => (
              <motion.div
                key={title}
                variants={cascadeItem}
                {...hoverLift}
                className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6 text-center shadow-elev-sm"
              >
                <FeatureIcon name="projectRocket" size={40} className="mx-auto" />
                <h3 className="mt-4 font-ui text-sm font-semibold text-ink">{title}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="mesh-bg px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Ready to start the {data.trackName.split(' ')[0]} track?
          </h2>
          <p className="mt-3 text-dim">Core curriculum is free. No credit card required.</p>
          <div className="mt-8">
            <Link href={`/register?track=${data.accent}`}>
              <Button size="lg">
                Start learning <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
