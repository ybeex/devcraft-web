'use client'

import { ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { IconChip } from '@/components/ui/IconChip'
import { Eyebrow, GradientText, Reveal, RevealGroup, RevealItem } from '@/components/marketing/primitives'

type EntryTag = 'Feature' | 'Fix' | 'Security'

interface ChangelogEntry {
  date: string
  tag: EntryTag
  title: string
  body: string
}

const TAG_CONFIG: Record<EntryTag, { tone: 'info' | 'warning' | 'error'; icon: React.ReactNode }> = {
  Feature: { tone: 'info', icon: <Sparkles size={14} /> },
  Fix: { tone: 'warning', icon: <Wrench size={14} /> },
  Security: { tone: 'error', icon: <ShieldCheck size={14} /> },
}

const ENTRIES: ChangelogEntry[] = [
  {
    date: 'June 20, 2026',
    tag: 'Security',
    title: 'Hardening pass across auth, AI, and the leaderboard',
    body: 'Fixed a SQL-injection vector in leaderboard ranking (moved to parameterized queries), switched refresh-token storage to SHA-256 hashes instead of raw values, added JTI-based access-token revocation for instant logout, closed a race condition in daily AI-credit enforcement with atomic Redis increments, and added a prompt-injection guard in front of every AI endpoint. Full write-up in our audit report.',
  },
  {
    date: 'June 19, 2026',
    tag: 'Feature',
    title: 'Multi-model AI tutor via OpenRouter',
    body: 'Replaced our single-model AI setup with a 7-model catalogue routed through OpenRouter — GPT-4o and GPT-4o mini, DeepSeek R1 and Chat v3, Qwen3 Coder, and Gemma 3. Each feature (hints, error explanations, code review, mock interviews) is now matched to the model best suited for it, with per-model token ceilings enforced automatically.',
  },
  {
    date: 'June 18, 2026',
    tag: 'Feature',
    title: 'Real code execution, certificates, and a public playground',
    body: 'Lessons now run your code in an isolated sandbox with a 5-second CPU budget and no network access — no more regex string-matching. Completing 100% of a track now auto-issues a publicly verifiable certificate. Also shipped: in-app notifications, global search across lessons and community posts, and a playground for saving and sharing standalone code snippets.',
  },
  {
    date: 'June 17, 2026',
    tag: 'Feature',
    title: 'Email verification and password reset',
    body: 'Added the full account-recovery loop: verification email on signup, a resend option, and a self-serve forgot/reset password flow that revokes all active sessions on completion.',
  },
  {
    date: 'June 15, 2026',
    tag: 'Feature',
    title: 'Admin content management system',
    body: 'Full CRUD for tracks, modules, lessons, and interview questions, plus project-submission review with AI-assisted scoring and community moderation tools — all gated behind role-based access control.',
  },
  {
    date: 'June 10, 2026',
    tag: 'Feature',
    title: 'DevCraft launches',
    body: 'Frontend and Backend Engineering tracks, an AI tutor for hints and code review, community Q&A, a weekly/monthly/all-time leaderboard, and a 200+ question interview-prep bank — all free to start.',
  },
]

export function ChangelogContent() {
  return (
    <>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="aurora aurora-animate grain relative overflow-hidden px-6 pb-14 pt-24 text-center">
        <div aria-hidden className="bg-grid mask-radial-fade pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-[2] mx-auto flex max-w-2xl flex-col items-center">
          <Reveal>
            <Eyebrow>Shipping log</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl">
              <GradientText>Changelog</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-4 text-balance text-dim">What shipped, when, and why it matters.</p>
          </Reveal>
        </div>
      </section>

      {/* ─── Timeline ────────────────────────────────────────────────────── */}
      <section className="px-6 pb-28">
        <RevealGroup className="relative mx-auto flex max-w-2xl flex-col gap-6" stagger={0.08}>
          <div
            aria-hidden
            className="absolute bottom-4 left-3 top-4 w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(var(--aurora-a),.5), rgba(var(--aurora-c),.3), transparent)' }}
          />
          {ENTRIES.map((entry) => {
            const config = TAG_CONFIG[entry.tag]
            return (
              <RevealItem key={entry.title} className="relative pl-10">
                <span
                  aria-hidden
                  className="absolute left-[7px] top-2 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-canvas"
                />
                <div className="spotlight lift relative rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6 shadow-elev-sm transition-colors duration-300 hover:border-brand/40">
                  <time className="text-xs font-semibold uppercase tracking-wide text-ghost">{entry.date}</time>
                  <div className="mt-2">
                    <IconChip
                      icon={config.icon}
                      label={entry.tag}
                      variant="tonal"
                      tone={config.tone}
                      className="px-3 py-1 text-xs [&>svg]:h-4 [&>svg]:w-4"
                    />
                  </div>
                  <h2 className="mt-3 font-ui text-lg font-semibold text-ink">{entry.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-dim">{entry.body}</p>
                </div>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </section>
    </>
  )
}
