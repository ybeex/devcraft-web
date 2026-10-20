'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Database, Trash2 } from 'lucide-react'
import { adminSandboxes, adminSweepSandboxes } from '@/lib/api/sandbox'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiRequestError } from '@/lib/api/client'

const mb = (b: number) => (b >= 1_073_741_824 ? `${(b / 1_073_741_824).toFixed(2)} GB` : `${(b / 1_048_576).toFixed(1)} MB`)
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4">
      <p className="text-xs font-medium text-ghost">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  )
}

export default function PracticeDbAdminPage() {
  const qc = useQueryClient()
  const [msg, setMsg] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['admin-sandboxes'], queryFn: () => adminSandboxes(100, 0) })
  const sweep = useMutation({
    mutationFn: adminSweepSandboxes,
    onSuccess: (r) => { setMsg(`Removed ${r.expired} idle and ${r.orphans} orphaned practice database${r.expired + r.orphans === 1 ? '' : 's'}.`); void qc.invalidateQueries({ queryKey: ['admin-sandboxes'] }) },
    onError: (e) => setMsg(e instanceof ApiRequestError ? e.message : 'The clean-up failed.'),
  })
  const d = q.data

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Practice databases</h1>
          <p className="mt-1 text-sm text-dim">Each Pro learner has a private copy of the shop. Idle ones are removed after {d?.idleDays ?? 90} days; the learner simply gets a fresh one next time.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setMsg(null); sweep.mutate() }} disabled={sweep.isPending || !d?.enabled}>
          <Trash2 size={13} /> {sweep.isPending ? 'Cleaning…' : 'Run clean-up now'}
        </Button>
      </div>
      {msg && <p role="status" className="text-sm text-dim">{msg}</p>}

      {d && !d.enabled && <p className="rounded-[var(--radius-md)] border border-rim-subtle bg-card p-4 text-sm text-dim">The practice database is not configured (SANDBOX_DATABASE_URL is unset), so sizes are not available.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Practice databases" value={d?.totalSandboxes ?? 0} />
        <Stat label="Total size" value={mb(d?.totalBytes ?? 0)} />
        <Stat label="Expiring within 14 days" value={d?.expiringSoon ?? 0} />
        <Stat label="Limit per learner" value={mb(d?.quotaBytes ?? 0)} />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-rim-subtle">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-raised text-left text-xs text-dim">
            <tr><th className="px-3 py-2">Learner</th><th className="px-3 py-2">Size</th><th className="px-3 py-2">Queries</th><th className="px-3 py-2">Resets</th><th className="px-3 py-2">Last used</th><th className="px-3 py-2">Expires</th></tr>
          </thead>
          <tbody>
            
            {d?.rows.map((r) => (
              <tr key={r.userId} className="border-t border-rim-subtle">
                <td className="px-3 py-2"><p className="font-medium text-ink">{r.username}</p><p className="text-xs text-ghost">{r.email}</p></td>
                <td className="px-3 py-2 text-ink">{mb(r.sizeBytes)}</td>
                <td className="px-3 py-2 text-dim">{r.queryCount.toLocaleString()}</td>
                <td className="px-3 py-2 text-dim">{r.resetCount}</td>
                <td className="px-3 py-2 text-dim">{when(r.lastUsedAt)}</td>
                <td className={`px-3 py-2 ${r.expiresInDays <= 14 ? 'text-error' : 'text-dim'}`}>in {Math.max(r.expiresInDays, 0)} days</td>
              </tr>
            ))}
          </tbody>
        </table>
        {d && d.rows.length === 0 && <EmptyState icon={<Database />} headline="No practice databases yet" body="One is created the first time a Pro learner opens the Practice database page or a database lesson." />}
      </div>
    </div>
  )
}
