'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { FolderCheck } from 'lucide-react'
import { getMySubmissions } from '@/lib/api/projects'

const LABEL = { APPROVED: 'Approved', NEEDS_REVISION: 'Needs revision', PENDING: 'In review' } as const
const TONE = { APPROVED: 'text-success', NEEDS_REVISION: 'text-warning', PENDING: 'text-dim' } as const

/** Where the learner stands on the projects they have submitted. Hidden until they have submitted one. */
export function ProjectProgress() {
  const { data } = useQuery({ queryKey: ['my-submissions'], queryFn: getMySubmissions })
  if (!data || data.length === 0) return null
  const count = (s: keyof typeof LABEL): number => data.filter((x) => x.status === s).length
  const needs = data.filter((x) => x.status === 'NEEDS_REVISION')

  return (
    <section data-testid="project-progress" className="rounded-[var(--radius-xl)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
        <FolderCheck size={16} /> Your projects
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {(['APPROVED', 'PENDING', 'NEEDS_REVISION'] as const).map((s) => (
          <div key={s} className="rounded-[var(--radius-md)] bg-raised py-2">
            <dd className={`font-display text-xl font-bold ${TONE[s]}`}>{count(s)}</dd>
            <dt className="text-[11px] text-dim">{LABEL[s]}</dt>
          </div>
        ))}
      </dl>
      {needs.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {needs.map((n) => (
            <li key={n.id}>
              <Link href={`/projects/${n.project.id}`} className="text-sm font-medium text-brand hover:underline">
                Changes requested: {n.project.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/projects" className="mt-3 inline-block text-xs font-medium text-dim hover:text-ink">Browse projects</Link>
    </section>
  )
}
