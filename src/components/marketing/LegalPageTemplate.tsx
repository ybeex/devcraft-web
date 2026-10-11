'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface LegalSection {
  id: string
  heading: string
  body: React.ReactNode
}

interface LegalPageTemplateProps {
  title: string
  lastUpdated: string
  sections: LegalSection[]
}

/**
 * Plain text-body, no marketing chrome, sticky table-of-contents sidebar
 * generated from each section's heading (Design Philosophy §17). This is
 * the one marketing-adjacent page type that deliberately does NOT use
 * mesh-bg, cascade animations, or IconChips — legal content should read as
 * calm and unadorned, not "designed."
 */
export function LegalPageTemplate({ title, lastUpdated, sections }: LegalPageTemplateProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-dim">Last updated {lastUpdated}</p>
      </header>

      <div className="flex gap-12">
        {/* Sticky TOC — hidden on mobile, own scroll region on desktop */}
        <nav className="sticky top-24 hidden h-fit w-56 shrink-0 lg:block" aria-label="Table of contents">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ghost">On this page</p>
          <ul className="flex flex-col gap-1 border-l border-rim-subtle">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    'block border-l-2 py-1.5 pl-4 text-sm transition-colors -ml-px',
                    activeId === s.id
                      ? 'border-brand font-semibold text-brand'
                      : 'border-transparent text-dim hover:text-ink'
                  )}
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content — plain, unadorned, readable */}
        <article className="min-w-0 flex-1 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
              <h2 className="mb-3 font-ui text-xl font-bold text-ink">{s.heading}</h2>
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-dim">{s.body}</div>
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}
