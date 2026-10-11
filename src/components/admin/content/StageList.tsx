'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronUp, GripVertical } from 'lucide-react'
import {
  listAdminStages,
  createAdminStage,
  updateAdminStage,
  deleteAdminStage,
  type SystemDesignStage,
} from '@/lib/api/admin'
import { TextField, TextAreaField, NumberField, TagsField } from './FormFields'
import { useContentSave } from './useContentSave'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface StageListProps {
  challengeId: string
}

export function StageList({ challengeId }: StageListProps) {
  const { data: stages, isLoading, refetch } = useQuery({
    queryKey: ['admin-stages', challengeId],
    queryFn: () => listAdminStages(challengeId),
  })

  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete stage "${title}"? This can't be undone.`)) return
    setDeletingId(id)
    setDeleteError(null)
    try {
      await deleteAdminStage(id)
      await refetch()
    } catch {
      setDeleteError("Couldn't delete that stage — try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-[var(--radius-md)]" />
      ) : !stages || stages.length === 0 ? (
        !isCreating && (
          <EmptyState
            icon={<GripVertical size={48} strokeWidth={1.25} className="text-ghost" />}
            headline="No stages yet"
            body="Add the first stage — e.g. Requirements, High-Level Design, Deep Dive, Trade-offs."
          />
        )
      ) : (
        stages.map((stage) => (
          <StageRow
            key={stage.id}
            stage={stage}
            onSaved={() => refetch()}
            onDelete={() => handleDelete(stage.id, stage.title)}
            isDeleting={deletingId === stage.id}
          />
        ))
      )}

      {deleteError && <p className="text-xs font-medium text-error">{deleteError}</p>}

      {isCreating ? (
        <StageCreateForm
          challengeId={challengeId}
          nextOrder={stages?.length ?? 0}
          onDone={() => setIsCreating(false)}
          onSaved={() => {
            setIsCreating(false)
            refetch()
          }}
        />
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setIsCreating(true)}>
          <Plus size={14} /> Add stage
        </Button>
      )}
    </div>
  )
}

function StageRow({
  stage,
  onSaved,
  onDelete,
  isDeleting,
}: {
  stage: SystemDesignStage
  onSaved: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-rim-subtle">
      <div className="flex items-center justify-between gap-3 bg-canvas px-4 py-3">
        <p className="text-sm font-semibold text-ink">
          #{stage.order} {stage.title}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="px-2" onClick={() => setIsEditing((v) => !v)}>
            {isEditing ? <ChevronUp size={14} /> : <Pencil size={14} />}
          </Button>
          <Button variant="ghost" size="sm" className="px-2 text-error hover:bg-error/10" disabled={isDeleting} onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      {isEditing && (
        <div className="border-t border-rim-subtle p-4">
          <StageEditForm stage={stage} onDone={() => setIsEditing(false)} onSaved={onSaved} />
        </div>
      )}
    </div>
  )
}

function StageEditForm({ stage, onDone, onSaved }: { stage: SystemDesignStage; onDone: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(stage.title)
  const [order, setOrder] = useState(stage.order)
  const [guidingQuestions, setGuidingQuestions] = useState(stage.guidingQuestions)
  const [modelAnswer, setModelAnswer] = useState(stage.modelAnswer)
  const [diagramImageUrl, setDiagramImageUrl] = useState(stage.diagramImageUrl ?? '')
  const { isSaving, error, save } = useContentSave()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_100px] gap-4">
        <TextField label="Title" value={title} onChange={setTitle} />
        <NumberField label="Order" value={order} onChange={setOrder} min={0} />
      </div>
      <TagsField label="Guiding questions" value={guidingQuestions} onChange={setGuidingQuestions} placeholder="Add a question, press Enter" />
      <TextAreaField label="Model answer" value={modelAnswer} onChange={setModelAnswer} rows={6} hint="Markdown — the reveal content for this stage" />
      <TextField label="Diagram image URL (optional)" value={diagramImageUrl} onChange={setDiagramImageUrl} placeholder="https://…" />

      {error && <p className="text-xs font-medium text-error">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={isSaving}
          onClick={() =>
            save(
              () => updateAdminStage(stage.id, { title, order, guidingQuestions, modelAnswer, diagramImageUrl: diagramImageUrl || undefined }),
              () => {
                onSaved()
                onDone()
              }
            )
          }
        >
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

function StageCreateForm({
  challengeId,
  nextOrder,
  onDone,
  onSaved,
}: {
  challengeId: string
  nextOrder: number
  onDone: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [order, setOrder] = useState(nextOrder)
  const [guidingQuestions, setGuidingQuestions] = useState<string[]>([])
  const [modelAnswer, setModelAnswer] = useState('')
  const [diagramImageUrl, setDiagramImageUrl] = useState('')
  const { isSaving, error, save } = useContentSave()

  const canSave = title.length >= 3 && modelAnswer.length >= 30

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-rim-subtle bg-canvas p-4">
      <div className="grid grid-cols-[1fr_100px] gap-4">
        <TextField label="Title" value={title} onChange={setTitle} placeholder="High-Level Design" />
        <NumberField label="Order" value={order} onChange={setOrder} min={0} />
      </div>
      <TagsField label="Guiding questions" value={guidingQuestions} onChange={setGuidingQuestions} placeholder="Add a question, press Enter" />
      <TextAreaField label="Model answer" value={modelAnswer} onChange={setModelAnswer} rows={6} hint="Markdown — at least 30 characters" />
      <TextField label="Diagram image URL (optional)" value={diagramImageUrl} onChange={setDiagramImageUrl} placeholder="https://…" />

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
              () => createAdminStage({ challengeId, title, order, guidingQuestions, modelAnswer, diagramImageUrl: diagramImageUrl || undefined }),
              onSaved
            )
          }
        >
          {isSaving ? 'Creating…' : 'Add stage'}
        </Button>
      </div>
    </div>
  )
}
