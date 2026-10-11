'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'
import { cn } from '@/lib/utils'

interface Tier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    description: 'Everything you need to get genuinely good.',
    features: ['Full FE + BE curriculum', 'In-browser code editor', '3 AI hints / day', '5 portfolio projects'],
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '$14',
    period: '/month',
    description: 'For people serious about getting hired.',
    features: ['Unlimited AI tutor', 'All 48+ projects', 'Verified certificates', 'Mock AI interviews', 'Portfolio custom domain'],
    cta: 'Start Pro trial',
    featured: true,
  },
  {
    name: 'Team',
    price: '$10',
    period: '/seat/mo',
    description: 'Cohort features for bootcamps and teams.',
    features: ['Everything in Pro', 'Admin dashboard', 'Progress reporting', 'Cohort deadlines'],
    cta: 'Talk to us',
  },
]

export function PricingPreview() {
  return (
    <section className="bg-card px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Free to start. Honest to upgrade.</h2>
          <p className="mt-3 text-dim">No paywalls on fundamentals. Premium is for career tools.</p>
        </div>

        <motion.div
          variants={cascadeContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-6 sm:grid-cols-3"
        >
          {TIERS.map((tier) => (
            <motion.div
              key={tier.name}
              variants={cascadeItem}
              whileHover={{ y: tier.featured ? -8 : -4 }}
              className={cn(
                'relative rounded-[var(--radius-xl)] border p-7',
                tier.featured
                  ? 'border-brand bg-canvas shadow-elev-lg'
                  : 'border-rim-subtle bg-canvas shadow-elev-sm'
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
                <span className="font-display text-4xl font-bold text-ink">{tier.price}</span>
                <span className="text-sm text-dim">{tier.period}</span>
              </div>
              <ul className="mt-6 flex flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink">
                    <Check size={14} className="shrink-0 text-success" />
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
          ))}
        </motion.div>

        <p className="mt-8 text-center text-sm text-dim">
          <Link href="/pricing" className="font-semibold text-brand hover:underline">
            See full feature comparison →
          </Link>
        </p>
      </div>
    </section>
  )
}
