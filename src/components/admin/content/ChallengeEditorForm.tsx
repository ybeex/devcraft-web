'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createAdminChallenge, updateAdminChallenge, type SystemDesignChallenge, type ContentDifficulty } from '@/lib/api/admin'
import { TextField, TextAreaField, NumberField, SelectField, ToggleField } from './FormFields'
import { useContentSave } from './useContentSave'
import { Button } from '@/components/ui/Button'

const TRACK_OPTIONS: { value: 'FE' | 'BE'; label: string }[] = [
  { value: 'FE', label: 'Frontend' },
  { value: 'BE', label: 'Backend' },
]

const DIFFICULTY_OPTIONS: { value: ContentDifficulty; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
]

interface ChallengeEditorFormProps {
  challengeId?: string
  initial?: SystemDesignChallenge
}

export function ChallengeEditorForm({ challengeId, initial }: ChallengeEditorFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!challengeId && !!initial

  const [track, setTrack] = useState<'FE' | 'BE'>(initial?.track ?? 'FE')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [scenario, setScenario] = useState(initial?.scenario ?? '')
  const [difficulty, setDifficulty] = useState<ContentDifficulty>(initial?.difficulty ?? 'INTERMEDIATE')
  const [estimatedMins, setEstimatedMins] = useState(initial?.estimatedMins ?? 45)
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false)
  const [isPremium, setIsPremium] = useState(initial?.isPremium ?? false)
  const { isSaving, error, save } = useContentSave()

  const canSave = title.length >= 3 && (isEdit || /^[a-z0-9-]+$/.test(slug)) && scenario.length >= 30

  function handleSave() {
    if (isEdit && challengeId) {
      save(
        () => updateAdminChallenge(challengeId, { track, title, scenario, difficulty, estimatedMins, order, isPublished, isPremium }),
        () => queryClient.invalidateQueries({ queryKey: ['admin-challenge-detail', challengeId] })
      )
    } else {
      save(
        () => createAdminChallenge({ track, slug, title, scenario, difficulty, estimatedMins, order, isPublished, isPremium }),
        (created) => router.push(`/admin/content/system-design/${created.id}`)
      )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SelectField label="Track" value={track} onChange={setTrack} options={TRACK_OPTIONS} />
        <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
        <NumberField label="Order" value={order} onChange={setOrder} min={0} />
      </div>

      <TextField label="Title" value={title} onChange={setTitle} placeholder="Design a URL Shortener" />

      {!isEdit && (
        <TextField
          label="Slug"
          value={slug}
          onChange={(v) => setSlug(v.toLowerCase())}
          placeholder="design-a-url-shortener"
          hint="Lowercase letters, numbers, hyphens only — can't be changed later"
        />
      )}

      <TextAreaField label="Scenario" value={scenario} onChange={setScenario} rows={5} hint="The prompt shown before any stages — at least 30 characters" />

      <NumberField label="Estimated minutes" value={estimatedMins} onChange={setEstimatedMins} min={5} max={300} />

      <div className="grid grid-cols-2 gap-4">
        <ToggleField label="Published" checked={isPublished} onChange={setIsPublished} />
        <ToggleField label="Premium" checked={isPremium} onChange={setIsPremium} hint="Restrict to paid tiers" />
      </div>

      {error && <p className="text-sm font-medium text-error">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-rim-subtle pt-4">
        <Button variant="ghost" onClick={() => router.push('/admin/content/system-design')}>
          {isEdit ? 'Back to list' : 'Cancel'}
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !canSave}>
          {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create challenge'}
        </Button>
      </div>
    </div>
  )
}
