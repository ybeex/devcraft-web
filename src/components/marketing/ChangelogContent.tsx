'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { IconChip } from '@/components/ui/IconChip'
import { cascadeContainer, cascadeItem } from '@/lib/motion/variants'

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
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-14 text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Changelog</h1>
        <p className="mt-3 text-dim">What shipped, when, and why it matters.</p>
      </header>

      <motion.ol
        variants={cascadeContainer}
        initial="initial"
        animate="animate"
        className="relative flex flex-col gap-10 border-l border-rim-subtle pl-8"
      >
        {ENTRIES.map((entry) => {
          const config = TAG_CONFIG[entry.tag]
          return (
            <motion.li key={entry.title} variants={cascadeItem} className="relative">
              <span
                className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-canvas"
                aria-hidden
              />
              <time className="text-xs font-semibold uppercase tracking-wide text-ghost">{entry.date}</time>
              <div className="mt-2 flex items-center gap-3">
                <IconChip icon={config.icon} label={entry.tag} variant="tonal" tone={config.tone} className="px-3 py-1 text-xs" />
              </div>
              <h2 className="mt-3 font-ui text-lg font-semibold text-ink">{entry.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-dim">{entry.body}</p>
            </motion.li>
          )
        })}
      </motion.ol>
    </div>
  )
}
