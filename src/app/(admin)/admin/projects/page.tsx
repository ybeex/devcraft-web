'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileArchive, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { adminDeleteProject, adminListProjects } from '@/lib/api/admin-projects'

export default function AdminProjectsPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin-projects'], queryFn: adminListProjects })
  const del = useMutation({ mutationFn: adminDeleteProject, onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-projects'] }) })
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-dim">Capstone and challenge projects, each with a thumbnail and a starter zip learners download after pressing Start.</p>
        </div>
        <Link href="/admin/projects/new"><Button size="sm"><Plus size={14} /> New project</Button></Link>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-rim-subtle">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-raised text-left text-xs text-dim"><tr><th className="px-3 py-2">Project</th><th className="px-3 py-2">Track</th><th className="px-3 py-2">Level</th><th className="px-3 py-2">Starter</th><th className="px-3 py-2">Started by</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {q.data?.map((p) => (
              <tr key={p.id} className="border-t border-rim-subtle">
                <td className="px-3 py-2">
                  <Link href={`/admin/projects/${p.id}`} className="flex items-center gap-3">
                    {p.thumbnailUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.thumbnailUrl} alt="" className="h-9 w-14 rounded object-cover" />
                      : <span className="h-9 w-14 rounded bg-raised" />}
                    <span className="font-medium text-ink hover:text-brand">{p.title}</span>
                  </Link>
                </td>
                <td className="px-3 py-2 text-dim">{p.trackSlug}</td>
                <td className="px-3 py-2 text-dim">{p.difficulty.toLowerCase()}</td>
                <td className="px-3 py-2 text-dim">{p.hasStarter ? <span className="flex items-center gap-1"><FileArchive size={13} /> yes</span> : '—'}</td>
                <td className="px-3 py-2 text-dim">{p.startCount}</td>
                <td className="px-3 py-2 text-dim">{p.isPublished ? 'Published' : 'Hidden'}{p.isPremium ? ' · Pro' : ''}</td>
                <td className="px-3 py-2"><button onClick={() => { if (window.confirm(`Delete "${p.title}"? Learner starts and submissions go with it.`)) del.mutate(p.id) }} className="flex items-center gap-1 text-xs text-error"><Trash2 size={12} /> Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {q.data?.length === 0 && <p className="p-6 text-center text-sm text-dim">No projects yet.</p>}
      </div>
    </div>
  )
}
