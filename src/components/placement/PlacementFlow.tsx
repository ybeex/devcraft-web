'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiRequestError } from '@/lib/api/client'
import {
  startPlacement, answerPlacement, PLACEMENT_STALE,
  type PlacementQuestion, type PlacementResult, type SelfReport,
} from '@/lib/api/placement'
import { cn } from '@/lib/utils'

/** "onboarding" sits on the dark gradient (white text); "app" sits on the normal page. */
type Tone = 'onboarding' | 'app'

interface PlacementFlowProps {
  track: 'FE' | 'BE'
  tone: Tone
  /** Called when the learner leaves the result screen. */
  onDone: (result: PlacementResult) => void
  /** Optional "decide later" exit on the first screen. */
  onLater?: () => void
  doneLabel?: string
}

type Phase =
  | { kind: 'choose' }
  | { kind: 'busy'; what: string }
  | { kind: 'quiz'; sessionId: string; question: PlacementQuestion }
  | { kind: 'expired' }
  | { kind: 'result'; result: PlacementResult }

const TONES: Record<Tone, { sub: string; card: string; cardOn: string; link: string; panel: string; alert: string }> = {
  onboarding: {
    sub: 'text-white/90',
    card: 'border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15',
    cardOn: 'border-white bg-white text-ink',
    link: 'text-white underline underline-offset-4 hover:no-underline',
    panel: 'border-white/30 bg-white/10 text-white backdrop-blur-sm',
    alert: 'bg-white text-[var(--negative-text)]',
  },
  app: {
    sub: 'text-dim',
    card: 'border-rim-subtle bg-card text-ink hover:border-rim',
    cardOn: 'border-brand bg-card text-ink ring-2 ring-brand/30',
    link: 'text-brand underline underline-offset-4 hover:no-underline',
    panel: 'border-rim-subtle bg-card text-ink',
    alert: 'border border-rim bg-card text-[var(--negative-text)]',
  },
}

const CHOICES: Array<{ id: SelfReport; title: string; body: string }> = [
  { id: 'new', title: 'I’m new to this', body: 'Start from the very beginning. No questions.' },
  { id: 'some', title: 'I know some of it', body: 'A short check that starts a little further in.' },
  { id: 'test', title: 'Test me', body: 'About 6 questions to find exactly where to start.' },
]

const LEVEL_TEXT: Record<PlacementResult['level'], string> = {
  beginner: 'We’ll start from the fundamentals.',
  intermediate: 'You know the basics, so we’ll skip ahead to where it gets new.',
  advanced: 'You know a lot already, so we’ll start where it gets challenging.',
}

function messageFor(err: unknown): string {
  if (err instanceof ApiRequestError && err.statusCode === 429) return err.message
  return 'Something went wrong on our side. Check your connection and try again.'
}

