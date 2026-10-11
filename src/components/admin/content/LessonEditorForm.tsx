'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminLesson, updateAdminLesson, type AdminLesson, type ContentDifficulty } from '@/lib/api/admin'
import { TextField, TextAreaField, NumberField, SelectField, ToggleField, TagsField } from './FormFields'
import { CodeField } from './CodeField'
import { ConflictNotice } from './ConflictNotice'
import { useContentSave } from './useContentSave'
import { Button } from '@/components/ui/Button'

// Scoped to what the Judge0 sandbox can actually execute (see Playground's
// EXECUTABLE_LANGUAGES) — html/css/json/markdown aren't real options for a
// single lesson's code exercise the way they are for the playground's
// multi-file web mode.
const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL (native — runs against real SQLite)' },
]

/**
 * For SQL-topic lessons specifically there are two legitimate ways to grade
 * an exercise, and picking one is a real authoring decision, not just a
 * syntax-highlighting choice — surfaced here so it's made deliberately.
 * See the be-sql module: "Joins & Aggregates" runs real SQL (CREATE VIEW
 * pattern, verified against the actual sqlite3 CLI); "Schema Design" and
 * "Indexes & EXPLAIN" simulate the underlying decision in JS instead,
 * since those are classification/decision exercises, not "write a query"
 * ones, and forcing a query shape onto them would be inauthentic.
 */
function languageEngineNote(language: string): string | null {
  if (language === 'sql') {
    return 'Runs as real SQL against SQLite (Judge0). Best for "write a query" exercises: have the learner finish a CREATE VIEW <name> AS <query>, then have testCode assert against that view — e.g. SELECT CASE WHEN (SELECT COUNT(*) FROM <name>) = 2 THEN \'PASS ...\' ELSE \'FAIL ...\' END;. See the Joins & Aggregates lesson (be-sql) for a full working example.'
  }
  if (language === 'javascript') {
    return 'For topics where the real engine (e.g. a live database, a running server) isn\'t practical to stand up for grading, or the exercise is really a decision/classification task rather than "write a query," JavaScript can simulate the underlying logic instead — see the Schema Design and Indexes & EXPLAIN lessons (be-sql) or REST API Design (be-rest-apis) for this pattern.'
  }
  return null
}

const DIFFICULTY_OPTIONS: { value: ContentDifficulty; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
]

interface LessonEditorFormProps {
  moduleId: string
  /** Present only in edit mode. */
  lessonId?: string
  initial?: AdminLesson
}

export function LessonEditorForm({ moduleId, lessonId, initial }: LessonEditorFormProps) {
  const router = useRouter()
  const isEdit = !!lessonId && !!initial

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [starterCode, setStarterCode] = useState(initial?.starterCode ?? '')
  const [solutionCode, setSolutionCode] = useState(initial?.solutionCode ?? '')
  const [testCode, setTestCode] = useState(initial?.testCode ?? '')
  const [language, setLanguage] = useState(initial?.language ?? 'javascript')
  const [xpReward, setXpReward] = useState(initial?.xpReward ?? 100)
  const [estimatedMins, setEstimatedMins] = useState(initial?.estimatedMins ?? 20)
  const [order, setOrder] = useState(initial?.order ?? 0)
  const [difficulty, setDifficulty] = useState<ContentDifficulty>(initial?.difficulty ?? 'BEGINNER')
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false)
  const [isPremium, setIsPremium] = useState(initial?.isPremium ?? false)
  const [conceptTags, setConceptTags] = useState(initial?.conceptTags ?? [])
  const { isSaving, error, conflictId, save } = useContentSave()

  const canSave = title.length >= 3 && (isEdit || /^[a-z0-9-]+$/.test(slug)) && content.length >= 100

  function goToLessonList() {
    router.push(`/admin/content/modules/${moduleId}/lessons`)
  }

  function handleSave() {
    if (isEdit && lessonId && initial) {
      save(
        () =>
          updateAdminLesson(lessonId, {
            title,
            content,
            starterCode: starterCode || undefined,
            solutionCode: solutionCode || undefined,
            testCode: testCode || undefined,
            language,
            xpReward,
            estimatedMins,
            order,
            difficulty,
            isPublished,
            isPremium,
            conceptTags,
            expectedUpdatedAt: initial.updatedAt,
          }),
        goToLessonList
      )
    } else {
      save(
        () =>
          createAdminLesson({
            moduleId,
            slug,
            title,
            content,
            starterCode: starterCode || undefined,
            solutionCode: solutionCode || undefined,
            testCode: testCode || undefined,
            language,
            xpReward,
            estimatedMins,
            order,
            difficulty,
            isPublished,
            isPremium,
            conceptTags,
          }),
        goToLessonList
      )
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <TextField label="Title" value={title} onChange={setTitle} />

      {!isEdit && (
        <TextField
          label="Slug"
          value={slug}
          onChange={(v) => setSlug(v.toLowerCase())}
          placeholder="intro-to-hooks"
          hint="Lowercase letters, numbers, hyphens only — can't be changed later"
        />
      )}

      <TextAreaField label="Content" value={content} onChange={setContent} rows={10} hint="Markdown — at least 100 characters" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SelectField label="Language" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
        <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_OPTIONS} />
        <NumberField label="Order" value={order} onChange={setOrder} min={0} />
        <NumberField label="XP reward" value={xpReward} onChange={setXpReward} min={0} />
        <NumberField label="Est. minutes" value={estimatedMins} onChange={setEstimatedMins} min={1} />
      </div>

      {languageEngineNote(language) && (
        <p className="rounded-[var(--radius-md)] bg-raised px-3.5 py-2.5 text-xs leading-relaxed text-dim">{languageEngineNote(language)}</p>
      )}

      <TagsField label="Concept tags" value={conceptTags} onChange={setConceptTags} placeholder="Add a tag, press Enter" />

      <CodeField label="Starter code" value={starterCode} onChange={setStarterCode} language={language} hint="Optional" height={160} />
      <CodeField label="Solution code" value={solutionCode} onChange={setSolutionCode} language={language} hint="Optional" height={160} />
      <CodeField label="Test code" value={testCode} onChange={setTestCode} language={language} hint="Optional" height={160} />

      <div className="grid grid-cols-2 gap-4">
        <ToggleField label="Published" checked={isPublished} onChange={setIsPublished} />
        <ToggleField label="Premium" checked={isPremium} onChange={setIsPremium} hint="Restrict to paid tiers" />
      </div>

      {conflictId && <ConflictNotice conflictId={conflictId} />}
      {error && <p className="text-sm font-medium text-error">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-rim-subtle pt-4">
        <Button variant="ghost" onClick={goToLessonList}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !canSave}>
          {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create lesson'}
        </Button>
      </div>
    </div>
  )
}
