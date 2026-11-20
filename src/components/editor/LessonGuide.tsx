'use client'

import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight, Lightbulb, Lock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useId, useState } from 'react'
import type { ErrorHelp, FreeQuota, KnowledgeCheckItem, LessonDetail } from '@/lib/api/lessons'
import { kindLabel, resetTime, stageLabel, unmetPrerequisites } from '@/lib/lesson-guide'
import { cn } from '@/lib/utils'

/** What kind of lesson this is, where it sits, what to know first, and what the learner will be able to do. */
export function LessonOverview({ lesson }: { lesson: LessonDetail }) {
  const stage = stageLabel(lesson.stage)
  const unmet = unmetPrerequisites(lesson.prerequisites)
  return (
    <div className="mb-6 space-y-4" data-testid="lesson-overview">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">{kindLabel(lesson.kind)}</span>
        {stage && <span className="rounded-full bg-raised px-2.5 py-1 text-dim">{stage}</span>}
      </div>
      {unmet.length > 0 && (
        <div role="note" className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-3 text-xs text-dim">
          <p className="font-semibold text-ink">This lesson builds on {unmet.length === 1 ? 'a lesson' : 'lessons'} you have not completed yet</p>
          <ul className="mt-1.5 space-y-1">
            {unmet.map((p) => <li key={p.slug}><Link href={`/lessons/${p.slug}`} className="inline-flex items-center gap-1 text-brand hover:underline"><ChevronRight size={12} />{p.title}</Link></li>)}
          </ul>
          <p className="mt-1.5">You can carry on, but it will make more sense after {unmet.length === 1 ? 'that one' : 'those'}.</p>
        </div>
      )}
      {lesson.objectives && lesson.objectives.length > 0 && (
        <section aria-labelledby="objectives-heading" className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4">
          <h2 id="objectives-heading" className="text-xs font-semibold uppercase tracking-wide text-ghost">By the end of this lesson you will be able to</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {lesson.objectives.map((o) => <li key={o} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden />{o}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}

/** Hints are revealed one at a time, gentlest first, so a learner takes only as much help as they need. */
export function HintLadder({ hints }: { hints: string[] | undefined }) {
  const [shown, setShown] = useState(0)
  if (!hints?.length) return null
  return (
    <section className="mt-8 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-4" aria-labelledby="hints-heading" data-testid="hint-ladder">
      <h2 id="hints-heading" className="flex items-center gap-2 text-sm font-semibold text-ink"><Lightbulb size={15} className="text-brand" aria-hidden /> Stuck? Take a hint</h2>
      {shown > 0 && (
        <ol className="mt-3 space-y-2 text-sm text-dim" aria-live="polite">
          {hints.slice(0, shown).map((h, i) => <li key={h} className="flex gap-2"><span className="font-semibold text-ink">{i + 1}.</span>{h}</li>)}
        </ol>
      )}
      {shown < hints.length
        ? <button type="button" onClick={() => setShown((n) => n + 1)} className="mt-3 rounded-[var(--radius-md)] border border-rim-subtle px-3 py-1.5 text-xs font-semibold text-ink hover:bg-raised">{shown === 0 ? 'Show the first hint' : `Show another hint (${shown} of ${hints.length} shown)`}</button>
        : <p className="mt-3 text-xs text-ghost">That is every hint. Read the lesson text again, or try running your code and reading the message.</p>}
    </section>
  )
}

export function RealWorldNote({ text }: { text: string | null | undefined }) {
  if (!text) return null
  return (
    <aside className="mt-8 rounded-[var(--radius-lg)] border-l-4 border-brand bg-card p-4" data-testid="real-world">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ghost">In real software</h2>
      <p className="mt-1.5 text-sm text-dim">{text}</p>
    </aside>
  )
}

/** Self-check questions. They are for the learner's own understanding; passing the lesson's tests is what completes it. */
export function KnowledgeCheck({ items }: { items: KnowledgeCheckItem[] | undefined }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  if (!items?.length) return null
  const done = Object.keys(answers).length
  const right = items.filter((q, i) => answers[i] === q.answer).length
  return (
    <section className="mt-8" aria-labelledby="check-heading" data-testid="knowledge-check">
      <h2 id="check-heading" className="text-sm font-semibold text-ink">Check your understanding</h2>
      <div className="mt-3 space-y-4">
        {items.map((q, i) => <Question key={q.question} item={q} index={i} chosen={answers[i]} onChoose={(n) => setAnswers((a) => (i in a ? a : { ...a, [i]: n }))} />)}
      </div>
      {done === items.length && <p role="status" className="mt-3 text-xs font-semibold text-dim">{right === items.length ? 'All correct.' : `${right} of ${items.length} correct. Read the explanations above, then carry on.`}</p>}
    </section>
  )
}

function Question({ item, index, chosen, onChoose }: { item: KnowledgeCheckItem; index: number; chosen: number | undefined; onChoose: (n: number) => void }) {
  const name = useId()
  const answered = chosen !== undefined
  return (
    <fieldset className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-3">
      <legend className="px-1 text-sm font-medium text-ink">{index + 1}. {item.question}</legend>
      <div className="mt-2 space-y-1.5">
        {item.options.map((option, n) => {
          const isRight = answered && n === item.answer, isWrong = answered && n === chosen && n !== item.answer
          return (
            <label key={option} className={cn('flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm', answered && 'cursor-default', isRight && 'bg-[var(--positive-bg)] text-[var(--positive-text)]', isWrong && 'bg-error/10 text-error')}>
              <input type="radio" name={name} value={n} checked={chosen === n} disabled={answered} onChange={() => onChoose(n)} className="mt-1" />
              <span>{option}</span>
              {isRight && <CheckCircle2 size={14} className="ml-auto mt-0.5 shrink-0" role="img" aria-label="correct" />}
              {isWrong && <XCircle size={14} className="ml-auto mt-0.5 shrink-0" role="img" aria-label="not correct" />}
            </label>
          )
        })}
      </div>
      {answered && <p className="mt-2 text-xs text-dim" role="status">{chosen === item.answer ? 'Correct. ' : 'Not quite. '}{item.explanation}</p>}
    </fieldset>
  )
}

export function NextStep({ lesson }: { lesson: LessonDetail }) {
  if (!lesson.next) return null
  const done = lesson.progress.status === 'COMPLETED'
  return (
    <nav aria-label="Next lesson" className="mt-8 border-t border-rim-subtle pt-5" data-testid="next-step">
      <p className="text-xs font-semibold uppercase tracking-wide text-ghost">{done ? 'Up next' : 'After this lesson'}</p>
      <Link href={`/lessons/${lesson.next.slug}`} className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">{lesson.next.title}<ArrowRight size={14} aria-hidden /></Link>
    </nav>
  )
}

/** Plain-language explanations for the error or failed check the learner is looking at. */
export function ErrorHelpCard({ matches }: { matches: ErrorHelp[] }) {
  if (!matches.length) return null
  return (
    <div role="region" aria-label="What this error means" className="mx-3 mt-3 space-y-2 font-sans" data-testid="error-help">
      {matches.map((m) => (
        <div key={m.match} className="rounded-[var(--radius-lg)] border border-brand/30 bg-brand/5 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-ink"><AlertCircle size={13} className="text-brand" aria-hidden /> {m.title}</p>
          <p className="mt-1 whitespace-pre-line text-dim">{m.text}</p>
        </div>
      ))}
    </div>
  )
}

/** The free plan's practice runs left today. Shown only to free learners on free practice-database lessons. */
export function FreeQuotaNotice({ quota }: { quota: FreeQuota | null | undefined }) {
  if (!quota) return null
  const low = quota.remaining <= Math.max(10, Math.floor(quota.limit * 0.1))
  return (
    <div className={cn('flex items-center gap-2 border-t border-rim-subtle px-3 py-1.5 font-sans text-[11px]', low ? 'text-error' : 'text-ghost')} data-testid="free-quota">
      <Lock size={11} aria-hidden />
      <span>Free practice: {quota.remaining} of {quota.limit} runs left today{quota.remaining === 0 ? `. They return ${resetTime(quota.resetsAt)}.` : '.'} <Link href="/pricing" className="font-semibold text-brand hover:underline">Pro removes the limit</Link></span>
    </div>
  )
}
