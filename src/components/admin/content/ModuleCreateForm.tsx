'use client'

import { useState } from 'react'
import { createAdminModule } from '@/lib/api/admin'
import { TextField, TextAreaField, NumberField } from './FormFields'
import { useContentSave } from './useContentSave'
import { Button } from '@/components/ui/Button'

interface ModuleCreateFormProps {
  trackId: string
  nextOrder: number
  onDone: () => void
  onSaved: () => void
}

/** Slugs aren't user-facing anywhere else in this admin UI (tracks/questions don't expose theirs), but modules and lessons need one at creation time since the schema requires a unique slug with no auto-generation. */
export function ModuleCreateForm({ trackId, nextOrder, onDone, onSaved }: ModuleCreateFormProps) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState(nextOrder)
  const { isSaving, error, save } = useContentSave()

  const canSave = title.length >= 3 && /^[a-z0-9-]+$/.test(slug) && description.length >= 10

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-rim-subtle bg-canvas p-4">
      <TextField label="Title" value={title} onChange={setTitle} placeholder="Async JavaScript" />
      <TextField
        label="Slug"
        value={slug}
        onChange={(v) => setSlug(v.toLowerCase())}
        placeholder="async-javascript"
        hint="Lowercase letters, numbers, hyphens only — can't be changed later"
      />
      <TextAreaField label="Description" value={description} onChange={setDescription} rows={2} hint="At least 10 characters" />
      <NumberField label="Order" value={order} onChange={setOrder} min={0} />

      {error && <p className="text-xs font-medium text-error">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={isSaving || !canSave}
          onClick={() =>
            save(
              () => createAdminModule({ trackId, slug, title, description, order }),
              onSaved
            )
          }
        >
          {isSaving ? 'Creating…' : 'Create module'}
        </Button>
      </div>
    </div>
  )
}