export function PlacementFlow({ track, tone, onDone, onLater, doneLabel = 'Continue' }: PlacementFlowProps) {
  const t = TONES[tone]
  const [phase, setPhase] = useState<Phase>({ kind: 'choose' })
  const [picked, setPicked] = useState<number | null>(null)   // option position on screen
  const [error, setError] = useState<string | null>(null)
  const [lastChoice, setLastChoice] = useState<SelfReport | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  const focusKey = phase.kind === 'quiz' ? `q:${phase.question.id}` : phase.kind
  // Land keyboard and screen-reader focus on the new screen's heading each time it changes.
  useEffect(() => { heading.current?.focus() }, [focusKey])

  async function begin(selfReport: SelfReport) {
    setError(null); setLastChoice(selfReport); setPicked(null)
    setPhase({ kind: 'busy', what: selfReport === 'new' ? 'Saving' : 'Preparing your questions' })
    try {
      const step = await startPlacement(track, selfReport)
      if (step.done) setPhase({ kind: 'result', result: step.result })
      else setPhase({ kind: 'quiz', sessionId: step.sessionId!, question: step.question })
    } catch (err) {
      setError(messageFor(err)); setPhase({ kind: 'choose' })
    }
  }

  async function submit(choice: number | null) {
    if (phase.kind !== 'quiz') return
    const { sessionId, question } = phase
    setError(null)
    setPhase({ kind: 'busy', what: 'Checking' })
    try {
      const step = await answerPlacement(sessionId, question.id, choice)
      setPicked(null)
      if (step.done) setPhase({ kind: 'result', result: step.result })
      else setPhase({ kind: 'quiz', sessionId, question: step.question })
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === PLACEMENT_STALE && err.details?.['question']) {
        // A double tap or a retry: carry on from the question the server is actually waiting on.
        setPicked(null)
        setPhase({ kind: 'quiz', sessionId, question: err.details['question'] as PlacementQuestion })
      } else if (err instanceof ApiRequestError && err.statusCode === 404) {
        setPhase({ kind: 'expired' })
      } else {
        setError(messageFor(err)); setPhase({ kind: 'quiz', sessionId, question })
      }
    }
  }

  const errorBox = error && (
    <div role="alert" className={cn('mt-6 flex w-full max-w-md items-start gap-2 rounded-[var(--radius-lg)] px-4 py-3 text-left text-sm font-medium', t.alert)}>
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
      <span>{error}</span>
    </div>
  )

  if (phase.kind === 'busy') {
    return (
      <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
        <h2 ref={heading} tabIndex={-1} className="font-display text-2xl font-bold outline-none">{phase.what}…</h2>
      </div>
    )
  }

  if (phase.kind === 'expired') {
    return (
      <div className="flex flex-col items-center text-center">
        <h2 ref={heading} tabIndex={-1} className="font-display text-2xl font-bold outline-none">That check timed out</h2>
        <p className={cn('mt-3 max-w-sm', t.sub)}>It’s only kept for half an hour. Nothing was saved, so you can simply start again.</p>
        <Button onClick={() => { setPhase({ kind: 'choose' }); setError(null) }} className="mt-8 w-full max-w-xs justify-center">Start again</Button>
      </div>
    )
  }

  if (phase.kind === 'result') {
    const r = phase.result
    const where = r.startModule?.title ?? 'the first module'
    return (
      <div className="flex flex-col items-center text-center">
        <h2 ref={heading} tabIndex={-1} className="font-display text-3xl font-bold outline-none sm:text-4xl">
          {r.selfReport === 'new' ? 'Starting from the beginning' : `You’ll start at ${where}`}
        </h2>
        <p className={cn('mt-3 max-w-sm', t.sub)}>
          {r.selfReport === 'new' ? `First up: ${where}.` : r.completedAll ? 'You answered everything we asked, so you’re starting in the last module we could place you in.' : LEVEL_TEXT[r.level]}
        </p>
        {r.tested > 0 && <p className={cn('mt-2 text-sm', t.sub)}>Based on {r.tested} question{r.tested === 1 ? '' : 's'}. You can retake this any time from your learning plan.</p>}
        <Button onClick={() => onDone(r)} className="mt-8 w-full max-w-xs justify-center">{doneLabel} <ArrowRight size={16} aria-hidden /></Button>
      </div>
    )
  }

  if (phase.kind === 'quiz') {
    const q = phase.question
    return (
      <form
        className="flex w-full flex-col items-center text-center"
        onSubmit={(e) => { e.preventDefault(); if (picked !== null) void submit(picked) }}
      >
        <p className={cn('text-xs font-semibold uppercase tracking-wide', t.sub)}>Question {q.number} of about {q.ofAbout}</p>
        <h2 ref={heading} tabIndex={-1} id="placement-q" className="mt-3 max-w-md whitespace-pre-wrap font-display text-xl font-bold outline-none sm:text-2xl">{q.prompt}</h2>

        <div role="radiogroup" aria-labelledby="placement-q" className="mt-8 flex w-full max-w-md flex-col gap-3 text-left">
          {q.options.map((option, i) => {
            const on = picked === i
            return (
              <label key={`${q.id}:${i}`} className="block cursor-pointer">
                <input type="radio" name={`placement-${q.id}`} value={i} checked={on} onChange={() => setPicked(i)} className="peer sr-only" />
                <span className={cn(
                  'flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium transition-colors',
                  'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current',
                  on ? t.cardOn : t.card,
                )}>
                  <span aria-hidden className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border', on ? 'border-current' : 'border-current/50')}>
                    {on && <Check size={11} />}
                  </span>
                  <span>{option}</span>
                </span>
              </label>
            )
          })}
        </div>

        {errorBox}

        <Button type="submit" disabled={picked === null} className="mt-8 w-full max-w-xs justify-center">
          {error ? 'Try again' : 'Next'}
        </Button>
        <button type="button" onClick={() => void submit(null)} className={cn('mt-3 text-sm font-medium', t.link)}>
          I’m not sure
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h2 ref={heading} tabIndex={-1} className="font-display text-3xl font-bold outline-none sm:text-4xl">Where are you starting?</h2>
      <p className={cn('mt-3 max-w-sm', t.sub)}>We’ll pick your first lessons to match. It isn’t a grade, and you can retake it later.</p>

      <div className="mt-10 flex w-full max-w-md flex-col gap-3 text-left">
        {CHOICES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => void begin(c.id)}
            className={cn('rounded-[var(--radius-lg)] border px-5 py-4 transition-colors', t.card)}
          >
            <span className="block text-base font-semibold">{c.title}</span>
            <span className={cn('mt-0.5 block text-sm', tone === 'onboarding' ? 'text-white/85' : 'text-dim')}>{c.body}</span>
          </button>
        ))}
      </div>

      {errorBox}
      {error && lastChoice && <p className={cn('mt-3 text-sm', t.sub)}>Pick one again to retry.</p>}

      {onLater && (
        <button type="button" onClick={onLater} className={cn('mt-6 text-sm font-medium', t.link)}>Decide later</button>
      )}
    </div>
  )
}
