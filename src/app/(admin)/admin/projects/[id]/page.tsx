'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProjectForm } from '@/components/admin/ProjectForm'
import { adminGetProject } from '@/lib/api/admin-projects'

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const q = useQuery({ queryKey: ['admin-project', id], queryFn: () => adminGetProject(id) })
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Edit project</h1>
      <div className="mt-6">{q.data ? <ProjectForm key={q.data.updatedAt} project={q.data} /> : <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-raised" />}</div>
    </div>
  )
}
