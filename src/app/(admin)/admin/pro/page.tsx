'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Download, Gift, Ban } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Stat, Panel } from '@/components/admin/charts'
import {
  adminProOverview, adminCreateCodes, adminListCodes, adminRevokeCode, adminIssueRewards, adminRewardGrants, adminRunReminders,
  type CodeStatus,
} from '@/lib/api/pro'
import { ApiRequestError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

const STATUS_FILTERS = ['All', 'Active', 'Used up', 'Expired', 'Revoked']
const STATUS_MAP: Record<string, CodeStatus | undefined> = { All: undefined, Active: 'ACTIVE', 'Used up': 'USED_UP', Expired: 'EXPIRED', Revoked: 'REVOKED' }
const STATUS_TONE: Record<CodeStatus, string> = { ACTIVE: 'text-ink', USED_UP: 'text-dim', EXPIRED: 'text-dim', REVOKED: 'text-error' }
const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function previousMonth(): string {
  const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}

export default function AdminProPage() {
  const qc = useQueryClient()
  const [count, setCount] = useState(10)
  const [days, setDays] = useState(30)
  const [uses, setUses] = useState(1)
  const [validFor, setValidFor] = useState<number | ''>(90)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ codes: string[]; days: number } | null>(null)
  const [statusLabel, setStatusLabel] = useState('All')
  const [kind, setKind] = useState<'ALL' | 'ADMIN' | 'REWARD'>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState(previousMonth())
  const [rewardMsg, setRewardMsg] = useState<string | null>(null)

  const overview = useQuery({ queryKey: ['admin-pro-overview'], queryFn: adminProOverview })
  const list = useQuery({
    queryKey: ['admin-pro-codes', statusLabel, kind, search, page],
    queryFn: () => adminListCodes({ page, status: STATUS_MAP[statusLabel], kind: kind === 'ALL' ? undefined : kind, search: search.trim() || undefined }),
  })
  const grants = useQuery({ queryKey: ['admin-pro-grants', period], queryFn: () => adminRewardGrants(period), retry: false })

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['admin-pro-overview'] })
    void qc.invalidateQueries({ queryKey: ['admin-pro-codes'] })
    void qc.invalidateQueries({ queryKey: ['admin-pro-grants'] })
  }

  const [reminderMsg, setReminderMsg] = useState<string | null>(null)
  async function runReminders() {
    setReminderMsg(null)
    try {
      const r = await adminRunReminders()
      setReminderMsg(r.reminded ? `Sent ${r.reminded} reminder${r.reminded === 1 ? '' : 's'}.` : 'No one needs a reminder right now.')
    } catch { setReminderMsg('Could not send reminders.') }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setFresh(null)
    try {
      const r = await adminCreateCodes({ count, durationDays: days, maxRedemptions: uses, validForDays: validFor === '' ? undefined : validFor, note: note.trim() || undefined })
      setFresh({ codes: r.codes, days: r.durationDays })
      refresh()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not generate codes.')
    } finally { setBusy(false) }
  }

  async function issue() {
    setRewardMsg(null)
    try {
      const r = await adminIssueRewards(period)
      setRewardMsg(r.issued ? `Issued ${r.issued} reward${r.issued === 1 ? '' : 's'} for ${r.period}.` : `Nothing new to issue for ${r.period}${r.alreadyIssued ? ` (${r.alreadyIssued} already rewarded)` : ''}.`)
      refresh()
    } catch (err) {
      setRewardMsg(err instanceof ApiRequestError ? err.message : 'Could not issue rewards.')
    }
  }

  const numInput = 'w-full rounded-[var(--radius-md)] border border-rim bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand'
  const codes = list.data?.data ?? []
  const totalPages = (list.data?.meta as { totalPages?: number } | undefined)?.totalPages ?? 1

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Pro codes</h1>
        <p className="mt-1 text-sm text-dim">Generate activation codes, track redemptions, and issue the monthly leaderboard rewards.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active codes" value={overview.data?.activeCodes ?? 0} />
        <Stat label="Redemptions" value={overview.data?.totalRedemptions ?? 0} />
        <Stat label="On welcome trial" value={overview.data?.onTrial ?? 0} />
        <Stat label="Pro via code or reward" value={overview.data?.onCodePro ?? 0} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Generate codes" note="Each code adds Pro days to whoever redeems it. Time stacks on top of any Pro they already have.">
          <form onSubmit={generate} className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-dim">How many codes
              <input type="number" min={1} max={200} value={count} onChange={(e) => setCount(+e.target.value)} className={cn(numInput, 'mt-1')} />
            </label>
            <label className="text-xs font-medium text-dim">Days of Pro each
              <input type="number" min={1} max={366} value={days} onChange={(e) => setDays(+e.target.value)} className={cn(numInput, 'mt-1')} />
            </label>
            <label className="text-xs font-medium text-dim">Uses per code
              <input type="number" min={1} max={10000} value={uses} onChange={(e) => setUses(+e.target.value)} className={cn(numInput, 'mt-1')} />
            </label>
            <label className="text-xs font-medium text-dim">Redeem within (days, blank = never expires)
              <input type="number" min={1} max={730} value={validFor} onChange={(e) => setValidFor(e.target.value === '' ? '' : +e.target.value)} className={cn(numInput, 'mt-1')} />
            </label>
            <label className="col-span-2 text-xs font-medium text-dim">Note (who or what these are for)
              <input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Hackathon winners, Oct 2026" className={cn(numInput, 'mt-1')} />
            </label>
            <div className="col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={busy}>{busy ? 'Generating…' : `Generate ${count} code${count === 1 ? '' : 's'}`}</Button>
              {error && <p role="alert" className="text-sm font-medium text-error">{error}</p>}
            </div>
          </form>
          {fresh && (
            <div className="mt-4 rounded-[var(--radius-lg)] border border-brand bg-brand-muted p-3" data-testid="fresh-codes">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink">{fresh.codes.length} new code{fresh.codes.length === 1 ? '' : 's'} · {fresh.days} days each. Copy them now; they stay listed below.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(fresh.codes.join('\n'))}><Copy size={13} /> Copy all</Button>
                  <Button size="sm" variant="outline" onClick={() => download(`pro-codes-${Date.now()}.csv`, 'code,days\n' + fresh.codes.map((c) => `${c},${fresh.days}`).join('\n'))}><Download size={13} /> CSV</Button>
                </div>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto font-mono text-xs leading-relaxed text-ink">{fresh.codes.join('\n')}</pre>
            </div>
          )}
        </Panel>

        <Panel title="Ending-soon reminders" note="Learners whose Pro ends within 3 days get one email per end date. It also runs by itself, at most hourly, whenever someone opens their Pro page. Use this to run it right now.">
          <Button onClick={() => void runReminders()}>Send reminders now</Button>
          {reminderMsg && <p role="status" className="mt-2 text-sm font-medium text-ink">{reminderMsg}</p>}
        </Panel>

        <Panel title="Monthly rewards" note="The top learners by XP for a finished month each get a personal 30-day code. Safe to run twice: nobody is rewarded twice for one month. It also runs by itself the first time anyone opens their Pro page in a new month.">
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={period} max={previousMonth()} onChange={(e) => setPeriod(e.target.value)} aria-label="Month" className={cn(numInput, 'w-auto')} />
            <Button onClick={() => void issue()}><Gift size={14} /> Issue rewards</Button>
          </div>
          {rewardMsg && <p role="status" className="mt-2 text-sm font-medium text-ink">{rewardMsg}</p>}
          <div className="mt-4">
            {grants.isLoading ? <Skeleton className="h-24" /> : (grants.data?.grants.length ?? 0) === 0 ? <p className="text-sm text-dim">No one has been rewarded for {period} yet.</p> : (
              <table className="w-full text-left text-xs">
                <thead className="text-ghost"><tr><th className="py-1.5 font-medium">#</th><th className="font-medium">Learner</th><th className="text-right font-medium">XP</th><th className="text-right font-medium">Code</th></tr></thead>
                <tbody className="divide-y divide-rim-subtle">
                  {grants.data!.grants.map((g) => (
                    <tr key={g.username}><td className="py-2 text-dim">{g.rank}</td><td className="text-ink">{g.displayName} <span className="text-ghost">@{g.username}</span></td><td className="text-right tabular-nums text-dim">{g.xp}</td>
                      <td className="text-right font-mono text-dim">{g.redeemed ? 'redeemed' : g.code}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="All codes">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <SegmentedControl options={STATUS_FILTERS} value={statusLabel} onChange={(v) => { setStatusLabel(v); setPage(1) }} />
          <SegmentedControl options={['All kinds', 'Admin', 'Reward']} value={kind === 'ALL' ? 'All kinds' : kind === 'ADMIN' ? 'Admin' : 'Reward'} onChange={(v) => { setKind(v === 'Admin' ? 'ADMIN' : v === 'Reward' ? 'REWARD' : 'ALL'); setPage(1) }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search code or note" aria-label="Search codes" className={cn(numInput, 'w-56')} />
        </div>
        {list.isLoading ? <Skeleton className="h-48" /> : codes.length === 0 ? <p className="text-sm text-dim">No codes match.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="codes-table">
              <thead className="text-ghost"><tr><th className="py-1.5 pr-3 font-medium">Code</th><th className="px-2 font-medium">Kind</th><th className="px-2 text-right font-medium">Days</th><th className="px-2 text-right font-medium">Used</th><th className="px-2 font-medium">Status</th><th className="px-2 font-medium">Expires</th><th className="px-2 font-medium">Note</th><th /></tr></thead>
              <tbody className="divide-y divide-rim-subtle">
                {codes.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 pr-3 font-mono text-ink">{c.code}</td>
                    <td className="px-2 text-dim">{c.kind === 'REWARD' ? `Reward${c.assignedTo ? ` · @${c.assignedTo}` : ''}` : 'Admin'}</td>
                    <td className="px-2 text-right tabular-nums text-dim">{c.durationDays}</td>
                    <td className="px-2 text-right tabular-nums text-dim">{c.redemptionCount}/{c.maxRedemptions}</td>
                    <td className={cn('px-2 font-semibold', STATUS_TONE[c.status])}>{c.status.replace('_', ' ').toLowerCase()}</td>
                    <td className="px-2 text-dim">{c.expiresAt ? fmt(c.expiresAt) : 'never'}</td>
                    <td className="max-w-[12rem] truncate px-2 text-dim" title={c.note ?? ''}>{c.note ?? ''}</td>
                    <td className="pl-2 text-right">
                      <button onClick={() => void navigator.clipboard?.writeText(c.code)} aria-label={`Copy ${c.code}`} className="rounded p-1 text-ghost hover:text-ink"><Copy size={13} /></button>
                      {c.status === 'ACTIVE' && (
                        <button onClick={() => { if (confirm(`Revoke ${c.code}? It can no longer be redeemed.`)) void adminRevokeCode(c.id).then(refresh) }} aria-label={`Revoke ${c.code}`} className="rounded p-1 text-ghost hover:text-error"><Ban size={13} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-xs text-dim">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
