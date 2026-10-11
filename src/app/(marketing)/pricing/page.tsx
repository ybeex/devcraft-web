'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Minus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem, easeOut } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

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
      <section className="mesh-bg px-6 pb-12 pt-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="font-display text-4xl font-bold text-ink sm:text-5xl"
        >
          Free to start. Honest to upgrade.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="mx-auto mt-3 max-w-md text-dim"
        >
          No paywalls on fundamentals. Premium pays for career tools, not gatekeeping.
        </motion.p>

        {/* Annual toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 inline-flex items-center gap-3 rounded-full border border-rim-subtle bg-card p-1.5"
        >
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              !annual ? 'bg-raised text-ink shadow-elev-sm' : 'text-dim'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              annual ? 'bg-raised text-ink shadow-elev-sm' : 'text-dim'
            )}
          >
            Annual
            <span className="rounded-full bg-[var(--positive-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--positive-text)]">
              SAVE 25%
            </span>
          </button>
        </motion.div>
      </section>

      {/* ─── Tier cards ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <motion.div
          variants={cascadeContainer}
          initial="initial"
          animate="animate"
          className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3"
        >
          {TIERS.map((tier) => {
            const price = annual ? tier.annual : tier.monthly
            return (
              <motion.div
                key={tier.name}
                variants={cascadeItem}
                whileHover={{ y: tier.featured ? -8 : -4 }}
                className={cn(
                  'relative rounded-[var(--radius-xl)] border p-7',
                  tier.featured ? 'border-brand bg-card shadow-elev-lg' : 'border-rim-subtle bg-card shadow-elev-sm'
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-ink">{tier.name}</h3>
                <p className="mt-1 text-sm text-dim">{tier.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-ink">${price}</span>
                  <span className="text-sm text-dim">
                    {price > 0 ? `/${tier.period}` : tier.period}
                  </span>
                </div>
                {tier.featured && annual && (
                  <p className="mt-1 text-xs text-dim">Billed annually at ${price * 12}/year</p>
                )}
                <ul className="mt-6 flex flex-col gap-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink">
                      <Check size={14} className="mt-0.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-7 block">
                  <Button variant={tier.featured ? 'primary' : 'outline'} className="w-full justify-center">
                    {tier.cta}
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ─── Comparison table ────────────────────────────────────────────── */}
      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold text-ink">Compare every feature</h2>

          <div className="mt-10 overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-canvas">
            <div className="grid grid-cols-4 border-b border-rim-subtle bg-raised text-sm font-semibold text-ink">
              <div className="px-5 py-3">Feature</div>
              <div className="px-3 py-3 text-center">Free</div>
              <div className="px-3 py-3 text-center text-brand">Pro</div>
              <div className="px-3 py-3 text-center">Team</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  'grid grid-cols-4 text-sm',
                  i % 2 === 0 ? 'bg-canvas' : 'bg-card/40'
                )}
              >
                <div className="px-5 py-3 text-ink">{row.label}</div>
                <ComparisonCell value={row.free} />
                <ComparisonCell value={row.pro} highlight />
                <ComparisonCell value={row.team} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center font-display text-3xl font-bold text-ink">Questions, answered</h2>
          <div className="mt-10 flex flex-col gap-3">
            {FAQS.map((faq, i) => {
              const open = openFaq === i
              return (
                <div
                  key={faq.q}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card"
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-ui text-sm font-semibold text-ink">{faq.q}</span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={18} className="text-dim" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: easeOut }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-sm text-dim">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Enterprise CTA ──────────────────────────────────────────────── */}
      <section className="mesh-bg px-6 py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Need more than 20 seats?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-dim">
          Enterprise pricing, SSO, and dedicated support for larger bootcamps and engineering orgs.
        </p>
        <div className="mt-7">
          <Link href="/contact">
            <Button variant="outline">Contact sales</Button>
          </Link>
        </div>
      </section>
    </>
  )
}

function ComparisonCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  return (
    <div className={cn('flex items-center justify-center px-3 py-3', highlight && 'bg-brand-muted')}>
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
