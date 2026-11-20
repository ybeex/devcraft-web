'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileArchive, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { SelectField, TagsField, TextAreaField, TextField, NumberField, ToggleField } from '@/components/admin/content/FormFields'
import { listAdminTracks } from '@/lib/api/admin'
import { adminCreateProject, adminRemoveStarter, adminUpdateProject, adminUploadStarter, type AdminProject } from '@/lib/api/admin-projects'
import { ApiRequestError } from '@/lib/api/client'

const fmt = (n: number | null) => (n === null ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export function ProjectForm({ project }: { project?: AdminProject }) {
  const router = useRouter()
  const qc = useQueryClient()
  const zipInput = useRef<HTMLInputElement>(null)
  const tracks = useQuery({ queryKey: ['admin-tracks'], queryFn: listAdminTracks })
  const [title, setTitle] = useState(project?.title ?? '')
  const [slug, setSlug] = useState(project?.slug ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [moduleId, setModuleId] = useState(project?.moduleId ?? '')
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(project?.difficulty ?? 'BEGINNER')
  const [hours, setHours] = useState(project?.estimatedHours ?? 4)
  const [xp, setXp] = useState(project?.xpReward ?? 500)
  const [isPremium, setIsPremium] = useState(project?.isPremium ?? false)
  const [isPublished, setIsPublished] = useState(project?.isPublished ?? true)
  const [techStack, setTechStack] = useState<string[]>(project?.techStack ?? [])
  const [requirements, setRequirements] = useState<string[]>(project?.requirements ?? [])
  const [outcomes, setOutcomes] = useState<string[]>(project?.outcomes ?? [])
  const [thumb, setThumb] = useState<string | null>(project?.thumbnailUrl ?? null)
  const [zip, setZip] = useState<File | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const modules = (tracks.data ?? []).flatMap((t) => t.modules.map((m) => ({ value: m.id, label: `${t.slug} · ${m.title}` })))
  const effectiveModule = moduleId || modules[0]?.value || ''

  const save = useMutation({
    mutationFn: async () => {
      const body = { moduleId: effectiveModule, title, description, difficulty, estimatedHours: hours, xpReward: xp, isPremium, isPublished, techStack, requirements, outcomes, thumbnailUrl: thumb }
      let id = project?.id
      if (id) await adminUpdateProject(id, { ...body, ...(slug ? { slug } : {}) })
      else id = (await adminCreateProject({ ...body, ...(slug ? { slug } : {}) })).id
      if (zip) await adminUploadStarter(id, zip)
      return id
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ['admin-projects'] }); void qc.invalidateQueries({ queryKey: ['admin-project', id] })
      if (project) { setZip(null); setMsg({ ok: true, text: 'Saved.' }) } else router.push('/admin/projects')
    },
    onError: (e) => setMsg({ ok: false, text: e instanceof ApiRequestError || e instanceof Error ? e.message : 'Could not save.' }),
  })
  const removeStarter = useMutation({
    mutationFn: () => adminRemoveStarter(project!.id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin-project', project!.id] }); router.refresh(); setMsg({ ok: true, text: 'Starter removed.' }) },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); setMsg(null); save.mutate() }} className="flex flex-col gap-6" data-testid="project-form">
      <ImageUpload label="Thumbnail" kind="thumbnail" value={thumb} onChange={setThumb} hint="Shown on the project card and page. PNG, JPEG, WebP or GIF, up to 2 MB." />

      <section className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4">
        <p className="text-sm font-semibold text-ink">Starter project (.zip)</p>
        <p className="mt-1 text-xs text-dim">Learners get this file only after they press Start on the project.</p>
        {project?.hasStarter && !zip && (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink"><FileArchive size={15} /> {project.starterName} <span className="text-xs text-ghost">{fmt(project.starterSize)}</span>
            <button type="button" onClick={() => removeStarter.mutate()} className="ml-2 flex items-center gap-1 text-xs text-error"><Trash2 size={12} /> Remove</button></p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <input ref={zipInput} type="file" accept=".zip,application/zip" className="sr-only" aria-label="Starter zip" data-testid="upload-starter" onChange={(e) => setZip(e.target.files?.[0] ?? null)} />
          <Button type="button" variant="outline" size="sm" onClick={() => zipInput.current?.click()}>{project?.hasStarter || zip ? 'Choose a different zip' : 'Choose zip'}</Button>
          {zip && <span className="text-sm text-dim">{zip.name} · {fmt(zip.size)} — uploads when you save</span>}
        </div>
      </section>

      <TextField label="Title" value={title} onChange={setTitle} maxLength={200} />
      <TextField label="Slug (optional)" value={slug} onChange={setSlug} placeholder="made from the title when empty" hint="Lowercase letters, numbers and dashes." />
      <TextAreaField label="Description" value={description} onChange={setDescription} rows={5} />
      <SelectField label="Module" value={effectiveModule} onChange={setModuleId} options={modules} hint="The module decides which track's learners see this project." />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={[{ value: 'BEGINNER', label: 'Beginner' }, { value: 'INTERMEDIATE', label: 'Intermediate' }, { value: 'ADVANCED', label: 'Advanced' }]} />
        <NumberField label="Estimated hours" value={hours} onChange={setHours} min={1} max={200} />
        <NumberField label="XP reward" value={xp} onChange={setXp} min={0} max={5000} />
      </div>
      <TagsField label="Tech stack" value={techStack} onChange={setTechStack} placeholder="React, Fastify…" />
      <TagsField label="Requirements" value={requirements} onChange={setRequirements} placeholder="Type a requirement and press Enter" />
      <TagsField label="What learners will practise" value={outcomes} onChange={setOutcomes} placeholder="Type an outcome and press Enter" />
      <div className="grid gap-4 sm:grid-cols-2">
        <ToggleField label="Pro only" checked={isPremium} onChange={setIsPremium} />
        <ToggleField label="Published" checked={isPublished} onChange={setIsPublished} hint="Unpublished projects are hidden from learners." />
      </div>

      {msg && <p role="status" className={msg.ok ? 'text-sm text-[var(--positive-text)]' : 'text-sm text-error'}>{msg.text}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={save.isPending || !title || !description || !effectiveModule}>
          {save.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : project ? 'Save changes' : 'Create project'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/projects')}>Cancel</Button>
      </div>
    </form>
  )
}
