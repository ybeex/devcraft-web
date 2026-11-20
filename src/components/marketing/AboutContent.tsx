'use client'

import { DevCraftMark } from '@/components/brand/DevCraftMark'
import { FeatureIcon } from '@/components/brand/FeatureIcon'
import {
  AnimatedStat,
  Eyebrow,
  GradientText,
  Reveal,
  RevealGroup,
  RevealItem,
  SectionHeading,
  SpotlightCard,
} from '@/components/marketing/primitives'

const PRINCIPLES = [
  {
    title: 'Nothing floats without a reason',
    body: 'Every elevated surface has a light source and a shadow that matches it. Flat means background. Raised means interactive. There is no in-between.',
  },
  {
    title: 'Containers earn their border',
    body: 'A label never sits naked next to an icon. The same care we put into the product, we put into how we explain it.',
  },
  {
    title: 'Status is a color, not just a word',
    body: '"Completed," "In review," "Blocked" are never plain text — the color does the talking before the word does.',
  },
  {
    title: 'Motion explains hierarchy',
    body: "If an animation doesn't communicate state, we cut it. A page that slides shows you which direction you moved.",
  },
]

const STATS: { value: number; label: string; suffix: string; divisor?: number; decimals?: number }[] = [
  { value: 12400, label: 'Learners', suffix: '+' },
  { value: 200, label: 'Lessons shipped', suffix: '+' },
  { value: 48, label: 'Real-world projects', suffix: '' },
  { value: 49, label: 'Average rating', suffix: '/50', divisor: 10, decimals: 1 },
]

const TEAM_ROLES = ['Engineering', 'Product Design', 'Curriculum', 'AI Research']

export function AboutContent() {
  return (
    <>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="aurora aurora-animate grain relative overflow-hidden px-6 pb-16 pt-24 text-center">
        <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-[2] mx-auto flex max-w-2xl flex-col items-center">
          <Reveal>
            <Eyebrow>Our standard</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="relative mt-8">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-xl"
              />
              <DevCraftMark size={56} />
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
              We hold ourselves to the <GradientText>standard we teach.</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="mt-4 text-balance text-dim">
              Every other platform makes one bet — breadth, or price. We bet on craft: an engineering
              education product built with the same rigor we ask our learners to bring to their own code.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-rim-subtle bg-card px-6 py-14">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <RevealGroup className="relative z-[2] mx-auto grid max-w-3xl grid-cols-2 gap-y-10 sm:grid-cols-4 sm:divide-x sm:divide-rim-subtle" stagger={0.1}>
          {STATS.map((s) => (
            <RevealItem key={s.label}>
              <AnimatedStat
                value={s.value}
                label={s.label}
                suffix={s.suffix}
                divisor={s.divisor}
                decimals={s.decimals}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ─── Mission ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <Reveal className="mx-auto max-w-2xl">
          <Eyebrow>Our mission</Eyebrow>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-ink">
            The product is the <GradientText>curriculum.</GradientText>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-dim">
            Most developer education treats the learning platform as disposable infrastructure —
            a thin wrapper around video or text, with no opinion about whether the product itself
            is well-built. We think that&apos;s backwards. If we&apos;re teaching frontend engineering,
            our frontend should be the best frontend a learner sees that week. If we&apos;re teaching
            backend architecture, our API should hold up to the same scrutiny we ask learners to apply
            to their own.
          </p>
          <p className="mt-4 text-base leading-relaxed text-dim">
            That&apos;s the whole company, really: make engineers who ship, by being a product
            that ships at that standard ourselves.
          </p>
        </Reveal>
      </section>

      {/* ─── Crafted Depth callout ───────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-rim-subtle bg-card px-6 py-24">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <Reveal className="relative z-[2] mx-auto max-w-2xl">
          <SpotlightCard glow className="items-center p-10 text-center">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-32"
              style={{ background: 'radial-gradient(60% 100% at 50% 0%, var(--glow), transparent 72%)', opacity: 0.5 }}
            />
            <p className="font-display text-2xl italic leading-snug text-ink sm:text-3xl">
              &ldquo;Every surface has weight. Every interaction has intention.
              <br className="hidden sm:block" /> Nothing is flat by accident.&rdquo;
            </p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-brand">
              — Crafted Depth, our design philosophy
            </p>
          </SpotlightCard>
        </Reveal>
      </section>

      {/* ─── Principles grid ─────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Craft" title="How we build" subtitle="Four rules we refuse to break." />
          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2" stagger={0.1}>
            {PRINCIPLES.map((p) => (
              <RevealItem key={p.title} className="h-full">
                <SpotlightCard className="h-full p-6">
                  <h3 className="font-ui text-base font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm text-dim">{p.body}</p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ─── Team ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-rim-subtle bg-card px-6 py-24">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-[2] mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="The team"
            title="Built by people who ship"
            subtitle="A small team of engineers and educators who got tired of choosing between platforms that taught well and platforms that felt good to use."
          />
          <RevealGroup className="mt-12 flex flex-wrap items-center justify-center gap-4" stagger={0.08}>
            {TEAM_ROLES.map((role) => (
              <RevealItem key={role}>
                <div className="group flex items-center gap-2 rounded-full border border-rim-subtle bg-canvas px-5 py-2.5 shadow-elev-sm transition-colors hover:border-brand/40">
                  <FeatureIcon name="codeWindow" size={20} />
                  <span className="text-sm font-medium text-ink">{role}</span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  )
}
