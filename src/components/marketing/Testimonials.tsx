'use client'

import { Star } from 'lucide-react'
import { GradientText, Marquee, SectionHeading } from './primitives'
import { cn } from '@/lib/utils'

interface Testimonial {
  quote: string
  name: string
  role: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I went from tutorial hell to a job offer in four months. The difference was the projects — every single one went straight into my portfolio.',
    name: 'Amara Chukwu',
    role: 'Frontend Engineer, hired via DevCraft portfolio',
    initials: 'AC',
  },
  {
    quote:
      'The backend track is the first one that actually treats system design as a first-class citizen instead of an afterthought.',
    name: 'Daniel Okoro',
    role: 'Backend Engineer',
    initials: 'DO',
  },
  {
    quote: "The AI tutor refused to just give me the answer and honestly that's exactly what made it stick.",
    name: 'Priya Sharma',
    role: 'Full-stack learner',
    initials: 'PS',
  },
  {
    quote: 'First platform where the UI itself feels like proof the team knows what good engineering looks like.',
    name: 'Tunde Bakare',
    role: 'Senior dev, career switcher',
    initials: 'TB',
  },
  {
    quote:
      'The mock interviews were uncomfortably realistic. By the real thing, the nerves were already spent.',
    name: 'Lena Fischer',
    role: 'Platform engineer',
    initials: 'LF',
  },
  {
    quote:
      'Code review feedback on my capstones was the single fastest jump in code quality I have ever had.',
    name: 'Marcus Bell',
    role: 'Backend developer',
    initials: 'MB',
  },
]

const ROW_ONE = TESTIMONIALS.slice(0, 3)
const ROW_TWO = TESTIMONIALS.slice(3)

export function Testimonials() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto mb-12 max-w-2xl px-6">
        <SectionHeading
          eyebrow="Real outcomes"
          title={
            <>
              People who shipped <GradientText>because of it.</GradientText>
            </>
          }
        />
      </div>

      <div className="flex flex-col gap-5">
        <Marquee duration={44}>
          {ROW_ONE.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </Marquee>
        <Marquee duration={52} reverse>
          {ROW_TWO.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div
      className={cn(
        'shine relative w-[360px] shrink-0 rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-6 shadow-elev-sm'
      )}
    >
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} className="fill-brand text-brand" />
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand">
          {testimonial.initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-ink">{testimonial.name}</div>
          <div className="text-xs text-dim">{testimonial.role}</div>
        </div>
      </div>
    </div>
  )
}
