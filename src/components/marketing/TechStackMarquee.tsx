'use client'

import { Marquee, Reveal } from './primitives'

const TECHNOLOGIES = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'PostgreSQL',
  'REST',
  'GraphQL',
  'Docker',
  'Git',
  'Testing',
  'Performance',
  'System Design',
]

export function TechStackMarquee() {
  return (
    <section className="relative overflow-hidden py-14">
      <Reveal className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ghost">
          Master the stack that ships
        </p>
      </Reveal>

      {/* py-4 gives the track headroom so a pill's hover pop isn't clipped by the marquee's overflow-hidden */}
      <Marquee duration={48} className="py-4">
        {TECHNOLOGIES.map((tech) => (
          <span
            key={tech}
            className="pill-pop group flex items-center gap-2 rounded-full border border-rim-subtle bg-card px-5 py-2.5 text-sm font-semibold text-dim shadow-elev-sm hover:border-brand/40 hover:text-ink"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand/50 transition-colors group-hover:bg-brand" />
            {tech}
          </span>
        ))}
      </Marquee>
    </section>
  )
}
