'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Globe, Trash2 } from 'lucide-react'
import { adminDeletePreview, adminPreviews } from '@/lib/api/previews'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiRequestError } from '@/lib/api/client'

export default function PreviewsAdminPage() {
  const qc = useQueryClient()
  const [msg, setMsg] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['admin-previews'], queryFn: () => adminPreviews(100, 0) })
  const del = useMutation({
    mutationFn: adminDeletePreview,
    onSuccess: () => { setMsg('Preview removed.'); void qc.invalidateQueries({ queryKey: ['admin-previews'] }) },
    onError: (e) => setMsg(e instanceof ApiRequestError ? e.message : 'Could not remove it.'),
  })
  const d = q.data
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Hosted previews</h1>
        <p className="mt-1 text-sm text-dim">Pages Pro learners published. {d ? `${d.total} in total.` : ''} Remove anything reported or abusive; the link stops working at once.</p>
      </div>
      {msg && <p role="status" className="text-sm text-dim">{msg}</p>}
      {d && !d.enabled && <p className="rounded-[var(--radius-md)] border border-rim-subtle bg-card p-4 text-sm text-dim">Previews are switched off (PREVIEW_HOST_SUFFIX is unset).</p>}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-rim-subtle">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-raised text-left text-xs text-dim"><tr><th className="px-3 py-2">Page</th><th className="px-3 py-2">Owner</th><th className="px-3 py-2">Views</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {d?.rows.map((r) => (
              <tr key={r.id} className="border-t border-rim-subtle">
                <td className="px-3 py-2"><p className="font-medium text-ink">{r.title}</p><a href={r.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-brand">{r.url}</a></td>
                <td className="px-3 py-2"><p className="text-ink">{r.username}</p><p className="text-xs text-ghost">{r.email}</p></td>
                <td className="px-3 py-2 text-dim">{r.viewCount}</td>
                <td className="px-3 py-2 text-dim">{new Date(r.updatedAt).toLocaleDateString()}</td>
                <td className="px-3 py-2"><button onClick={() => { if (window.confirm(`Remove "${r.title}"?`)) del.mutate(r.id) }} className="flex items-center gap-1 text-xs text-error"><Trash2 size={12} /> Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {d && d.rows.length === 0 && <EmptyState icon={<Globe />} headline="No previews yet" body="They appear here when Pro learners publish pages." />}
      </div>
    </div>
  )
}
