'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Gift, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { getProStatus, redeemProCode } from '@/lib/api/pro'
import { ApiRequestError } from '@/lib/api/client'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
const SOURCE_LABEL = { TRIAL: 'Welcome trial', CODE: 'Activation code', REWARD: 'Monthly reward', ADMIN: 'Added by the team' } as const

export default function ProPage() {
  const qc = useQueryClient()
  const { data: status, isLoading } = useQuery({ queryKey: ['pro-status'], queryFn: getProStatus })
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function redeem(value: string) {
    if (!value.trim()) return
    setBusy(true); setError(null); setDone(null)
    try {
      const r = await redeemProCode(value.trim())
      setDone(`Pro is on. ${r.daysAdded} days added.`)
      setCode('')
      await qc.invalidateQueries({ queryKey: ['pro-status'] })
      await qc.invalidateQueries({ queryKey: ['suggestions'] })
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not redeem the code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const isPro = status && status.tier !== 'FREE'

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Pro access</h1>
      <p className="mt-1 text-sm text-dim">Activate a code, or claim your monthly reward.</p>

      {isLoading || !status ? (
        <Skeleton className="mt-6 h-32 rounded-[var(--radius-xl)]" />
      ) : (
        <div className="mt-6 flex items-center gap-4 rounded-[var(--radius-xl)] border border-rim-subtle bg-card px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"><Sparkles size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-ink">{isPro ? (status.permanent ? `${status.tier} plan` : 'Pro is active') : 'Free plan'}</p>
            <p className="text-sm text-dim" data-testid="pro-summary">
              {status.permanent
                ? 'Your plan does not expire.'
                : isPro && status.proUntil
                  ? `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} left, until ${fmtDate(status.proUntil)}${status.proSource ? ` · ${SOURCE_LABEL[status.proSource]}` : ''}`
                  : 'Redeem a code to unlock every premium lesson and unlimited AI help.'}
            </p>
          </div>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink">Have a code?</h2>
        <form onSubmit={(e) => { e.preventDefault(); void redeem(code) }} className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DC-XXXX-XXXX-XXXX"
            aria-label="Activation code"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-rim bg-card px-3.5 py-2.5 font-mono text-sm tracking-wide text-ink outline-none placeholder:text-ghost focus:border-brand"
          />
          <Button type="submit" disabled={busy || !code.trim()}>{busy ? 'Activating…' : 'Activate'}</Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm font-medium text-error">{error}</p>}
        {done && <p role="status" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ink"><Check size={14} /> {done}</p>}
      </section>

      {status && status.rewards.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Gift size={15} /> Your rewards</h2>
          <p className="mt-1 text-xs text-dim">Earned on the monthly leaderboard. Each one is yours alone.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {status.rewards.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-rim-subtle bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-ink">{r.code}</p>
                  <p className="text-xs text-dim">{r.durationDays} days of Pro{r.expiresAt ? ` · use by ${fmtDate(r.expiresAt)}` : ''}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(r.code)}><Copy size={13} /> Copy</Button>
                <Button size="sm" onClick={() => void redeem(r.code)} disabled={busy}>Activate</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {status && status.history.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-ink">History</h2>
          <ul className="mt-2 divide-y divide-rim-subtle rounded-[var(--radius-lg)] border border-rim-subtle bg-card">
            {status.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-ink">+{h.daysAdded} days · {h.kind === 'REWARD' ? 'Monthly reward' : 'Activation code'}</span>
                <span className="text-xs text-ghost">{fmtDate(h.redeemedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-dim">Want Pro without a code? <Link href="/pricing" className="font-semibold text-ink underline underline-offset-2">See plans</Link>.</p>
    </div>
  )
}
