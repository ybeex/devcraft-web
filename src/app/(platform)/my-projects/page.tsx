'use client'

import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Clock, Download, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { downloadStarter, getMyStarted, type StartedProject } from '@/lib/api/projects'

const STATUS: Record<string, string> = { PENDING: 'Submitted · in review', APPROVED: 'Approved', NEEDS_REVISION: 'Needs revision' }

function Row({ p }: { p: StartedProject }) {
  const dl = useMutation({ mutationFn: () => downloadStarter(p.id, p.starterName ?? undefined) })
  return (
    <li className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4 sm:flex-row sm:items-center" data-testid="my-project">
      {p.thumbnailUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={p.thumbnailUrl} alt="" className="h-24 w-full rounded-[var(--radius-md)] object-cover sm:w-40" />
        : <div className="hidden h-24 w-40 rounded-[var(--radius-md)] bg-raised sm:block" />}
      <div className="min-w-0 flex-1">
        <Link href={`/projects/${p.id}`} className="font-display text-lg font-semibold text-ink hover:text-brand">{p.title}</Link>
        <p className="mt-0.5 text-xs text-ghost">{p.module.track.slug} · {p.module.title} · started {new Date(p.startedAt).toLocaleDateString()}</p>
        <p className="mt-1.5 flex items-center gap-3 text-xs text-dim">
          <span className="flex items-center gap-1"><Clock size={12} /> {p.estimatedHours}h</span>
          <span className="font-semibold text-brand">+{p.xpReward} XP</span>
          <span>{p.submissionStatus ? STATUS[p.submissionStatus] : 'Not submitted yet'}</span>
        </p>
        {dl.isError && <p role="alert" className="mt-1 text-xs text-error">The starter could not be downloaded.</p>}
      </div>
      <div className="flex gap-2">
        {p.hasStarter && <Button variant="outline" size="sm" onClick={() => dl.mutate()} disabled={dl.isPending}><Download size={13} /> Starter</Button>}
        <Link href={`/projects/${p.id}`}><Button size="sm">{p.submissionStatus ? 'Open' : 'Continue'}</Button></Link>
      </div>
    </li>
  )
}

export default function MyProjectsPage() {
  const q = useQuery({ queryKey: ['my-started'], queryFn: getMyStarted })
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">My projects</h1>
      <p className="mt-1 text-sm text-dim">Projects you have started, newest first.</p>
      <div className="mt-6">
        {q.isLoading && <Skeleton className="h-28 w-full" />}
        {q.data && q.data.length > 0 && <ul className="flex flex-col gap-3">{q.data.map((p) => <Row key={p.id} p={p} />)}</ul>}
        {q.data?.length === 0 && (
          <EmptyState icon={<FolderOpen />} headline="No projects started yet" body="Open a project and press Start to add it here and get its starter files." action={<Link href="/projects"><Button size="sm">Browse projects</Button></Link>} />
        )}
      </div>
    </div>
  )
}
