'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Minus, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'
import {
  Eyebrow,
  GradientText,
  Reveal,
  RevealGroup,
  RevealItem,
  SectionHeading,
  SpotlightCard,
} from '@/components/marketing/primitives'

// ─── Data ───────────────────────────────────────────────────────────────────

interface Tier {
  name: string
  monthly: number
  annual: number
  period: string
  description: string
  features: string[]
  cta: string
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    period: 'forever',
    description: 'Everything you need to get genuinely good.',
    features: ['Full FE + BE curriculum', 'In-browser code editor', '3 AI hints / day', '5 portfolio projects', 'Community access', 'Basic portfolio page'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    monthly: 14,
    annual: 10,
    period: 'month',
    description: 'For people serious about getting hired.',
    features: ['Everything in Free', 'Unlimited AI tutor', 'All 48+ projects', 'Verified certificates', 'Interview prep bank (212 Qs)', 'Mock AI interviews', 'Portfolio custom domain', 'PDF portfolio export', 'Offline lesson downloads'],
    cta: 'Start Pro trial',
    featured: true,
  },
  {
    name: 'Team',
    monthly: 10,
    annual: 8,
    period: 'seat / month',
    description: 'Cohort features for bootcamps and teams.',
    features: ['Everything in Pro', 'Admin dashboard', 'Progress reporting', 'Custom learning paths', 'Bulk certificate management', 'Cohort deadlines', 'Slack integration'],
    cta: 'Talk to us',
  },
]

const COMPARISON_ROWS: { label: string; free: boolean | string; pro: boolean | string; team: boolean | string }[] = [
  { label: 'Frontend + Backend curriculum', free: true, pro: true, team: true },
  { label: 'In-browser code editor', free: true, pro: true, team: true },
  { label: 'Community access', free: true, pro: true, team: true },
  { label: 'AI tutor credits', free: '3/day', pro: 'Unlimited', team: 'Unlimited' },
  { label: 'Portfolio projects', free: '5', pro: 'All 48+', team: 'All 48+' },
  { label: 'Verified certificates', free: false, pro: true, team: true },
  { label: 'Interview prep bank', free: false, pro: true, team: true },
  { label: 'AI mock interviews', free: false, pro: true, team: true },
  { label: 'Portfolio custom domain', free: false, pro: true, team: true },
  { label: 'Offline lesson downloads', free: false, pro: true, team: true },
  { label: 'Admin dashboard', free: false, pro: false, team: true },
  { label: 'Cohort progress reporting', free: false, pro: false, team: true },
  { label: 'Slack integration', free: false, pro: false, team: true },
]

