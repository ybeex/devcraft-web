'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Pencil, BookOpen } from 'lucide-react'
import { getAdminModule, updateAdminModule, type AdminModuleSummary } from '@/lib/api/admin'
import { TextField, TextAreaField, NumberField, ToggleField, TagsField } from './FormFields'
import { ConflictNotice } from './ConflictNotice'
import { useContentSave } from './useContentSave'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface ModuleRowProps {
  module: AdminModuleSummary
  onSaved: () => void
}

export function ModuleRow({ module: mod, onSaved }: ModuleRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  // The nested summary from GET /admin/tracks doesn't include updatedAt, so
  // a quick toggle here needs one fetch first for the optimistic-lock check
  // — still a single click from the admin's side, just two requests behind it.
  async function handleQuickToggle() {
    setIsToggling(true)
    setToggleError(null)
    try {
      const fresh = await getAdminModule(mod.id)
      await updateAdminModule(mod.id, { isPublished: !fresh.isPublished, expectedUpdatedAt: fresh.updatedAt })
      onSaved()
    } catch {
      setToggleError("Couldn't update — try the full edit form instead.")
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{mod.title}</p>
          <p className="text-xs text-dim">
            #{mod.order}
            {mod.isPremium && ' · Premium'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={isToggling}
            onClick={handleQuickToggle}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-50',
              mod.isPublished ? 'bg-success/15 text-success' : 'bg-raised text-dim'
            )}
          >
            {mod.isPublished ? 'Published' : 'Draft'}
          </button>
          <Link
            href={`/admin/content/modules/${mod.id}/lessons`}
            className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium text-dim hover:bg-raised hover:text-ink"
          >
            <BookOpen size={13} /> Lessons
          </Link>
          <Button variant="ghost" size="sm" className="px-2" onClick={() => setIsEditing((v) => !v)}>
            <Pencil size={13} />
          </Button>
        </div>
      </div>

      {toggleError && <p className="px-5 pb-2 text-xs font-medium text-error">{toggleError}</p>}

      {isEditing && (
        <div className="bg-canvas px-5 py-4">
          <ModuleEditForm moduleId={mod.id} onDone={() => setIsEditing(false)} onSaved={onSaved} />
        </div>
      )}
    </div>
  )
}

function ModuleEditForm({ moduleId, onDone, onSaved }: { moduleId: string; onDone: () => void; onSaved: () => void }) {
  const { data: fullModule, isLoading } = useQuery({
    queryKey: ['admin-module-detail', moduleId],
    queryFn: () => getAdminModule(moduleId),
  })

  if (isLoading || !fullModule) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
        <Skeleton className="h-20 w-full rounded-[var(--radius-md)]" />
      </div>
    )
  }

  return <ModuleEditFormFields fullModule={fullModule} onDone={onDone} onSaved={onSaved} />
}

function ModuleEditFormFields({
  fullModule,
  onDone,
  onSaved,
}: {
  fullModule: Awaited<ReturnType<typeof getAdminModule>>
  onDone: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(fullModule.title)
  const [description, setDescription] = useState(fullModule.description)
  const [objectives, setObjectives] = useState(fullModule.objectives)
  const [order, setOrder] = useState(fullModule.order)
  const [estimatedHours, setEstimatedHours] = useState(fullModule.estimatedHours)
  const [isPremium, setIsPremium] = useState(fullModule.isPremium)
  const { isSaving, error, conflictId, save } = useContentSave()

  function handleSave() {
    save(
      () =>
        updateAdminModule(fullModule.id, {
          title,
          description,
          objectives,
          order,
          estimatedHours,
          isPremium,
          expectedUpdatedAt: fullModule.updatedAt,
        }),
      () => {
        onSaved()
        onDone()
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField label="Title" value={title} onChange={setTitle} />
      <TextAreaField label="Description" value={description} onChange={setDescription} rows={3} />
      <TagsField label="Objectives" value={objectives} onChange={setObjectives} placeholder="Add an objective, press Enter" />
      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Order" value={order} onChange={setOrder} min={0} />
        <NumberField label="Estimated hours" value={estimatedHours} onChange={setEstimatedHours} min={0} step={0.5} />
      </div>
      <ToggleField label="Premium" checked={isPremium} onChange={setIsPremium} hint="Restrict this module to paid tiers" />

      {conflictId && <ConflictNotice conflictId={conflictId} />}
      {error && <p className="text-xs font-medium text-error">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
