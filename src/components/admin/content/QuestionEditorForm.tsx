'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminQuestion, updateAdminQuestion, type AdminQuestion, type ContentDifficulty } from '@/lib/api/admin'
import { TextField, TextAreaField, NumberField, SelectField, ToggleField } from './FormFields'
import { CodeField } from './CodeField'
import { ConflictNotice } from './ConflictNotice'
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

interface QuestionEditorFormProps {
  questionId?: string
  initial?: AdminQuestion
  /** Preselects the track when arriving from a filtered browser view — ignored once editing an existing question, which has its own track. */
  defaultTrack?: 'FE' | 'BE'
}

export function QuestionEditorForm({ questionId, initial, defaultTrack }: QuestionEditorFormProps) {
  const router = useRouter()
  const isEdit = !!questionId && !!initial

  const [track, setTrack] = useState<'FE' | 'BE'>(initial?.track ?? defaultTrack ?? 'FE')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [answer, setAnswer] = useState(initial?.answer ?? '')
  const [codeExample, setCodeExample] = useState(initial?.codeExample ?? '')
  const [difficulty, setDifficulty] = useState<ContentDifficulty>(initial?.difficulty ?? 'BEGINNER')
  const [topic, setTopic] = useState(initial?.topic ?? '')
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false)
  const { isSaving, error, conflictId, save } = useContentSave()

  const canSave = title.length >= 5 && answer.length >= 20 && topic.length >= 2

  function goToList() {
    router.push('/admin/content/questions')
  }

  function handleSave() {
    if (isEdit && questionId && initial) {
      save(
        () =>
          updateAdminQuestion(questionId, {
            track,
            title,
            answer,
            codeExample: codeExample || undefined,
            difficulty,
            topic,
            order,
            isPublished,
            expectedUpdatedAt: initial.updatedAt,
          }),
        goToList
      )
    } else {
      save(
        () => createAdminQuestion({ track, title, answer, codeExample: codeExample || undefined, difficulty, topic, order, isPublished }),
        goToList
      )
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SelectField label="Track" value={track} onChange={setTrack} options={TRACK_OPTIONS} />
        <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
        <NumberField label="Order" value={order} onChange={setOrder} min={0} />
      </div>

      <TextField label="Title" value={title} onChange={setTitle} placeholder="What is a closure?" />
      <TextField label="Topic" value={topic} onChange={setTopic} placeholder="Scope & Closures" />
      <TextAreaField label="Answer" value={answer} onChange={setAnswer} rows={8} hint="At least 20 characters" />
      <CodeField label="Code example" value={codeExample} onChange={setCodeExample} language="javascript" hint="Optional" height={160} />

      <ToggleField label="Published" checked={isPublished} onChange={setIsPublished} />

      {conflictId && <ConflictNotice conflictId={conflictId} />}
      {error && <p className="text-sm font-medium text-error">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-rim-subtle pt-4">
        <Button variant="ghost" onClick={goToList}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !canSave}>
          {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create question'}
        </Button>
      </div>
    </div>
  )
}