const FAQS = [
  {
    q: 'Is the free tier actually useful, or is it a trial?',
    a: 'The full Frontend and Backend curriculum — every lesson, every concept — is free, forever. Free means free fundamentals, not a 7-day trial. Pro is for career tools: unlimited AI, certificates, and interview prep, not for gatekeeping what you learn.',
  },
  {
    q: 'Can I switch between monthly and annual billing?',
    a: "Yes, any time from your account settings. If you switch to annual, you're charged the prorated difference immediately and your renewal date adjusts.",
  },
  {
    q: 'What happens to my progress if I downgrade from Pro?',
    a: 'Nothing is deleted. Your lesson progress, XP, and streak are all preserved. You\'ll lose access to premium-only modules and unlimited AI credits until you upgrade again, but everything you\'ve already completed stays on your profile.',
  },
  {
    q: 'Do certificates expire?',
    a: "No. Once issued, a certificate's verification URL stays live permanently — even if you later downgrade or cancel your subscription.",
  },
  {
    q: 'Is there a discount for students or bootcamps?',
    a: 'Team pricing is built for bootcamps and cohorts (5+ seats). For individual students, reach out via the contact page — we review requests case by case.',
  },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="aurora aurora-animate grain relative overflow-hidden px-6 pb-24 pt-24">
        <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-[2] mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal>
            <Eyebrow icon={<Sparkles size={13} className="text-brand" />}>Pricing</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
              Free to start. <GradientText>Honest to upgrade.</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-4 max-w-md text-balance text-dim">
              No paywalls on fundamentals. Premium pays for career tools, not gatekeeping.
            </p>
          </Reveal>

          {/* Annual toggle */}
          <Reveal delay={0.18}>
            <div className="mt-9 inline-flex items-center gap-1 rounded-full border border-rim-subtle bg-card/80 p-1.5 shadow-elev-sm backdrop-blur">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  'relative rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  !annual ? 'text-ink' : 'text-dim hover:text-ink'
                )}
              >
                {!annual && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-full bg-raised shadow-elev-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">Monthly</span>
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  'relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors',
                  annual ? 'text-ink' : 'text-dim hover:text-ink'
                )}
              >
                {annual && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-full bg-raised shadow-elev-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">Annual</span>
                <span className="relative z-10 rounded-full bg-[var(--positive-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--positive-text)]">
                  SAVE 25%
                </span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Tier cards ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <RevealGroup className="mx-auto grid max-w-5xl items-stretch gap-6 sm:grid-cols-3" stagger={0.1}>
          {TIERS.map((tier) => {
            const price = annual ? tier.annual : tier.monthly
            return (
              <RevealItem key={tier.name} className="relative">
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-[#080D1C] shadow-elev-md">
                    <Sparkles size={12} />
                    Most popular
                  </span>
                )}
                <SpotlightCard
                  glow={tier.featured}
                  className={cn('h-full p-7', tier.featured && 'border-brand/40')}
                >
                  <h3 className="font-display text-xl font-bold text-ink">{tier.name}</h3>
                  <p className="mt-1 text-sm text-dim">{tier.description}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold tabular-nums text-ink">${price}</span>
                    <span className="text-sm text-dim">{price > 0 ? `/${tier.period}` : tier.period}</span>
                  </div>
                  {tier.featured && annual && (
                    <p className="mt-1 text-xs text-dim">Billed annually at ${price * 12}/year</p>
                  )}

                  <div aria-hidden className="divider-glow mt-6" />

                  <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink">
                        <Check size={14} className="mt-0.5 shrink-0 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/register" className="mt-7 block">
                    <Button
                      variant={tier.featured ? 'primary' : 'outline'}
                      className={cn('group w-full justify-center', tier.featured && 'shine glow-brand')}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </SpotlightCard>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </section>

      {/* ─── Comparison table ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-rim-subtle bg-card px-6 py-24">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-[2] mx-auto max-w-3xl">
          <SectionHeading eyebrow="Compare" title="Every feature, side by side" />

          <Reveal className="mt-12">
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle bg-canvas shadow-elev-md">
              <div className="grid grid-cols-4 border-b border-rim-subtle bg-raised text-sm font-semibold text-ink">
                <div className="px-5 py-3.5">Feature</div>
                <div className="px-3 py-3.5 text-center">Free</div>
                <div className="relative px-3 py-3.5 text-center text-brand">
                  Pro
                  <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)]" />
                </div>
                <div className="px-3 py-3.5 text-center">Team</div>
              </div>
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    'grid grid-cols-4 text-sm transition-colors hover:bg-card/60',
                    i % 2 === 0 ? 'bg-canvas' : 'bg-card/40'
                  )}
                >
                  <div className="px-5 py-3.5 text-ink">{row.label}</div>
                  <ComparisonCell value={row.free} />
                  <ComparisonCell value={row.pro} highlight />
                  <ComparisonCell value={row.team} />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <RevealGroup className="mt-12 flex flex-col gap-3" stagger={0.06}>
            {FAQS.map((faq, i) => {
              const open = openFaq === i
              return (
                <RevealItem key={faq.q}>
                  <div
                    className={cn(
                      'overflow-hidden rounded-[var(--radius-lg)] border bg-card transition-colors duration-300',
                      open ? 'border-brand/40 shadow-elev-md' : 'border-rim-subtle shadow-elev-sm hover:border-rim'
                    )}
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="font-ui text-sm font-semibold text-ink">{faq.q}</span>
                      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: easeOut }}>
                        <ChevronDown size={18} className={cn('shrink-0', open ? 'text-brand' : 'text-dim')} />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: easeOut }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-4 text-sm text-dim">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>
      </section>

      {/* ─── Enterprise CTA ──────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="aurora aurora-animate grain relative mx-auto max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle px-6 py-14 text-center shadow-elev-lg sm:px-12 sm:py-16">
          <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative z-[2] mx-auto max-w-2xl">
            <Reveal>
              <Eyebrow>Enterprise</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 font-display text-2xl font-bold text-ink sm:text-3xl">
                Need more than 20 seats?
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto mt-3 max-w-md text-dim">
                Enterprise pricing, SSO, and dedicated support for larger bootcamps and engineering orgs.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-8">
                <Link href="/contact">
                  <Button variant="outline" size="lg" className="group">
                    Contact sales
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

function ComparisonCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  return (
    <div className={cn('flex items-center justify-center px-3 py-3.5', highlight && 'bg-brand-muted')}>
      {typeof value === 'string' ? (
        <span className="text-xs font-medium text-ink">{value}</span>
      ) : value ? (
        <Check size={16} className="text-success" />
      ) : (
        <Minus size={16} className="text-ghost" />
      )}
    </div>
  )
}
