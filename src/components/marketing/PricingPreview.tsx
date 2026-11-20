'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GradientText, RevealGroup, RevealItem, SectionHeading, SpotlightCard } from './primitives'
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
    features: [
      'Unlimited AI tutor',
      'All 48+ projects',
      'Verified certificates',
      'Mock AI interviews',
      'Portfolio custom domain',
    ],
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
    <section className="relative overflow-hidden bg-card px-6 py-24">
      <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Free to start. <GradientText>Honest to upgrade.</GradientText>
            </>
          }
          subtitle="No paywalls on fundamentals. Premium pays for career tools, not gatekeeping."
        />

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-3" stagger={0.1}>
          {TIERS.map((tier) => (
            <RevealItem key={tier.name} className="h-full">
              <SpotlightCard
                className={cn('h-full p-7', tier.featured && 'border-brand/40')}
                glow={tier.featured}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 z-[3] -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-[#080D1C] shadow-elev-md">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-ink">{tier.name}</h3>
                <p className="mt-1 text-sm text-dim">{tier.description}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-ink">{tier.price}</span>
                  <span className="text-sm text-dim">{tier.period}</span>
                </div>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-ink">
                      <Check size={14} className="shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={tier.featured ? '/pricing' : '/register'} className="mt-7 block">
                  <Button
                    variant={tier.featured ? 'primary' : 'outline'}
                    className={cn('w-full justify-center', tier.featured && 'shine')}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="mt-10 text-center text-sm text-dim">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
          >
            See the full feature comparison
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </p>
      </div>
    </section>
  )
}
