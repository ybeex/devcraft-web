'use client'

import { useState } from 'react'
import { Pencil, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { updateAdminTrack, createAdminTrack, type AdminTrack } from '@/lib/api/admin'
import { TextField, TextAreaField, NumberField, ToggleField } from './FormFields'
import { ConflictNotice } from './ConflictNotice'
import { useContentSave } from './useContentSave'
import { ModuleRow } from './ModuleRow'
import { ModuleCreateForm } from './ModuleCreateForm'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const TRACK_BADGE: Record<'FE' | 'BE', string> = { FE: 'bg-fe/15 text-fe', BE: 'bg-be/15 text-be' }

interface TrackCardProps {
  track: AdminTrack
  onSaved: () => void
}

export function TrackCard({ track, onSaved }: TrackCardProps) {
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [isTogglingPublish, setIsTogglingPublish] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  async function handleQuickToggle() {
    setIsTogglingPublish(true)
    setToggleError(null)
    try {
      await updateAdminTrack(track.id, { isPublished: !track.isPublished, expectedUpdatedAt: track.updatedAt })
      onSaved()
    } catch {
      setToggleError("Couldn't update — try the full edit form instead.")
    } finally {
      setIsTogglingPublish(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-rim-subtle bg-card shadow-elev-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', TRACK_BADGE[track.slug])}>{track.slug}</span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{track.name}</h2>
            <p className="text-xs text-dim">
              {track.modules.length} module{track.modules.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isTogglingPublish}
            onClick={handleQuickToggle}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50',
              track.isPublished ? 'bg-success/15 text-success' : 'bg-raised text-dim'
            )}
          >
            {track.isPublished ? 'Published' : 'Draft'}
          </button>
          <Button variant="outline" size="sm" onClick={() => setIsEditingMeta((v) => !v)}>
            <Pencil size={14} /> Edit
          </Button>
        </div>
      </div>

      {toggleError && <p className="px-5 pb-3 text-xs font-medium text-error">{toggleError}</p>}

      {isEditingMeta && (
        <div className="border-t border-rim-subtle bg-canvas p-5">
          <TrackEditForm track={track} onDone={() => setIsEditingMeta(false)} onSaved={onSaved} />
        </div>
      )}

      <div className="divide-y divide-rim-subtle border-t border-rim-subtle">
        {track.modules.length === 0 && !isCreatingModule && (
          <p className="px-5 py-4 text-sm text-dim">No modules yet.</p>
        )}
        {track.modules.map((mod) => (
          <ModuleRow key={mod.id} module={mod} onSaved={onSaved} />
        ))}
      </div>

      <div className="border-t border-rim-subtle p-3">
        {isCreatingModule ? (
          <ModuleCreateForm
            trackId={track.id}
            nextOrder={track.modules.length}
            onDone={() => setIsCreatingModule(false)}
            onSaved={() => {
              setIsCreatingModule(false)
              onSaved()
            }}
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsCreatingModule(true)}>
            <Plus size={14} /> Add module
          </Button>
        )}
      </div>
    </div>
  )
}

function TrackEditForm({ track, onDone, onSaved }: { track: AdminTrack; onDone: () => void; onSaved: () => void }) {
  const [name, setName] = useState(track.name)
  const [description, setDescription] = useState(track.description)
  const [accentColor, setAccentColor] = useState(track.accentColor)
  const [order, setOrder] = useState(track.order)
  const { isSaving, error, conflictId, save } = useContentSave()

  function handleSave() {
    save(
      () => updateAdminTrack(track.id, { name, description, accentColor, order, expectedUpdatedAt: track.updatedAt }),
      () => {
        onSaved()
        onDone()
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <TextField label="Name" value={name} onChange={setName} />
      <TextAreaField label="Description" value={description} onChange={setDescription} rows={3} hint="10–500 characters" />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Accent color" value={accentColor} onChange={setAccentColor} placeholder="#6366F1" />
        <NumberField label="Order" value={order} onChange={setOrder} min={0} />
      </div>

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

export function TrackCreatePrompt({ slug, onCreated }: { slug: 'FE' | 'BE'; onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { isSaving, error, save } = useContentSave()

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-rim bg-canvas py-6 text-sm font-medium text-dim hover:border-brand hover:text-brand"
      >
        <Plus size={16} /> Create {slug} track
      </button>
    )
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-5 shadow-elev-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink">New {slug} track</h3>
        <button type="button" onClick={() => setIsOpen(false)} className="text-dim hover:text-ink">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <TextField label="Name" value={name} onChange={setName} placeholder={slug === 'FE' ? 'Frontend Engineering' : 'Backend Engineering'} />
        <TextAreaField label="Description" value={description} onChange={setDescription} rows={3} hint="10–500 characters" />
        {error && <p className="text-xs font-medium text-error">{error}</p>}
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={isSaving || name.length < 2 || description.length < 10}
            onClick={() =>
              save(
                () => createAdminTrack({ slug, name, description }),
                () => {
                  setIsOpen(false)
                  onCreated()
                }
              )
            }
          >
            {isSaving ? 'Creating…' : 'Create track'}
          </Button>
        </div>
      </div>
    </div>
  )
}
