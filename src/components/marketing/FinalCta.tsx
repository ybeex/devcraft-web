import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Eyebrow, GradientText, Reveal } from './primitives'

export function FinalCta() {
  return (
    <section className="px-2 py-16">
      <div className="aurora aurora-animate grain relative mx-auto max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-rim-subtle px-2 py-8 shadow-elev-lg sm:px-12 sm:py-16">
        {/* hairline grid, radially masked for depth */}
        <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />

        <div className="relative z-[2] mx-auto flex max-w-2xl flex-col items-center text-center">
          <Reveal>
            <Eyebrow icon={<Sparkles size={13} className="text-brand" />}>Ready when you are</Eyebrow>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-5 text-balance font-display text-3xl font-bold leading-[1.1] text-ink sm:text-4xl">
              Stop reading about it. <GradientText>Start building it.</GradientText>
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-3 text-dim">
              Free forever. No credit card. Ship your first real project this week.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="shine glow-brand group">
                  Start learning
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="group">
                  See pricing
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
