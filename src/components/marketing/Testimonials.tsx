'use client'

import { motion } from 'framer-motion'

interface Testimonial {
  quote: string
  name: string
  role: string
  initials: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I went from tutorial hell to a job offer in four months. The difference was the projects — every single one went straight into my portfolio.",
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
    quote:
      "The AI tutor refused to just give me the answer and honestly that's exactly what made it stick.",
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
]

export function Testimonials() {
  const loop = [...TESTIMONIALS, ...TESTIMONIALS]

  return (
    <section className="overflow-hidden py-24">
      <div className="mx-auto mb-12 max-w-xl px-6 text-center">
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">People who shipped because of it</h2>
      </div>

      <div className="group relative">
        <motion.div
          className="flex gap-5"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ width: 'max-content' }}
        >
          {loop.map((t, i) => (
            <div
              key={i}
              className="w-[340px] shrink-0 rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-6 shadow-elev-sm"
            >
              <p className="text-sm leading-relaxed text-ink">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-dim">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
