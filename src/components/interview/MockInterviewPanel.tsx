'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TrustBanner } from '@/components/ui/TrustBanner'
import { runMockInterview, type InterviewQuestion } from '@/lib/api/interview'
import { ApiRequestError } from '@/lib/api/client'

export function MockInterviewPanel({ question }: { question: InterviewQuestion }) {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tierLocked, setTierLocked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!answer.trim()) return
    setIsSubmitting(true)
    setError(null)
    setTierLocked(false)
    try {
      const result = await runMockInterview({
        questionId: question.id,
        questionTitle: question.title,
        userAnswer: answer.trim(),
        track: question.track,
        difficulty: question.difficulty,
      })
      setFeedback(result.feedback)
    } catch (err) {
      if (err instanceof ApiRequestError && err.statusCode === 402) {
        setTierLocked(true)
      } else {
        setError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (tierLocked) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6">
        <TrustBanner icon={<Lock />} tone="info">
          Mock interviews with AI feedback are a Pro feature. Upgrade to practice this question out loud.
        </TrustBanner>
        <Link href="/pricing" className="mt-4 block">
          <Button className="w-full justify-center">View Pro plans</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-rim-subtle bg-card p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-brand" />
        <h3 className="font-ui text-sm font-semibold text-ink">Practice out loud</h3>
      </div>
      <p className="text-xs text-dim">Type your answer as you&rsquo;d say it in an interview — AI will give you feedback.</p>

      {error && (
        <TrustBanner icon={<AlertCircle />} className="bg-[var(--negative-bg)] text-[var(--negative-text)]">
          {error}
        </TrustBanner>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        placeholder="Start typing your answer..."
        className="w-full resize-none rounded-[var(--radius-md)] border border-rim bg-canvas px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ghost focus:border-brand"
      />

      <Button onClick={handleSubmit} disabled={isSubmitting || !answer.trim()} className="justify-center">
        {isSubmitting ? 'Getting feedback...' : 'Get AI feedback'}
      </Button>

      {feedback && (
        <div className="rounded-[var(--radius-lg)] bg-raised p-4">
          <p className="font-ui text-xs font-semibold uppercase tracking-wide text-dim">AI feedback</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-dim">{feedback}</p>
        </div>
      )}
    </div>
  )
}
