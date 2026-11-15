'use client'

import Link from 'next/link'
import { Boxes, Database, GitBranch, Globe, Lock, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

interface Lab { href: string; title: string; blurb: string; icon: LucideIcon; tracks: Array<'FE' | 'BE'>; soon?: boolean }

const LABS: Lab[] = [
  { href: '/labs/database', title: 'Practice database', blurb: 'A private PostgreSQL copy of a shop (10,000 orders) and a help desk (3,000 tickets). Query it, change it, break it, reset it.', icon: Database, tracks: ['BE'] },
  { href: '/labs/storefront', title: 'Storefront API', blurb: 'A real shop API to build against: products, search, accounts, cart and checkout. Make it slow or broken on purpose.', icon: Globe, tracks: ['FE'] },
  { href: '/labs/previews', title: 'Hosted previews', blurb: 'Publish what you built and share a link to it.', icon: Globe, tracks: ['FE'] },
  { href: '/labs/git', title: 'Git lab', blurb: 'A real repository in a real terminal, with a live picture of the commit graph. Break it, then fix it.', icon: GitBranch, tracks: ['FE', 'BE'] },
  { href: '/labs/docker', title: 'Docker lab', blurb: 'Build, run and debug containers in a terminal that behaves like Docker.', icon: Boxes, tracks: ['BE'] },
]

export default function LabsPage() {
  const mine = useAuthStore((s) => s.user?.primaryTrack ?? null)
  const role = useAuthStore((s) => s.user?.role)
  const labs = LABS.filter((l) => !mine || role === 'ADMIN' || l.tracks.includes(mine))
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Labs</h1>
      <p className="mt-1 text-sm text-dim">Real tools to practise on, for your track. Everything here is yours alone: nobody else can see or change it.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {labs.map((l) => {
          const Icon = l.icon
          const body = (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-brand-muted text-brand"><Icon size={20} /></span>
              <h2 className="mt-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">{l.title}{l.soon && <span className="rounded-full bg-raised px-2 py-0.5 text-[10px] font-semibold uppercase text-ghost">Coming soon</span>}</h2>
              <p className="mt-1 text-sm text-dim">{l.blurb}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-ghost"><Lock size={11} /> Pro</p>
            </>
          )
          return l.soon
            ? <div key={l.href} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 opacity-70">{body}</div>
            : <Link key={l.href} href={l.href} className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 transition-colors hover:border-brand">{body}</Link>
        })}
      </div>
    </div>
  )
}
